using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Domain.Entities;

public sealed class TicketingIntegration
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public TicketProviderType ProviderType { get; private set; }
    public string EncryptedCredentials { get; private set; } = string.Empty;
    public IntegrationStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private TicketingIntegration()
    {
    }

    public static TicketingIntegration Create(Guid id, Guid organizationId, string name, TicketProviderType providerType, string encryptedCredentials, TenantScope tenantScope)
    {
        DomainValidation.RequireId(id, nameof(id), "Integration ID");
        DomainValidation.RequireOrganization(organizationId, tenantScope);
        DomainValidation.RequireText(name, nameof(name), "Integration name");
        DomainValidation.RequireText(encryptedCredentials, nameof(encryptedCredentials), "Encrypted credentials");

        return new TicketingIntegration
        {
            Id = id,
            OrganizationId = organizationId,
            Name = name.Trim(),
            ProviderType = providerType,
            EncryptedCredentials = encryptedCredentials.Trim(),
            Status = IntegrationStatus.Active,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Disable()
    {
        Status = IntegrationStatus.Disabled;
    }
}