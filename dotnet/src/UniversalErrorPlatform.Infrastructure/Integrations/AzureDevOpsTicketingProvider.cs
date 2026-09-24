namespace UniversalErrorPlatform.Infrastructure.Integrations;

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using UniversalErrorPlatform.Domain.Contracts;
using UniversalErrorPlatform.Domain.Models;

/// <summary>
/// Azure DevOps REST API v7.1 implementation of ITicketingProvider.
/// Uses JSON Patch documents for Work Item tracking.
/// </summary>
public class AzureDevOpsTicketingProvider : ITicketingProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AzureDevOpsTicketingProvider> _logger;
    private readonly string _organizationUrl;
    private readonly string _project;

    public AzureDevOpsTicketingProvider(
        HttpClient httpClient,
        ILogger<AzureDevOpsTicketingProvider> logger,
        string project = "CoreEngineering")
    {
        _httpClient = httpClient;
        _logger = logger;
        _project = project;
        _organizationUrl = httpClient.BaseAddress?.ToString().TrimEnd('/') ?? "https://dev.azure.com/internal-corp";
    }

    public async Task<TicketResult> CreateAsync(TicketRequest request, CancellationToken ct)
    {
        _logger.LogInformation("Creating Azure DevOps WorkItem (Bug) for Error [{Fingerprint}] in Service {Service}",
            request.Fingerprint, request.ServiceName);

        var patchDocument = new List<object>
        {
            new { op = "add", path = "/fields/System.Title", value = request.Title },
            new { op = "add", path = "/fields/System.Description", value = request.Description },
            new { op = "add", path = "/fields/Microsoft.VSTS.Common.Severity", value = "2 - High" },
            new { op = "add", path = "/fields/System.Tags", value = $"UEP;{request.ServiceName};{request.Severity}" }
        };

        if (!string.IsNullOrEmpty(request.AssigneeId))
        {
            patchDocument.Add(new { op = "add", path = "/fields/System.AssignedTo", value = request.AssigneeId });
        }

        var content = new StringContent(
            JsonSerializer.Serialize(patchDocument),
            Encoding.UTF8,
            "application/json-patch+json");

        var response = await _httpClient.PostAsync(
            $"/{_project}/_apis/wit/workitems/$Bug?api-version=7.1",
            content,
            ct);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Azure DevOps WorkItem creation failed with HTTP {StatusCode}: {Error}", response.StatusCode, err);
            return new TicketResult
            {
                Success = false,
                ErrorMessage = $"Azure DevOps HTTP {(int)response.StatusCode}: {err}"
            };
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var workItemId = doc.RootElement.GetProperty("id").GetInt32().ToString();

        return new TicketResult
        {
            Success = true,
            ExternalTicketId = workItemId,
            TicketUrl = $"{_organizationUrl}/{_project}/_workitems/edit/{workItemId}"
        };
    }

    public async Task UpdateAsync(string externalTicketId, TicketUpdate request, CancellationToken ct)
    {
        _logger.LogInformation("Updating Azure DevOps WorkItem #{WorkItemId}", externalTicketId);

        var patchDocument = new List<object>();

        if (request.AppendComment != null)
        {
            patchDocument.Add(new
            {
                op = "add",
                path = "/fields/System.History",
                value = request.AppendComment
            });
        }

        if (request.OccurrenceCount.HasValue)
        {
            patchDocument.Add(new
            {
                op = "add",
                path = "/fields/Custom.OccurrenceCount",
                value = request.OccurrenceCount.Value
            });
        }

        if (patchDocument.Count == 0) return;

        var content = new StringContent(
            JsonSerializer.Serialize(patchDocument),
            Encoding.UTF8,
            "application/json-patch+json");

        var response = await _httpClient.PatchAsync(
            $"/{_project}/_apis/wit/workitems/{externalTicketId}?api-version=7.1",
            content,
            ct);

        response.EnsureSuccessStatusCode();
    }

    public async Task AssignAsync(string externalTicketId, string externalUserId, CancellationToken ct)
    {
        _logger.LogInformation("Assigning Azure DevOps WorkItem #{WorkItemId} to {UserId}", externalTicketId, externalUserId);

        var patch = new[]
        {
            new { op = "add", path = "/fields/System.AssignedTo", value = externalUserId }
        };

        var content = new StringContent(JsonSerializer.Serialize(patch), Encoding.UTF8, "application/json-patch+json");
        var response = await _httpClient.PatchAsync(
            $"/{_project}/_apis/wit/workitems/{externalTicketId}?api-version=7.1",
            content,
            ct);

        response.EnsureSuccessStatusCode();
    }

    public async Task UpdateStatusAsync(string externalTicketId, TicketStatus status, CancellationToken ct)
    {
        _logger.LogInformation("Updating Azure DevOps WorkItem #{WorkItemId} State to {Status}", externalTicketId, status);

        var stateString = status switch
        {
            TicketStatus.InProgress => "Active",
            TicketStatus.Resolved => "Resolved",
            TicketStatus.Closed => "Closed",
            _ => "New"
        };

        var patch = new[]
        {
            new { op = "add", path = "/fields/System.State", value = stateString }
        };

        var content = new StringContent(JsonSerializer.Serialize(patch), Encoding.UTF8, "application/json-patch+json");
        var response = await _httpClient.PatchAsync(
            $"/{_project}/_apis/wit/workitems/{externalTicketId}?api-version=7.1",
            content,
            ct);

        response.EnsureSuccessStatusCode();
    }

    public async Task<TicketDetails> GetAsync(string externalTicketId, CancellationToken ct)
    {
        var response = await _httpClient.GetAsync(
            $"/{_project}/_apis/wit/workitems/{externalTicketId}?$expand=fields&api-version=7.1",
            ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var fields = doc.RootElement.GetProperty("fields");

        var title = fields.GetProperty("System.Title").GetString() ?? string.Empty;
        var state = fields.GetProperty("System.State").GetString() ?? "New";
        string? assignedTo = null;
        if (fields.TryGetProperty("System.AssignedTo", out var a) && a.ValueKind == JsonValueKind.Object)
        {
            assignedTo = a.GetProperty("displayName").GetString();
        }

        return new TicketDetails
        {
            ExternalTicketId = externalTicketId,
            Title = title,
            Status = state,
            Assignee = assignedTo,
            WebUrl = $"{_organizationUrl}/{_project}/_workitems/edit/{externalTicketId}",
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
