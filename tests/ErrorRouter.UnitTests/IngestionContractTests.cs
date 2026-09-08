using System.Text.Json;
using ErrorRouter.Application.Ingestion;
using ErrorRouter.Contracts.Ingestion;

namespace ErrorRouter.UnitTests;

public class IngestionContractTests
{
    [Fact]
    public void Request_Should_RoundTrip_Versioned_Contract()
    {
        var request = new IngestErrorRequest
        {
            SourceEventId = "evt-123",
            Service = "payments",
            Environment = "production",
            Exception = new ExceptionPayload
            {
                Type = "InvalidOperationException",
                Message = "Payment failed",
                StackTrace = "at Payments.Process()"
            },
            Context = new RequestContextPayload { Route = "POST /payments", CorrelationId = "corr-1" }
        };

        var restored = JsonSerializer.Deserialize<IngestErrorRequest>(JsonSerializer.Serialize(request));

        Assert.NotNull(restored);
        Assert.Equal("v1", restored.Version);
        Assert.Equal("evt-123", restored.SourceEventId);
        Assert.Equal("InvalidOperationException", restored.Exception.Type);
    }

    [Fact]
    public void Validator_Should_Reject_Unsupported_Version_And_Future_Event()
    {
        var request = new IngestErrorRequest
        {
            Version = "v2",
            SourceEventId = "evt-123",
            Service = "payments",
            Environment = "production",
            Exception = new ExceptionPayload { Type = "Error", Message = "failed" },
            OccurredAt = DateTimeOffset.UtcNow.AddMinutes(6)
        };

        var errors = new IngestionRequestValidator().Validate(request);

        Assert.Contains("version must be v1", errors);
        Assert.Contains("occurredAt cannot be in the future", errors);
    }

    [Fact]
    public void Validator_Should_Enforce_Tag_Bound()
    {
        var tags = Enumerable.Range(1, 51).ToDictionary(x => $"tag-{x}", x => (string?)x.ToString());
        var request = new IngestErrorRequest
        {
            SourceEventId = "evt-123",
            Service = "payments",
            Environment = "production",
            Exception = new ExceptionPayload { Type = "Error", Message = "failed" },
            Context = new RequestContextPayload { Tags = tags }
        };

        Assert.Contains("context.tags cannot contain more than 50 entries", new IngestionRequestValidator().Validate(request));
    }
}