namespace ErrorRouter.Domain.Entities;

public sealed class Environment
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool IsProduction { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private Environment()
    {
    }

    public static Environment Create(Guid id, Guid organizationId, Guid applicationId, string name, bool isProduction)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Environment ID is required.", nameof(id));
        }

        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Application ID is required.", nameof(applicationId));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Environment name is required.", nameof(name));
        }

        return new Environment
        {
            Id = id,
            OrganizationId = organizationId,
            ApplicationId = applicationId,
            Name = name.Trim(),
            IsProduction = isProduction,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
