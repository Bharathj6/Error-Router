namespace UniversalErrorPlatform.Api.Channels;

using System.Threading.Channels;
using UniversalErrorPlatform.Domain.Models;

public interface ITelemetryChannel
{
    ValueTask<bool> WriteAsync(TelemetryPayload payload, CancellationToken ct = default);
    IAsyncEnumerable<TelemetryPayload> ReadAllAsync(CancellationToken ct = default);
    int CurrentCount { get; }
}

/// <summary>
/// Unbounded high-performance in-memory channel buffer ensuring sub-50ms ingestion latency (FR-02).
/// Decouples HTTP ingestion from persistence and ticketing I/O.
/// </summary>
public class TelemetryChannel : ITelemetryChannel
{
    private readonly Channel<TelemetryPayload> _channel;

    public TelemetryChannel()
    {
        // Configure SingleReader/MultipleWriters for optimized concurrent throughput
        var options = new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false
        };

        _channel = Channel.CreateUnbounded<TelemetryPayload>(options);
    }

    public ValueTask<bool> WriteAsync(TelemetryPayload payload, CancellationToken ct = default)
    {
        return _channel.Writer.WriteAsync(payload, ct);
    }

    public IAsyncEnumerable<TelemetryPayload> ReadAllAsync(CancellationToken ct = default)
    {
        return _channel.Reader.ReadAllAsync(ct);
    }

    public int CurrentCount => _channel.Reader.Count;
}
