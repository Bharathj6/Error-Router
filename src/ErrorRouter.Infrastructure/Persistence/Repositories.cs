using ErrorRouter.Domain.Entities;
using ErrorRouter.Domain.Repositories;
using ErrorRouter.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace ErrorRouter.Infrastructure.Persistence;

public sealed class OrganizationRepository(ErrorRouterDbContext dbContext) : IOrganizationRepository
{
    public Task<Organization?> GetByIdAsync(TenantScope tenantScope, CancellationToken cancellationToken = default)
    {
        var organizationId = TenantQueryGuard.RequireOrganization(tenantScope);
        TenantQueryGuard.RequireContextOrganization(dbContext, organizationId);
        return dbContext.Organizations.SingleOrDefaultAsync(x => x.Id == organizationId, cancellationToken);
    }
}

public sealed class ErrorGroupRepository(ErrorRouterDbContext dbContext) : IErrorGroupRepository
{
    public Task<ErrorGroup?> FindAsync(TenantScope tenantScope, Fingerprint fingerprint, CancellationToken cancellationToken = default)
    {
        var organizationId = TenantQueryGuard.RequireOrganization(tenantScope);
        TenantQueryGuard.RequireContextOrganization(dbContext, organizationId);
        return dbContext.ErrorGroups.SingleOrDefaultAsync(x => x.OrganizationId == organizationId && x.Fingerprint == fingerprint.Value, cancellationToken);
    }

    public Task AddAsync(ErrorGroup errorGroup, CancellationToken cancellationToken = default)
    {
        TenantQueryGuard.RequireContextOrganization(dbContext, errorGroup.OrganizationId);
        return dbContext.ErrorGroups.AddAsync(errorGroup, cancellationToken).AsTask();
    }
}

public sealed class OutboxJobRepository(ErrorRouterDbContext dbContext) : IOutboxJobRepository
{
    public Task AddAsync(OutboxJob job, CancellationToken cancellationToken = default)
    {
        TenantQueryGuard.RequireContextOrganization(dbContext, job.OrganizationId);
        return dbContext.Jobs.AddAsync(job, cancellationToken).AsTask();
    }
}

public sealed class TicketLinkRepository(ErrorRouterDbContext dbContext) : ITicketLinkRepository
{
    public Task<TicketLink?> FindAsync(TenantScope tenantScope, Guid errorGroupId, Guid integrationId, CancellationToken cancellationToken = default)
    {
        var organizationId = TenantQueryGuard.RequireOrganization(tenantScope);
        TenantQueryGuard.RequireContextOrganization(dbContext, organizationId);
        return dbContext.TicketLinks.SingleOrDefaultAsync(
            x => x.OrganizationId == organizationId && x.ErrorGroupId == errorGroupId && x.IntegrationId == integrationId,
            cancellationToken);
    }

    public Task AddAsync(TicketLink ticketLink, CancellationToken cancellationToken = default)
    {
        TenantQueryGuard.RequireContextOrganization(dbContext, ticketLink.OrganizationId);
        return dbContext.TicketLinks.AddAsync(ticketLink, cancellationToken).AsTask();
    }
}

public sealed class AuditEventRepository(ErrorRouterDbContext dbContext) : IAuditEventRepository
{
    public Task AddAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        TenantQueryGuard.RequireContextOrganization(dbContext, auditEvent.OrganizationId);
        return dbContext.AuditEvents.AddAsync(auditEvent, cancellationToken).AsTask();
    }
}