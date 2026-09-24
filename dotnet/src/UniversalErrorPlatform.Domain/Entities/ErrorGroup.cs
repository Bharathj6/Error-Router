namespace UniversalErrorPlatform.Domain.Entities;

public class ErrorGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ServiceId { get; set; }
    
    // 64-character SHA-256 deterministic fingerprint (FR-04)
    public string Fingerprint { get; set; } = string.Empty;
    public string ExceptionType { get; set; } = string.Empty;
    public string Status { get; set; } = "Open"; // Open, Investigating, Resolved, Ignored
    public int OccurrenceCount { get; set; } = 1;
    public DateTimeOffset FirstSeen { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastSeen { get; set; } = DateTimeOffset.UtcNow;

    // Ownership enrichment (FR-06)
    public string? AssignedTeam { get; set; }
    public string? AssignedOwner { get; set; }
    public string? OwnershipMatchRule { get; set; }

    // Navigation properties
    public Organization Organization { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public ICollection<ErrorOccurrence> Occurrences { get; set; } = new List<ErrorOccurrence>();
    public ICollection<TicketLink> TicketLinks { get; set; } = new List<TicketLink>();
}
