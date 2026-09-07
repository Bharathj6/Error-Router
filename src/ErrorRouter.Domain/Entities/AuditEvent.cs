namespace ErrorRouter.Domain.Entities;

public sealed class AuditEvent
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string EntityType { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public string EventType { get; private set; } = string.Empty;
    public string Summary { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    private AuditEvent()
    {
    }

    public static AuditEvent Create(Guid organizationId, string entityType, string entityId, string eventType, string summary)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (string.IsNullOrWhiteSpace(entityType))
        {
            throw new ArgumentException("Entity type is required.", nameof(entityType));
        }

        if (string.IsNullOrWhiteSpace(entityId))
        {
            throw new ArgumentException("Entity ID is required.", nameof(entityId));
        }

        if (string.IsNullOrWhiteSpace(eventType))
        {
            throw new ArgumentException("Event type is required.", nameof(eventType));
        }

        if (string.IsNullOrWhiteSpace(summary))
        {
            throw new ArgumentException("Summary is required.", nameof(summary));
        }

        return new AuditEvent
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            EntityType = entityType.Trim(),
            EntityId = entityId.Trim(),
            EventType = eventType.Trim(),
            Summary = summary.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
