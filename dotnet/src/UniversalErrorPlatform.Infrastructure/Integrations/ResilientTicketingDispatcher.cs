namespace UniversalErrorPlatform.Infrastructure.Integrations;

using System.Text.Json;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;
using UniversalErrorPlatform.Domain.Contracts;
using UniversalErrorPlatform.Domain.Entities;
using UniversalErrorPlatform.Domain.Models;
using UniversalErrorPlatform.Infrastructure.Persistence;

public interface IResilientTicketingDispatcher
{
    Task<TicketResult> DispatchTicketCreationAsync(
        ITicketingProvider provider,
        TicketRequest request,
        Guid errorGroupId,
        Guid? integrationId,
        ApplicationDbContext dbContext,
        CancellationToken ct);
}

/// <summary>
/// Implements FR-08: Retry & Dead-Lettering.
/// Retries transient failures with schedule: immediate, 10s, 30s, 2m, 10m before routing to a DLQ.
/// </summary>
public class ResilientTicketingDispatcher : IResilientTicketingDispatcher
{
    private readonly ILogger<ResilientTicketingDispatcher> _logger;
    private readonly ResiliencePipeline _resiliencePipeline;

    // PRD FR-08 defined exponential backoff schedule
    public static readonly TimeSpan[] RetryIntervals = new[]
    {
        TimeSpan.Zero,                // Attempt 1: Immediate
        TimeSpan.FromSeconds(10),     // Attempt 2: 10s
        TimeSpan.FromSeconds(30),     // Attempt 3: 30s
        TimeSpan.FromMinutes(2),      // Attempt 4: 2m
        TimeSpan.FromMinutes(10)      // Attempt 5: 10m
    };

    public ResilientTicketingDispatcher(ILogger<ResilientTicketingDispatcher> logger)
    {
        _logger = logger;

        // Build Polly v8 Resilience Pipeline
        _resiliencePipeline = new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                ShouldHandle = new PredicateBuilder().Handle<HttpRequestException>().Handle<TimeoutException>(),
                MaxRetryAttempts = 5,
                DelayGenerator = args =>
                {
                    var index = Math.Min(args.AttemptNumber, RetryIntervals.Length - 1);
                    return ValueTask.FromResult<TimeSpan?>(RetryIntervals[index]);
                },
                OnRetry = args =>
                {
                    _logger.LogWarning("Ticketing dispatch transient failure on attempt {Attempt}. Waiting {Delay:c} before retry. Reason: {Message}",
                        args.AttemptNumber + 1, args.RetryDelay, args.Outcome.Exception?.Message);
                    return ValueTask.CompletedTask;
                }
            })
            .Build();
    }

    public async Task<TicketResult> DispatchTicketCreationAsync(
        ITicketingProvider provider,
        TicketRequest request,
        Guid errorGroupId,
        Guid? integrationId,
        ApplicationDbContext dbContext,
        CancellationToken ct)
    {
        int attemptsMade = 0;

        try
        {
            var result = await _resiliencePipeline.ExecuteAsync(async stateToken =>
            {
                attemptsMade++;
                return await provider.CreateAsync(request, stateToken);
            }, ct);

            if (result.Success)
            {
                _logger.LogInformation("Successfully created ticket {TicketId} on attempt {Attempts}",
                    result.ExternalTicketId, attemptsMade);
                return result;
            }

            // If provider returned failure without exception, handle as DLQ route
            await EnqueueDeadLetterAsync(
                dbContext,
                errorGroupId,
                integrationId,
                request,
                result.ErrorMessage ?? "Provider returned unsuccessful result",
                attemptsMade,
                ct);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ticketing dispatch completely exhausted retries for ErrorGroup {GroupId}. Routing to DLQ.", errorGroupId);

            await EnqueueDeadLetterAsync(
                dbContext,
                errorGroupId,
                integrationId,
                request,
                ex.Message,
                attemptsMade,
                ct);

            return new TicketResult
            {
                Success = false,
                ErrorMessage = $"Routed to DLQ after {attemptsMade} attempts: {ex.Message}"
            };
        }
    }

    private async Task EnqueueDeadLetterAsync(
        ApplicationDbContext dbContext,
        Guid errorGroupId,
        Guid? integrationId,
        TicketRequest request,
        string failureReason,
        int retryCount,
        CancellationToken ct)
    {
        try
        {
            var dlq = new DeadLetterEvent
            {
                ErrorGroupId = errorGroupId,
                IntegrationId = integrationId,
                PayloadJson = JsonSerializer.Serialize(request),
                FailureReason = failureReason,
                RetryCount = retryCount,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.DeadLetterEvents.Add(dlq);
            await dbContext.SaveChangesAsync(ct);
            _logger.LogInformation("Persisted DeadLetterEvent {DlqId} for ErrorGroup {GroupId}", dlq.Id, errorGroupId);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "CRITICAL: Failed to write to DeadLetterEvent table for ErrorGroup {GroupId}!", errorGroupId);
        }
    }
}
