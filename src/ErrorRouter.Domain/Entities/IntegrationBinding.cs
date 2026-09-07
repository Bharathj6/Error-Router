using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Domain.Entities;

public sealed class IntegrationBinding
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid IntegrationId { get; private set; }
    public Guid? ApplicationId { get; private set; }
    public Guid? ServiceId { get; private set; }
    public Guid? EnvironmentId { get; private set; }
    public int Priority { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private IntegrationBinding()
    {
    }

    public static IntegrationBinding Create(Guid id, Guid organizationId, Guid integrationId, Guid? applicationId, Guid? serviceId, Guid? environmentId, int priority, TenantScope tenantScope)
    {
        DomainValidation.RequireId(id, nameof(id), "Binding ID");
        DomainValidation.RequireOrganization(organizationId, tenantScope);
        DomainValidation.RequireId(integrationId, nameof(integrationId), "Integration ID");

        if (applicationId is null && serviceId is null && environmentId is null)
        {
            throw new ArgumentException("A binding must target at least one tenant level.", nameof(applicationId));
        }

        return new IntegrationBinding
        {
            Id = id,
            OrganizationId = organizationId,
            IntegrationId = integrationId,
            ApplicationId = applicationId,
            ServiceId = serviceId,
            EnvironmentId = environmentId,
            Priority = priority,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Disable()
    {
        IsActive = false;
    }
}