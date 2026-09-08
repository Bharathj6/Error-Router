using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Domain.Entities;

public sealed class ApiCredential
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ApplicationId { get; private set; }
    public Guid ServiceId { get; private set; }
    public Guid EnvironmentId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string KeyPrefix { get; private set; } = string.Empty;
    public string KeyHash { get; private set; } = string.Empty;
    public ApiCredentialStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? ExpiresAtUtc { get; private set; }
    public DateTime? LastUsedAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }

    private ApiCredential()
    {
    }

    public static ApiCredential Create(Guid id, Guid organizationId, string name, string keyPrefix, string keyHash, TenantScope tenantScope, DateTime? expiresAtUtc = null)
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
            ApplicationId = tenantScope.ApplicationId,
            ServiceId = tenantScope.ServiceId,
            EnvironmentId = tenantScope.EnvironmentId,
            Name = name.Trim(),
            KeyPrefix = keyPrefix.Trim(),
            KeyHash = keyHash.Trim(),
            Status = ApiCredentialStatus.Active,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = expiresAtUtc
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

    public bool IsValidAt(DateTime nowUtc) => Status == ApiCredentialStatus.Active && (ExpiresAtUtc is null || ExpiresAtUtc > nowUtc);

    public void MarkUsed(DateTime usedAtUtc)
    {
        if (IsValidAt(usedAtUtc))
        {
            LastUsedAtUtc = usedAtUtc;
        }
    }
}