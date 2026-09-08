using ErrorRouter.Application.Abstractions;
using ErrorRouter.Domain.ValueObjects;
using ErrorRouter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ErrorRouter.Infrastructure.Security;

public sealed class ApiKeyValidator(ErrorRouterDbContext dbContext, IApiKeyService apiKeyService) : IApiKeyValidator
{
    public async Task<TenantScope?> ValidateAsync(string presentedKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(presentedKey))
        {
            return null;
        }

        var prefix = presentedKey[..Math.Min(16, presentedKey.Length)];
        var credential = await dbContext.ApiCredentials
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(x => x.KeyPrefix == prefix, cancellationToken);
        if (credential is null || !apiKeyService.Verify(presentedKey, credential, DateTime.UtcNow))
        {
            return null;
        }

        credential.MarkUsed(DateTime.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TenantScope.Create(credential.OrganizationId, credential.ApplicationId, credential.ServiceId, credential.EnvironmentId);
    }
}