namespace ErrorRouter.Domain.Entities;

public sealed class Organization
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Slug { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    private Organization()
    {
    }

    public static Organization Create(Guid id, string name, string? slug)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Organization name is required.", nameof(name));
        }

        return new Organization
        {
            Id = id,
            Name = name.Trim(),
            Slug = string.IsNullOrWhiteSpace(slug) ? null : slug.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
