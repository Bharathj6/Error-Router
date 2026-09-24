namespace UniversalErrorPlatform.Api.Workers;

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UniversalErrorPlatform.Api.Channels;
using UniversalErrorPlatform.Domain.Contracts;
using UniversalErrorPlatform.Domain.Entities;
using UniversalErrorPlatform.Domain.Models;
using UniversalErrorPlatform.Infrastructure.Fingerprinting;
using UniversalErrorPlatform.Infrastructure.Integrations;
using UniversalErrorPlatform.Infrastructure.Ownership;
using UniversalErrorPlatform.Infrastructure.Persistence;
using UniversalErrorPlatform.Infrastructure.Sanitization;

/// <summary>
/// Core Background Processing Engine.
/// Consumes asynchronous telemetry events from channel buffer.
/// Applies Sanitization (FR-03), SHA-256 Fingerprinting (FR-04),
/// Idempotent Grouping (FR-05), Ownership Matching (FR-06), and Resilient Dispatch (FR-08).
/// </summary>
public class TelemetryProcessingWorker : BackgroundService
{
    private readonly ITelemetryChannel _channel;
    private readonly IServiceProvider _serviceProvider;
    private readonly IPayloadSanitizer _sanitizer;
    private readonly IFingerprintCalculator _fingerprinter;
    private readonly IOwnershipMatcher _ownershipMatcher;
    private readonly ILogger<TelemetryProcessingWorker> _logger;

    public TelemetryProcessingWorker(
        ITelemetryChannel channel,
        IServiceProvider serviceProvider,
        IPayloadSanitizer sanitizer,
        IFingerprintCalculator fingerprinter,
        IOwnershipMatcher ownershipMatcher,
        ILogger<TelemetryProcessingWorker> logger)
    {
        _channel = channel;
        _serviceProvider = serviceProvider;
        _sanitizer = sanitizer;
        _fingerprinter = fingerprinter;
        _ownershipMatcher = ownershipMatcher;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TelemetryProcessingWorker started listening to channel buffer...");

        await foreach (var payload in _channel.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessPayloadAsync(payload, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing telemetry payload for {Service}", payload.ServiceName);
            }
        }

        _logger.LogInformation("TelemetryProcessingWorker stopped.");
    }

