using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Application.Abstractions;

public interface IErrorIngestionService
{
    Task<IngestionResult> IngestAsync(TenantScope tenantScope, CancellationToken cancellationToken = default);
}

public sealed record IngestionResult(bool Accepted, bool Duplicate, Guid? ErrorGroupId);