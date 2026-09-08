using System.ComponentModel.DataAnnotations;

namespace ErrorRouter.Contracts.Ingestion;

public sealed record IngestErrorRequest
{
    [Required]
    [StringLength(32, MinimumLength = 1)]
    public string Version { get; init; } = "v1";

    [Required]
    [StringLength(256, MinimumLength = 1)]
    public string SourceEventId { get; init; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Service { get; init; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Environment { get; init; } = string.Empty;

    [Required]
    public ExceptionPayload Exception { get; init; } = new();

    public RequestContextPayload? Context { get; init; }

    public DateTimeOffset? OccurredAt { get; init; }
}

public sealed record ExceptionPayload
{
    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string Type { get; init; } = string.Empty;

    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Message { get; init; } = string.Empty;

    [StringLength(100_000)]
    public string? StackTrace { get; init; }
}

public sealed record RequestContextPayload
{
    [StringLength(200)]
    public string? Route { get; init; }

    [StringLength(200)]
    public string? CorrelationId { get; init; }

    public IReadOnlyDictionary<string, string?>? Tags { get; init; }
}

public sealed record IngestAcceptedResponse(Guid AcceptanceId, string Status, string CorrelationId);

public sealed record IngestErrorResponse(string Code, string Message, string CorrelationId);