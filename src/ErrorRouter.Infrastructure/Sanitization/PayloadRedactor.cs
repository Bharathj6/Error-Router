using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using ErrorRouter.Application.Sanitization;

namespace ErrorRouter.Infrastructure.Sanitization;

public sealed class PayloadRedactor : IRedactionPipeline
{
    private static readonly string[] ProtectedHeaders = ["authorization", "cookie", "proxy-authorization"];
    private static readonly Regex StackSecretPattern = new(@"(?i)(bearer\s+|(?:password|token|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+", RegexOptions.Compiled | RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(100));
    private readonly RedactionOptions options;
    private readonly IReadOnlyList<(Regex Pattern, string Replacement)> customPatterns;

    public PayloadRedactor(RedactionOptions? options = null)
    {
        this.options = options ?? new RedactionOptions();
        if (this.options.MaxInputBytes <= 0 || this.options.MaxOutputBytes <= 0 || this.options.MaxDepth <= 0 || string.IsNullOrWhiteSpace(this.options.Replacement))
        {
            throw new ArgumentException("Redaction limits and replacement are required.", nameof(options));
        }

        customPatterns = this.options.CustomRules
            .Select(rule =>
            {
                if (string.IsNullOrWhiteSpace(rule.Name) || string.IsNullOrWhiteSpace(rule.Pattern) || string.IsNullOrWhiteSpace(rule.Replacement))
                {
                    throw new ArgumentException("Redaction rules require a name, pattern, and replacement.", nameof(options));
                }

                return (new Regex(rule.Pattern, RegexOptions.Compiled | RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(100)), rule.Replacement);
            })
            .ToArray();
    }

    public RedactionResult Redact(RedactionInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        EnsureBound(input.JsonPayload, options.MaxInputBytes);

        JsonNode? root;
        try
        {
            root = JsonNode.Parse(input.JsonPayload);
        }
        catch (JsonException exception)
        {
            throw new InvalidDataException("The payload could not be safely redacted.", exception);
        }

        var count = 0;
        RedactNode(root, 0, ref count);
        var json = root?.ToJsonString() ?? "null";
        EnsureBound(json, options.MaxOutputBytes);

        var headers = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var header in input.Headers)
        {
            var redacted = ProtectedHeaders.Contains(header.Key, StringComparer.OrdinalIgnoreCase) || IsSensitive(header.Key)
                ? RedactValue(header.Value, ref count)
                : ApplyRules(header.Value, ref count);
            headers[header.Key] = redacted;
        }

        var stackTrace = ApplyRules(StackSecretPattern.Replace(input.StackTrace ?? string.Empty, options.Replacement), ref count);
        return new RedactionResult(json, headers, stackTrace, count);
    }

    private void RedactNode(JsonNode? node, int depth, ref int count)
    {
        if (depth > options.MaxDepth)
        {
            throw new InvalidDataException("The payload exceeds the maximum redaction depth.");
        }

        if (node is JsonObject jsonObject)
        {
            foreach (var property in jsonObject.ToList())
            {
                if (IsSensitive(property.Key))
                {
                    jsonObject[property.Key] = RedactValue(property.Value?.ToJsonString(), ref count);
                }
                else
                {
                    RedactNode(property.Value, depth + 1, ref count);
                }
            }
        }
        else if (node is JsonArray jsonArray)
        {
            foreach (var item in jsonArray)
            {
                RedactNode(item, depth + 1, ref count);
            }
        }
        else if (node is JsonValue jsonValue && jsonValue.TryGetValue<string>(out var value))
        {
            jsonValue.ReplaceWith(ApplyRules(value, ref count));
        }
    }

    private string RedactValue(string? value, ref int count)
    {
        count++;
        return options.Replacement;
    }

    private string? ApplyRules(string? value, ref int count)
    {
        if (value is null)
        {
            return null;
        }

        var result = value;
        foreach (var rule in customPatterns)
        {
            try
            {
            result = rule.Pattern.Replace(result, rule.Replacement);
            }
            catch (RegexMatchTimeoutException)
            {
                throw new InvalidDataException("The payload redaction rule exceeded its time limit.");
            }
        }

        if (!string.Equals(value, result, StringComparison.Ordinal))
        {
            count++;
        }

        return result;
    }

    private bool IsSensitive(string name) => options.SensitiveFieldNames.Contains(name);

    private static void EnsureBound(string value, int maxBytes)
    {
        if (Encoding.UTF8.GetByteCount(value) > maxBytes)
        {
            throw new InvalidDataException("The payload exceeds the maximum redaction size.");
        }
    }
}

public sealed class HeaderRedactor(IRedactionPipeline pipeline)
{
    public IReadOnlyDictionary<string, string?> Redact(IReadOnlyDictionary<string, string?> headers)
    {
        return pipeline.Redact(new RedactionInput("null", headers)).Headers;
    }
}

public sealed class StackTraceRedactor(IRedactionPipeline pipeline)
{
    public string? Redact(string? stackTrace)
    {
        return pipeline.Redact(new RedactionInput("null", new Dictionary<string, string?>(), stackTrace)).StackTrace;
    }
}