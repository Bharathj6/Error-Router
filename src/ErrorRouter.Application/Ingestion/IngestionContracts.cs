using ErrorRouter.Contracts.Ingestion;
using ErrorRouter.Application.Sanitization;
using ErrorRouter.Domain.ValueObjects;
using System.Text.Json;

namespace ErrorRouter.Application.Ingestion;

public interface IIngestionService
{
    Task<IngestionAcceptance> AcceptAsync(IngestErrorRequest request, TenantScope tenantScope, string correlationId, CancellationToken cancellationToken = default);
}

public interface IRequestValidator
{
    IReadOnlyCollection<string> Validate(IngestErrorRequest request);
}

public interface IRateLimiter
{
    Task<bool> AllowAsync(TenantScope tenantScope, CancellationToken cancellationToken = default);
}

public sealed record IngestionAcceptance(Guid AcceptanceId, bool Duplicate = false);

public sealed class IngestionRequestValidator : IRequestValidator
{
    public IReadOnlyCollection<string> Validate(IngestErrorRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        var errors = new List<string>();

        if (!string.Equals(request.Version, "v1", StringComparison.OrdinalIgnoreCase))
        {
            errors.Add("version must be v1");
        }

        if (request.OccurredAt > DateTimeOffset.UtcNow.AddMinutes(5))
        {
            errors.Add("occurredAt cannot be in the future");
        }

        if (request.Context?.Tags?.Count > 50)
        {
            errors.Add("context.tags cannot contain more than 50 entries");
        }

        return errors;
    }
}

public sealed class IngestionService(IRedactionPipeline redactionPipeline) : IIngestionService
{
    public Task<IngestionAcceptance> AcceptAsync(IngestErrorRequest request, TenantScope tenantScope, string correlationId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(tenantScope);
        if (string.IsNullOrWhiteSpace(correlationId))
        {
            throw new ArgumentException("Correlation ID is required.", nameof(correlationId));
        }

        var payload = JsonSerializer.Serialize(request);
        redactionPipeline.Redact(new RedactionInput(payload, new Dictionary<string, string?>(), request.Exception.StackTrace));
        return Task.FromResult(new IngestionAcceptance(Guid.NewGuid()));
    }
}

public sealed class AllowAllRateLimiter : IRateLimiter
{
    public Task<bool> AllowAsync(TenantScope tenantScope, CancellationToken cancellationToken = default) => Task.FromResult(true);
}