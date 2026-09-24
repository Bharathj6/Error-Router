namespace UniversalErrorPlatform.Infrastructure.Integrations;

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using UniversalErrorPlatform.Domain.Contracts;
using UniversalErrorPlatform.Domain.Models;

/// <summary>
/// Jira Cloud REST API v3 implementation of ITicketingProvider.
/// </summary>
public class JiraTicketingProvider : ITicketingProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<JiraTicketingProvider> _logger;
    private readonly string _baseUrl;

    public JiraTicketingProvider(HttpClient httpClient, ILogger<JiraTicketingProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = httpClient.BaseAddress?.ToString().TrimEnd('/') ?? "https://jira.internal.corp";
    }

    public async Task<TicketResult> CreateAsync(TicketRequest request, CancellationToken ct)
    {
        _logger.LogInformation("Creating Jira Issue for Error [{Fingerprint}] in Service {Service}",
            request.Fingerprint, request.ServiceName);

        var payload = new
        {
            fields = new
            {
                project = new { key = request.ProjectKey ?? "ERR" },
                summary = request.Title,
                description = new
                {
                    type = "doc",
                    version = 1,
                    content = new[]
                    {
                        new
                        {
                            type = "paragraph",
                            content = new[]
                            {
                                new { type = "text", text = request.Description }
                            }
                        }
                    }
                },
                issuetype = new { name = "Bug" },
                labels = request.Labels.Concat(new[] { "uep-automated", request.ServiceName.ToLowerInvariant() }).ToArray(),
                assignee = !string.IsNullOrEmpty(request.AssigneeId) ? new { id = request.AssigneeId } : null
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("/rest/api/3/issue", content, ct);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Jira issue creation failed with status {StatusCode}: {Error}", response.StatusCode, err);
            return new TicketResult
            {
                Success = false,
                ErrorMessage = $"Jira API HTTP {(int)response.StatusCode}: {err}"
            };
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var issueKey = doc.RootElement.GetProperty("key").GetString() ?? "ERR-UNKNOWN";

        return new TicketResult
        {
            Success = true,
            ExternalTicketId = issueKey,
            TicketUrl = $"{_baseUrl}/browse/{issueKey}"
        };
    }

    public async Task UpdateAsync(string externalTicketId, TicketUpdate request, CancellationToken ct)
    {
        _logger.LogInformation("Updating Jira Issue {IssueKey}", externalTicketId);

        var payload = new
        {
            update = new
            {
                comment = request.AppendComment != null ? new[]
                {
                    new
                    {
                        add = new
                        {
                            body = new
                            {
                                type = "doc",
                                version = 1,
                                content = new[]
                                {
                                    new
                                    {
                                        type = "paragraph",
                                        content = new[] { new { type = "text", text = request.AppendComment } }
                                    }
                                }
                            }
                        }
                    }
                } : null
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PutAsync($"/rest/api/3/issue/{externalTicketId}", content, ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task AssignAsync(string externalTicketId, string externalUserId, CancellationToken ct)
    {
        _logger.LogInformation("Assigning Jira Issue {IssueKey} to {UserId}", externalTicketId, externalUserId);

        var payload = new { accountId = externalUserId };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PutAsync($"/rest/api/3/issue/{externalTicketId}/assignee", content, ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task UpdateStatusAsync(string externalTicketId, TicketStatus status, CancellationToken ct)
    {
        _logger.LogInformation("Updating Jira Issue {IssueKey} status to {Status}", externalTicketId, status);

        // Fetch transition id based on target status
        var transitionId = status switch
        {
            TicketStatus.InProgress => "21",
            TicketStatus.Resolved => "31",
            TicketStatus.Closed => "41",
            _ => "11" // Open/Reopen
        };

        var payload = new
        {
            transition = new { id = transitionId }
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync($"/rest/api/3/issue/{externalTicketId}/transitions", content, ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<TicketDetails> GetAsync(string externalTicketId, CancellationToken ct)
    {
        var response = await _httpClient.GetAsync($"/rest/api/3/issue/{externalTicketId}?fields=summary,status,assignee,updated", ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var fields = doc.RootElement.GetProperty("fields");

        var summary = fields.GetProperty("summary").GetString() ?? string.Empty;
        var status = fields.GetProperty("status").GetProperty("name").GetString() ?? "Open";
        string? assignee = null;
        if (fields.TryGetProperty("assignee", out var a) && a.ValueKind == JsonValueKind.Object)
        {
            assignee = a.GetProperty("displayName").GetString();
        }

        return new TicketDetails
        {
            ExternalTicketId = externalTicketId,
            Title = summary,
            Status = status,
            Assignee = assignee,
            WebUrl = $"{_baseUrl}/browse/{externalTicketId}",
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
