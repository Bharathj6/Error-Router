namespace UniversalErrorPlatform.Domain.Entities;

public class Service
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Environment { get; set; } = "production";
    public string? RepositoryUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation properties
    public Organization Organization { get; set; } = null!;
    public ICollection<ErrorGroup> ErrorGroups { get; set; } = new List<ErrorGroup>();
}
