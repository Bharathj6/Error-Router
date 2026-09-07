using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Domain.Entities;

public sealed class SourceEventClaim
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public SourceEventKey SourceEvent { get; private set; } = null!;
    public DateTime ClaimedAtUtc { get; private set; }

    private SourceEventClaim()
    {
    }

    public static SourceEventClaim Create(Guid id, Guid organizationId, SourceEventKey sourceEvent, TenantScope tenantScope)
    {
        DomainValidation.RequireId(id, nameof(id), "Source event claim ID");
        DomainValidation.RequireOrganization(organizationId, tenantScope);

        return new SourceEventClaim
        {
            Id = id,
            OrganizationId = organizationId,
            SourceEvent = sourceEvent ?? throw new ArgumentNullException(nameof(sourceEvent)),
            ClaimedAtUtc = DateTime.UtcNow
        };
    }
}