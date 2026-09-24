namespace UniversalErrorPlatform.Infrastructure.Fingerprinting;

using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

public interface IFingerprintCalculator
{
    string ComputeFingerprint(string exceptionType, string rawStackTrace, string serviceName, string? routeTemplate);
    string NormalizeStackFrames(string rawStackTrace);
}

/// <summary>
/// Implements FR-04 Deterministic Fingerprinting.
/// Calculates SHA-256 across exceptionType + normalizedStackFrames + serviceName + routeTemplate.
/// Removes memory offsets, line numbers, GUIDs, and timestamps.
/// </summary>
public class FingerprintCalculator : IFingerprintCalculator
{
    // Regex to strip line numbers: e.g. ":line 124", ":124:5", "line 42"
    private static readonly Regex LineNumberRegex = new(
        @"(:\s*line\s+\d+|:\d+:\d+|line\s+\d+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Regex to strip IL / native memory offsets: e.g. "+0x4a", "+0x0000002f", "offset 0x24"
    private static readonly Regex MemoryOffsetRegex = new(
        @"\+0x[0-9a-fA-F]+|\boffset\s+0x[0-9a-fA-F]+",
        RegexOptions.Compiled);

    // Regex to strip GUIDs: 8-4-4-4-12 hex characters
    private static readonly Regex GuidRegex = new(
        @"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        RegexOptions.Compiled);

    // Regex to strip ISO-8601 timestamps and standard dates
    private static readonly Regex TimestampRegex = new(
        @"\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?\b",
        RegexOptions.Compiled);

    // Regex to strip machine-specific local file paths while preserving relative namespace/file:
    // e.g. "C:\Users\username\repos\app\Services\OrderService.cs" -> "Services\OrderService.cs"
    // or "/var/jenkins/workspace/build/src/Controllers/Pay.cs" -> "Controllers/Pay.cs"
    private static readonly Regex AbsolutePathRegex = new(
        @"([A-Za-z]:\\[^:\n\r]*\\|/(?:home|var|tmp|Users|app|runner)/[^:\n\r]*/)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Regex to collapse consecutive whitespaces
    private static readonly Regex WhitespaceRegex = new(
        @"\s+",
        RegexOptions.Compiled);

    public string NormalizeStackFrames(string rawStackTrace)
    {
        if (string.IsNullOrWhiteSpace(rawStackTrace))
            return string.Empty;

        // 1. Remove memory offsets
        var normalized = MemoryOffsetRegex.Replace(rawStackTrace, string.Empty);

        // 2. Remove line numbers
        normalized = LineNumberRegex.Replace(normalized, string.Empty);

        // 3. Remove GUIDs
        normalized = GuidRegex.Replace(normalized, "<GUID>");

        // 4. Remove Timestamps
        normalized = TimestampRegex.Replace(normalized, "<TIMESTAMP>");

        // 5. Normalize machine file paths
        normalized = AbsolutePathRegex.Replace(normalized, string.Empty);

        // 6. Split by lines, trim each frame, take the top informative frames
        var lines = normalized
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Take(15); // Top 15 normalized frames provide optimal deterministic aggregation

        return string.Join("\n", lines);
    }

    public string ComputeFingerprint(string exceptionType, string rawStackTrace, string serviceName, string? routeTemplate)
    {
        var cleanExceptionType = (exceptionType ?? "UnknownException").Trim();
        var cleanServiceName = (serviceName ?? "default-service").Trim().ToLowerInvariant();
        var cleanRouteTemplate = (routeTemplate ?? "default-route").Trim().ToLowerInvariant();
        var normalizedFrames = NormalizeStackFrames(rawStackTrace);

        // Deterministic composite canonical payload for SHA-256
        var canonicalString = $"{cleanExceptionType}|{cleanServiceName}|{cleanRouteTemplate}|{normalizedFrames}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(canonicalString));

        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
