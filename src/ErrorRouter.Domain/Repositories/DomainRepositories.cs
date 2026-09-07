namespace ErrorRouter.Domain.Repositories;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IOrganizationRepository
{
    Task<Guid?> GetOrganizationIdByTenantAsync(Guid organizationId, CancellationToken cancellationToken = default);
}

public interface IErrorGroupRepository
{
    Task<bool> ExistsAsync(Guid organizationId, string fingerprint, CancellationToken cancellationToken = default);
}

public interface IOutboxJobRepository
{
    Task AddAsync(object job, CancellationToken cancellationToken = default);
}

public interface ITicketLinkRepository
{
    Task<bool> ExistsAsync(Guid organizationId, Guid errorGroupId, Guid integrationId, CancellationToken cancellationToken = default);
}

public interface IAuditEventRepository
{
    Task AddAsync(object auditEvent, CancellationToken cancellationToken = default);
}
