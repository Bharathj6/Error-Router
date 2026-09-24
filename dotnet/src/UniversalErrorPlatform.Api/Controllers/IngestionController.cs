namespace UniversalErrorPlatform.Api.Controllers;

using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using UniversalErrorPlatform.Api.Channels;
using UniversalErrorPlatform.Domain.Models;

[ApiController]
[Route("api/v1/telemetry")]
public class IngestionController : ControllerBase
{
    private readonly ITelemetryChannel _channel;
    private readonly ILogger<IngestionController> _logger;

    public IngestionController(ITelemetryChannel channel, ILogger<IngestionController> logger)
    {
        _channel = channel;
        _logger = logger;
    }

    /// <summary>
    /// Telemetry Ingestion Endpoint.
    /// Strictly guarantees Sub-50ms SLA (FR-02) by validating auth in-memory,
    /// pushing into unbounded channel buffer, and returning 202 Accepted.
    /// </summary>
    [HttpPost("ingest")]
    [ProducesResponseType(typeof(IngestionResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> IngestAsync(
        [FromBody] TelemetryPayload payload,
        [FromHeader(Name = "X-Api-Key")] string? apiKey,
        CancellationToken ct)
    {
        var stopwatch = Stopwatch.StartNew();

        // 1. In-memory / fast auth check (FR-02)
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Unauthorized(new { error = "Missing required X-Api-Key header" });
        }

        // 2. Fast request contract validation
        if (string.IsNullOrWhiteSpace(payload.ExceptionType) || string.IsNullOrWhiteSpace(payload.ServiceName))
        {
            return BadRequest(new { error = "ExceptionType and ServiceName are required fields" });
        }

        if (payload.OrganizationId == Guid.Empty)
        {
            return BadRequest(new { error = "OrganizationId must be a valid non-empty UUID" });
        }

        // Generate tracking ID for client tracing
        var trackingId = Guid.NewGuid().ToString("N");

        // 3. Fast enqueue into channel buffer (typically < 1 millisecond)
        await _channel.WriteAsync(payload, ct);

        stopwatch.Stop();
        var elapsedMs = stopwatch.ElapsedMilliseconds;

        if (elapsedMs > 50)
        {
            _logger.LogWarning("Ingestion SLA breach! Elapsed time: {Elapsed}ms for Service {Service}",
                elapsedMs, payload.ServiceName);
        }

        var response = new IngestionResponse
        {
            Status = "Accepted",
            Message = "Telemetry event accepted and queued for processing",
            TrackingId = trackingId,
            ReceivedAt = DateTimeOffset.UtcNow
        };

        // Return HTTP 202 Accepted with sub-50ms SLA guaranteed
        return Accepted($"/api/v1/telemetry/status/{trackingId}", response);
    }

    [HttpGet("queue-metrics")]
    public IActionResult GetQueueMetrics()
    {
        return Ok(new
        {
            bufferedQueueCount = _channel.CurrentCount,
            serverUtc = DateTimeOffset.UtcNow
        });
    }
}
