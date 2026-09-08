namespace ErrorRouter.Application.Sanitization;

public sealed record RedactionInput(
    string JsonPayload,
    IReadOnlyDictionary<string, string?> Headers,
    string? StackTrace = null);

public sealed record RedactionResult(
    string JsonPayload,
    IReadOnlyDictionary<string, string?> Headers,
    string? StackTrace,
    int RedactedValueCount);

public sealed record RedactionRule(string Name, string Pattern, string Replacement);

public sealed record RedactionOptions
{
    public int MaxInputBytes { get; init; } = 256 * 1024;
    public int MaxOutputBytes { get; init; } = 256 * 1024;
    public int MaxDepth { get; init; } = 16;
    public string Replacement { get; init; } = "[REDACTED]";
    public IReadOnlySet<string> SensitiveFieldNames { get; init; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "authorization", "cookie", "proxy-authorization", "password", "passwd", "token", "secret", "client_secret", "api_key", "apikey"
    };
    public IReadOnlyCollection<RedactionRule> CustomRules { get; init; } = Array.Empty<RedactionRule>();
}

public interface IRedactionPipeline
{
    RedactionResult Redact(RedactionInput input);
}