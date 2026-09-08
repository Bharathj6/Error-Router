using System.Security.Cryptography;
using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;
using ErrorRouter.Infrastructure.Security;

namespace ErrorRouter.UnitTests;

public class CredentialSecurityTests
{
    [Fact]
    public void ApiKeyService_Should_Verify_Only_Active_Unexpired_Key()
    {
        var organizationId = Guid.NewGuid();
        var tenantScope = TenantScope.Create(organizationId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var service = new ApiKeyService();
        var issued = service.Issue("production intake", tenantScope, DateTime.UtcNow.AddHours(1));

        Assert.True(service.Verify(issued.PlaintextKey, issued.Credential, DateTime.UtcNow));
        Assert.False(service.Verify(issued.PlaintextKey + "wrong", issued.Credential, DateTime.UtcNow));
        Assert.False(service.Verify(issued.PlaintextKey, issued.Credential, DateTime.UtcNow.AddHours(2)));
        Assert.Equal(organizationId, issued.Credential.OrganizationId);
        Assert.Equal(tenantScope.EnvironmentId, issued.Credential.EnvironmentId);
        Assert.Equal(ApiCredentialStatus.Active, issued.Credential.Status);
        Assert.DoesNotContain(issued.PlaintextKey, issued.Credential.KeyHash, StringComparison.Ordinal);

        issued.Credential.Revoke(DateTime.UtcNow);
        Assert.False(service.Verify(issued.PlaintextKey, issued.Credential, DateTime.UtcNow));
    }

    [Fact]
    public void ApiKeyService_Should_Record_Use_Only_For_Valid_Key()
    {
        var tenantScope = TenantScope.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var issued = new ApiKeyService().Issue("intake", tenantScope);
        var usedAt = DateTime.UtcNow;

        issued.Credential.MarkUsed(usedAt);

        Assert.Equal(usedAt, issued.Credential.LastUsedAtUtc);
    }

    [Fact]
    public void SecretProtector_Should_RoundTrip_And_Use_Key_Identifier()
    {
        var plaintext = "jira-token-value";
        var protector = new AesGcmSecretProtector(RandomNumberGenerator.GetBytes(32), "key-2026-09");

        var protectedValue = protector.Protect(plaintext);

        Assert.StartsWith("v1:key-2026-09:", protectedValue, StringComparison.Ordinal);
        Assert.DoesNotContain(plaintext, protectedValue, StringComparison.Ordinal);
        Assert.Equal(plaintext, protector.Unprotect(protectedValue));
    }

    [Fact]
    public void SecretProtector_Should_Reject_Different_Key_Identifier()
    {
        var protectedValue = new AesGcmSecretProtector(RandomNumberGenerator.GetBytes(32), "key-a").Protect("secret");
        var otherProtector = new AesGcmSecretProtector(RandomNumberGenerator.GetBytes(32), "key-b");

        Assert.Throws<CryptographicException>(() => otherProtector.Unprotect(protectedValue));
    }
}