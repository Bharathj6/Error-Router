using ErrorRouter.Domain.Entities;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Application.Abstractions;

public interface IApiKeyService
{
    IssuedApiKey Issue(string name, TenantScope tenantScope, DateTime? expiresAtUtc = null);
    bool Verify(string presentedKey, ApiCredential credential, DateTime nowUtc);
}

public sealed record IssuedApiKey(ApiCredential Credential, string PlaintextKey);

public interface IApiKeyValidator
{
    Task<TenantScope?> ValidateAsync(string presentedKey, CancellationToken cancellationToken = default);
}

public interface ISecretProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedValue);
}

public interface ITenantContext
{
    TenantScope? Current { get; }
    void Set(TenantScope tenantScope);
    void Clear();
}

public interface ITenantProvisioningService
{
    Task<TenantProvisioningResult> ProvisionAsync(string organizationName, string applicationName, string serviceName, string environmentName, CancellationToken cancellationToken = default);
}

public sealed record TenantProvisioningResult(TenantScope TenantScope);