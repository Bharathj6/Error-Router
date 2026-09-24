namespace UniversalErrorPlatform.Domain.Entities;

public class ErrorOccurrence
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ErrorGroupId { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public string StackTrace { get; set; } = string.Empty;
    
    // Mapped to PostgreSQL JSONB column with redacted pre-persistence values (FR-03)
    public string? RequestContext { get; set; } 
    public string? Version { get; set; }
    public string? CorrelationId { get; set; }
    public string? SourceEventId { get; set; } // For idempotency checks (FR-05)

    // Navigation properties
    public ErrorGroup ErrorGroup { get; set; } = null!;
}
