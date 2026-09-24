namespace UniversalErrorPlatform.Infrastructure.Sanitization;

using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

public interface IPayloadSanitizer
{
    string SanitizeStackTrace(string rawStackTrace);
    string SanitizeJsonContext(string jsonContext);
    Dictionary<string, object> SanitizeDictionary(Dictionary<string, object> context);
}

/// <summary>
/// Implements FR-03 Pre-Persistence Redaction.
/// Scrubs tokens, authorization headers, cookies, API keys, and passwords before database write.
/// </summary>
public class PayloadSanitizer : IPayloadSanitizer
{
    private static readonly string RedactedPlaceholder = "[REDACTED]";

    // Regex patterns for sensitive header values & in-text tokens
    private static readonly Regex BearerTokenRegex = new(
        @"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex GenericTokenRegex = new(
        @"(?i)(api[_-]?key|secret|token|password|passwd|pwd|auth[_-]?token|access[_-]?token|id[_-]?token|refresh[_-]?token|connection[_-]?string)([""']?\s*[:=]\s*[""']?)([^""'\s,;&]+)",
        RegexOptions.Compiled);

    private static readonly Regex CookieRegex = new(
        @"(?i)(Set-Cookie|Cookie)(\s*:\s*)([^\r\n]+)",
        RegexOptions.Compiled);

    private static readonly Regex SensitiveHeadersRegex = new(
        @"(?i)(Authorization|Proxy-Authorization|X-Api-Key|X-Auth-Token)(\s*:\s*)([^\r\n]+)",
        RegexOptions.Compiled);

    private static readonly Regex ConnectionStringPasswordRegex = new(
        @"(?i)(Password|Pwd)\s*=\s*([^;]+)",
        RegexOptions.Compiled);

    private static readonly HashSet<string> SensitiveKeyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "authorization", "proxy-authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token",
        "password", "pwd", "passwd", "secret", "client_secret", "api_key", "apikey",
        "access_token", "refresh_token", "id_token", "token", "private_key", "connection_string",
        "credit_card", "card_number", "cvv", "ssn"
    };

    public string SanitizeStackTrace(string rawStackTrace)
    {
        if (string.IsNullOrWhiteSpace(rawStackTrace))
            return string.Empty;

        var sanitized = BearerTokenRegex.Replace(rawStackTrace, "$1" + RedactedPlaceholder);
        sanitized = SensitiveHeadersRegex.Replace(sanitized, "$1$2" + RedactedPlaceholder);
        sanitized = CookieRegex.Replace(sanitized, "$1$2" + RedactedPlaceholder);
        sanitized = ConnectionStringPasswordRegex.Replace(sanitized, "$1=" + RedactedPlaceholder);
        sanitized = GenericTokenRegex.Replace(sanitized, "$1$2" + RedactedPlaceholder);

        return sanitized;
    }

    public string SanitizeJsonContext(string jsonContext)
    {
        if (string.IsNullOrWhiteSpace(jsonContext))
            return "{}";

        try
        {
            var node = JsonNode.Parse(jsonContext);
            if (node == null) return "{}";

            SanitizeJsonNode(node);
            return node.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
        }
        catch
        {
            // If raw text is not valid JSON, run regex scrubber over the string
            return SanitizeStackTrace(jsonContext);
        }
    }

    public Dictionary<string, object> SanitizeDictionary(Dictionary<string, object> context)
    {
        if (context == null || context.Count == 0)
            return new Dictionary<string, object>();

        var sanitized = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

        foreach (var (key, value) in context)
        {
            if (IsSensitiveKey(key))
            {
                sanitized[key] = RedactedPlaceholder;
            }
            else if (value is string strValue)
            {
                sanitized[key] = SanitizeStackTrace(strValue);
            }
            else if (value is JsonElement element && element.ValueKind == JsonValueKind.Object)
            {
                sanitized[key] = SanitizeJsonContext(element.GetRawText());
            }
            else
            {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private static void SanitizeJsonNode(JsonNode node)
    {
        if (node is JsonObject obj)
        {
            var propertyNames = obj.Select(kvp => kvp.Key).ToList();
            foreach (var prop in propertyNames)
            {
                if (IsSensitiveKey(prop))
                {
                    obj[prop] = RedactedPlaceholder;
                }
                else if (obj[prop] is JsonValue val && val.TryGetValue<string>(out var str))
                {
                    obj[prop] = BearerTokenRegex.Replace(str, "$1" + RedactedPlaceholder);
                }
                else if (obj[prop] != null)
                {
                    SanitizeJsonNode(obj[prop]!);
                }
            }
        }
        else if (node is JsonArray arr)
        {
            foreach (var item in arr)
            {
                if (item != null)
                {
                    SanitizeJsonNode(item);
                }
            }
        }
    }

    private static bool IsSensitiveKey(string key)
    {
        if (SensitiveKeyNames.Contains(key)) return true;
        
        var lower = key.ToLowerInvariant();
        return lower.Contains("password") ||
               lower.Contains("secret") ||
               lower.Contains("token") ||
               lower.Contains("auth") ||
               lower.Contains("apikey") ||
               lower.Contains("cookie");
    }
}
