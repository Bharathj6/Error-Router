namespace ErrorRouter.Domain.ValueObjects;

public sealed record TenantScope
{
    public Guid OrganizationId { get; }
    public Guid ApplicationId { get; }
    public Guid ServiceId { get; }
    public Guid EnvironmentId { get; }

    private TenantScope(Guid organizationId, Guid applicationId, Guid serviceId, Guid environmentId)
    {
        OrganizationId = organizationId;
        ApplicationId = applicationId;
        ServiceId = serviceId;
        EnvironmentId = environmentId;
    }

    public static TenantScope Create(Guid organizationId, Guid applicationId, Guid serviceId, Guid environmentId)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Application ID is required.", nameof(applicationId));
        }

        if (serviceId == Guid.Empty)
        {
            throw new ArgumentException("Service ID is required.", nameof(serviceId));
        }

        if (environmentId == Guid.Empty)
        {
            throw new ArgumentException("Environment ID is required.", nameof(environmentId));
        }

        return new TenantScope(organizationId, applicationId, serviceId, environmentId);
    }
}
