using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace ErrorRouter.Infrastructure.Persistence;

public sealed class TenantSaveChangesInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        ValidateTenant(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ValidateTenant(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void ValidateTenant(DbContext? context)
    {
        if (context is not ErrorRouterDbContext dbContext)
        {
            return;
        }

        foreach (var entry in dbContext.ChangeTracker.Entries().Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            var organizationProperty = entry.Metadata.FindProperty("OrganizationId");
            if (organizationProperty is null)
            {
                continue;
            }

            if (dbContext.TenantOrganizationId is null || entry.Property(organizationProperty.Name).CurrentValue is not Guid organizationId || organizationId != dbContext.TenantOrganizationId.Value)
            {
                throw new InvalidOperationException("A write must be scoped to the current organization.");
            }
        }
    }
}