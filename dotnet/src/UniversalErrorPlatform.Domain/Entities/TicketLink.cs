namespace UniversalErrorPlatform.Domain.Entities;

public class TicketLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ErrorGroupId { get; set; }
    public Guid IntegrationId { get; set; }
    public string ExternalTicketId { get; set; } = string.Empty;
    public string Status { get; set; } = "Created";
    public DateTimeOffset LastSyncedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? ExternalTicketUrl { get; set; }

    // Navigation properties
    public ErrorGroup ErrorGroup { get; set; } = null!;
    public TicketingIntegration Integration { get; set; } = null!;
}
