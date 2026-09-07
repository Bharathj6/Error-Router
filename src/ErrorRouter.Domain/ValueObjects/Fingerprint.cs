using System.Text.RegularExpressions;

namespace ErrorRouter.Domain.ValueObjects;

public sealed record Fingerprint
{
    private static readonly Regex HexPattern = new("^[0-9a-fA-F]{6,64}$", RegexOptions.Compiled);

    public string Value { get; }

    private Fingerprint(string value)
    {
        Value = value;
    }

    public static Fingerprint Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Fingerprint value is required.", nameof(value));
        }

        var normalized = value.Trim();
        if (!HexPattern.IsMatch(normalized))
        {
            throw new ArgumentException("Fingerprint must be a valid hexadecimal value.", nameof(value));
        }

        return new Fingerprint(normalized);
    }
}
