namespace ErrorRouter.Domain.Entities;

using ErrorRouter.Domain.ValueObjects;

public sealed class Team
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Slug { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private Team()
    {
    }

    public static Team Create(Guid id, Guid organizationId, string name, string? slug, TenantScope tenantScope)
    {
        DomainValidation.RequireId(id, nameof(id), "Team ID");
        DomainValidation.RequireOrganization(organizationId, tenantScope);
        DomainValidation.RequireText(name, nameof(name), "Team name");

        return new Team
        {
            Id = id,
            OrganizationId = organizationId,
            Name = name.Trim(),
            Slug = string.IsNullOrWhiteSpace(slug) ? null : slug.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}