    private async Task ProcessPayloadAsync(TelemetryPayload payload, CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var dispatcher = scope.ServiceProvider.GetRequiredService<IResilientTicketingDispatcher>();

        // 1. Sanitization (FR-03: Pre-Persistence Redaction)
        var sanitizedStackTrace = _sanitizer.SanitizeStackTrace(payload.RawStackTrace);
        var sanitizedContext = _sanitizer.SanitizeDictionary(payload.RequestContext);
        var sanitizedContextJson = JsonSerializer.Serialize(sanitizedContext);

        // 2. Deterministic Fingerprinting (FR-04)
        var fingerprint = _fingerprinter.ComputeFingerprint(
            payload.ExceptionType,
            payload.RawStackTrace,
            payload.ServiceName,
            payload.RouteTemplate);

        _logger.LogDebug("Processed Fingerprint [{Fingerprint}] for Exception {ExceptionType}",
            fingerprint, payload.ExceptionType);

        // 3. Ensure Service exists
        var service = await dbContext.Services
            .FirstOrDefaultAsync(s => s.OrganizationId == payload.OrganizationId &&
                                      s.Name == payload.ServiceName &&
                                      s.Environment == payload.Environment, ct);

        if (service == null)
        {
            service = new Service
            {
                OrganizationId = payload.OrganizationId,
                Name = payload.ServiceName,
                Environment = payload.Environment,
                CreatedAt = DateTimeOffset.UtcNow
            };
            dbContext.Services.Add(service);
            await dbContext.SaveChangesAsync(ct);
        }

        // 4. Grouping & Idempotency (FR-05)
        // Check for existing source_event_id to prevent duplicate processing
        if (!string.IsNullOrEmpty(payload.SourceEventId))
        {
            var alreadyProcessed = await dbContext.ErrorOccurrences
                .AnyAsync(o => o.SourceEventId == payload.SourceEventId &&
                               o.ErrorGroup.OrganizationId == payload.OrganizationId, ct);
            if (alreadyProcessed)
            {
                _logger.LogInformation("Duplicate event skipped for SourceEventId: {EventId}", payload.SourceEventId);
                return;
            }
        }

        // Lookup existing ErrorGroup by composite key: (organization_id, fingerprint)
        var errorGroup = await dbContext.ErrorGroups
            .Include(g => g.TicketLinks)
            .FirstOrDefaultAsync(g => g.OrganizationId == payload.OrganizationId && g.Fingerprint == fingerprint, ct);

        bool isNewGroup = false;

        if (errorGroup == null)
        {
            isNewGroup = true;

            // 5. Hierarchical Ownership Matching (FR-06)
            var ownership = _ownershipMatcher.ResolveOwnership(
                payload.ServiceName,
                payload.Environment,
                payload.RawStackTrace,
                payload.RouteTemplate);

            errorGroup = new ErrorGroup
            {
                OrganizationId = payload.OrganizationId,
                ServiceId = service.Id,
                Fingerprint = fingerprint,
                ExceptionType = payload.ExceptionType,
                Status = "Open",
                OccurrenceCount = 1,
                FirstSeen = payload.Timestamp,
                LastSeen = payload.Timestamp,
                AssignedTeam = ownership.Team,
                AssignedOwner = ownership.PrimaryOwner,
                OwnershipMatchRule = ownership.MatchRule
            };

            dbContext.ErrorGroups.Add(errorGroup);
            await dbContext.SaveChangesAsync(ct);
            _logger.LogInformation("Created new ErrorGroup {GroupId} with Fingerprint {Fingerprint} assigned to {Team}",
                errorGroup.Id, fingerprint, ownership.Team);
        }
        else
        {
            // Increment existing occurrence count and bump last_seen timestamp
            errorGroup.OccurrenceCount += 1;
            errorGroup.LastSeen = payload.Timestamp;

            // If it was resolved, re-open on new occurrence
            if (errorGroup.Status == "Resolved")
            {
                errorGroup.Status = "Open";
            }

            await dbContext.SaveChangesAsync(ct);
        }

        // 6. Persist Sanitized Occurrence (PRD Section 4)
        var occurrence = new ErrorOccurrence
        {
            ErrorGroupId = errorGroup.Id,
            Timestamp = payload.Timestamp,
            StackTrace = sanitizedStackTrace,
            RequestContext = sanitizedContextJson,
            Version = payload.Version,
            CorrelationId = payload.CorrelationId,
            SourceEventId = payload.SourceEventId
        };

        dbContext.ErrorOccurrences.Add(occurrence);
        await dbContext.SaveChangesAsync(ct);

        // 7. Resilient Ticket Dispatch (FR-07, FR-08 & Section 5)
        // If this is a new group, create ticket in configured integration (Jira / Azure DevOps)
        if (isNewGroup)
        {
            var integration = await dbContext.TicketingIntegrations
                .FirstOrDefaultAsync(i => i.OrganizationId == payload.OrganizationId && i.IsActive, ct);

            if (integration != null)
            {
                ITicketingProvider provider = integration.ProviderType.Equals("AzureDevOps", StringComparison.OrdinalIgnoreCase)
                    ? scope.ServiceProvider.GetRequiredService<AzureDevOpsTicketingProvider>()
                    : scope.ServiceProvider.GetRequiredService<JiraTicketingProvider>();

                var ticketRequest = new TicketRequest
                {
                    Title = $"[{payload.ServiceName}] {payload.ExceptionType}: {payload.Message}",
                    Description = $"*Automated incident created by Universal Error Platform*\n\n" +
                                  $"*Service:* {payload.ServiceName}\n" +
                                  $"*Environment:* {payload.Environment}\n" +
                                  $"*Fingerprint:* {fingerprint}\n" +
                                  $"*Assigned Team:* {errorGroup.AssignedTeam}\n" +
                                  $"*Stack Trace:*\n```\n{sanitizedStackTrace}\n```",
                    Severity = "High",
                    ServiceName = payload.ServiceName,
                    Fingerprint = fingerprint,
                    AssigneeId = errorGroup.AssignedOwner,
                    Labels = new List<string> { payload.Environment, "production-triage" }
                };

                var dispatchResult = await dispatcher.DispatchTicketCreationAsync(
                    provider,
                    ticketRequest,
                    errorGroup.Id,
                    integration.Id,
                    dbContext,
                    ct);

                if (dispatchResult.Success)
                {
                    var link = new TicketLink
                    {
                        ErrorGroupId = errorGroup.Id,
                        IntegrationId = integration.Id,
                        ExternalTicketId = dispatchResult.ExternalTicketId,
                        ExternalTicketUrl = dispatchResult.TicketUrl,
                        Status = "Open",
                        LastSyncedAt = DateTimeOffset.UtcNow
                    };

                    dbContext.TicketLinks.Add(link);
                    await dbContext.SaveChangesAsync(ct);
                }
            }
        }
    }
}
