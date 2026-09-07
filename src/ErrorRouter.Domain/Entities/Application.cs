namespace ErrorRouter.Domain.Entities;

public sealed class Application
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    private Application()
    {
    }

    public static Application Create(Guid id, Guid organizationId, string name)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Application ID is required.", nameof(id));
        }

        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Application name is required.", nameof(name));
        }

        return new Application
        {
            Id = id,
            OrganizationId = organizationId,
            Name = name.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
