namespace UniversalErrorPlatform.Domain.Models;

public enum TicketStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}

public class TicketRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "High";
    public string ServiceName { get; set; } = string.Empty;
    public string Fingerprint { get; set; } = string.Empty;
    public string? AssigneeId { get; set; }
    public string? ProjectKey { get; set; }
    public List<string> Labels { get; set; } = new();
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public class TicketResult
{
    public bool Success { get; set; }
    public string ExternalTicketId { get; set; } = string.Empty;
    public string TicketUrl { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class TicketUpdate
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? AppendComment { get; set; }
    public int? OccurrenceCount { get; set; }
    public DateTimeOffset? LastSeen { get; set; }
}

public class TicketDetails
{
    public string ExternalTicketId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Assignee { get; set; }
    public string WebUrl { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; }
}
