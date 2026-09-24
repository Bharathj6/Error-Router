namespace UniversalErrorPlatform.Domain.Entities;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation properties
    public ICollection<Service> Services { get; set; } = new List<Service>();
    public ICollection<ErrorGroup> ErrorGroups { get; set; } = new List<ErrorGroup>();
    public ICollection<TicketingIntegration> Integrations { get; set; } = new List<TicketingIntegration>();
}
