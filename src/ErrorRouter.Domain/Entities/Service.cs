namespace ErrorRouter.Domain.Entities;

public sealed class Service
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    private Service()
    {
    }

    public static Service Create(Guid id, Guid organizationId, Guid applicationId, string name)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Service ID is required.", nameof(id));
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
            throw new ArgumentException("Service name is required.", nameof(name));
        }

        return new Service
        {
            Id = id,
            OrganizationId = organizationId,
            ApplicationId = applicationId,
            Name = name.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
