namespace ErrorRouter.Domain.Repositories;

using ErrorRouter.Domain.Entities;
using ErrorRouter.Domain.ValueObjects;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IOrganizationRepository
{
    Task<Organization?> GetByIdAsync(TenantScope tenantScope, CancellationToken cancellationToken = default);
}

public interface IErrorGroupRepository
{
    Task<ErrorGroup?> FindAsync(TenantScope tenantScope, Fingerprint fingerprint, CancellationToken cancellationToken = default);
    Task AddAsync(ErrorGroup errorGroup, CancellationToken cancellationToken = default);
}

public interface IOutboxJobRepository
{
    Task AddAsync(OutboxJob job, CancellationToken cancellationToken = default);
}

public interface ITicketLinkRepository
{
    Task<TicketLink?> FindAsync(TenantScope tenantScope, Guid errorGroupId, Guid integrationId, CancellationToken cancellationToken = default);
    Task AddAsync(TicketLink ticketLink, CancellationToken cancellationToken = default);
}

public interface IAuditEventRepository
{
    Task AddAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default);
}
