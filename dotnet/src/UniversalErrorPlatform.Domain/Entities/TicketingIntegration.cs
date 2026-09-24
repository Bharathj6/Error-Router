namespace UniversalErrorPlatform.Domain.Entities;

public class TicketingIntegration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string ProviderType { get; set; } = "Jira"; // "Jira" | "AzureDevOps"
    public string ConfigJson { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Organization Organization { get; set; } = null!;
    public ICollection<TicketLink> TicketLinks { get; set; } = new List<TicketLink>();
}
