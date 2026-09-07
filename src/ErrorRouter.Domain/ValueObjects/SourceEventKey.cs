namespace ErrorRouter.Domain.ValueObjects;

public sealed record SourceEventKey
{
    public string Value { get; }

    private SourceEventKey(string value)
    {
        Value = value;
    }

    public static SourceEventKey Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Source event key is required.", nameof(value));
        }

        return new SourceEventKey(value.Trim());
    }
}
