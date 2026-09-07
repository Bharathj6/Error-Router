namespace ErrorRouter.Domain.Entities;

public sealed class DeadLetter
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string JobType { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public string Error { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    private DeadLetter()
    {
    }

    public static DeadLetter Create(Guid organizationId, string jobType, string payload, string error)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (string.IsNullOrWhiteSpace(jobType))
        {
            throw new ArgumentException("Job type is required.", nameof(jobType));
        }

        if (string.IsNullOrWhiteSpace(payload))
        {
            throw new ArgumentException("Payload is required.", nameof(payload));
        }

        if (string.IsNullOrWhiteSpace(error))
        {
            throw new ArgumentException("Error is required.", nameof(error));
        }

        return new DeadLetter
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            JobType = jobType.Trim(),
            Payload = payload.Trim(),
            Error = error.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
