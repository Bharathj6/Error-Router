namespace UniversalErrorPlatform.Domain.Models;

public class TelemetryPayload
{
    public Guid OrganizationId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string Environment { get; set; } = "production";
    public string ExceptionType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string RawStackTrace { get; set; } = string.Empty;
    public string? RouteTemplate { get; set; }
    public string? SourceEventId { get; set; }
    public string? Version { get; set; }
    public string? CorrelationId { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    
    // Key/value request context including headers, query params, body, etc.
    public Dictionary<string, object> RequestContext { get; set; } = new();
}

public class IngestionResponse
{
    public string Status { get; set; } = "Accepted";
    public string Message { get; set; } = "Telemetry payload enqueued for processing";
    public string TrackingId { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
}
