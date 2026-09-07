using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Infrastructure.Persistence;

public static class TenantQueryGuard
{
    public static Guid RequireOrganization(TenantScope tenantScope)
    {
        ArgumentNullException.ThrowIfNull(tenantScope);
        if (tenantScope.OrganizationId == Guid.Empty)
        {
            throw new ArgumentException("Tenant scope must contain an organization.", nameof(tenantScope));
        }

        return tenantScope.OrganizationId;
    }

    public static void RequireContextOrganization(ErrorRouterDbContext dbContext, Guid organizationId)
    {
        if (dbContext.TenantOrganizationId is null || dbContext.TenantOrganizationId.Value != organizationId)
        {
            throw new InvalidOperationException("The DbContext tenant does not match the requested organization.");
        }
    }
}