using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Domain.Entities;

public sealed class ApiCredential
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string KeyPrefix { get; private set; } = string.Empty;
    public string KeyHash { get; private set; } = string.Empty;
    public ApiCredentialStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }

    private ApiCredential()
    {
    }

    public static ApiCredential Create(Guid id, Guid organizationId, string name, string keyPrefix, string keyHash, TenantScope tenantScope)
    {
        DomainValidation.RequireId(id, nameof(id), "API credential ID");
        DomainValidation.RequireOrganization(organizationId, tenantScope);
        DomainValidation.RequireText(name, nameof(name), "API credential name");
        DomainValidation.RequireText(keyPrefix, nameof(keyPrefix), "API key prefix");
        DomainValidation.RequireText(keyHash, nameof(keyHash), "API key hash");

        return new ApiCredential
        {
            Id = id,
            OrganizationId = organizationId,
            Name = name.Trim(),
            KeyPrefix = keyPrefix.Trim(),
            KeyHash = keyHash.Trim(),
            Status = ApiCredentialStatus.Active,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Revoke(DateTime revokedAtUtc)
    {
        if (Status == ApiCredentialStatus.Revoked)
        {
            return;
        }

        Status = ApiCredentialStatus.Revoked;
        RevokedAtUtc = revokedAtUtc;
    }
}