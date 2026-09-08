using ErrorRouter.Application.Sanitization;
using ErrorRouter.Infrastructure.Sanitization;

namespace ErrorRouter.UnitTests;

public class RedactionPipelineTests
{
    [Fact]
    public void Redactor_Should_Redact_Nested_CaseInsensitive_Secrets_And_Headers()
    {
        var pipeline = new PayloadRedactor();
        var input = new RedactionInput(
            "{\"User\":{\"PASSWORD\":\"hunter2\"},\"items\":[{\"token\":\"abc\"}],\"name\":\"Alice\"}",
            new Dictionary<string, string?>
            {
                ["Authorization"] = "Bearer top-secret",
                ["X-Request-Id"] = "request-1"
            });

        var result = pipeline.Redact(input);

        Assert.DoesNotContain("hunter2", result.JsonPayload, StringComparison.Ordinal);
        Assert.DoesNotContain("abc", result.JsonPayload, StringComparison.Ordinal);
        Assert.Equal("[REDACTED]", result.Headers["Authorization"]);
        Assert.Equal("request-1", result.Headers["X-Request-Id"]);
        Assert.Equal(3, result.RedactedValueCount);
    }

    [Fact]
    public void Redactor_Should_Mask_StackTrace_Secrets_And_Custom_Rules()
    {
        var pipeline = new PayloadRedactor(new RedactionOptions
        {
            CustomRules = [new RedactionRule("email", @"[\w.+-]+@[\w.-]+", "[EMAIL]")]
        });

        var result = pipeline.Redact(new RedactionInput(
            "{\"message\":\"contact a@example.com\"}",
            new Dictionary<string, string?>(),
            "Authorization failed bearer abc123"));

        Assert.DoesNotContain("a@example.com", result.JsonPayload, StringComparison.Ordinal);
        Assert.DoesNotContain("abc123", result.StackTrace, StringComparison.Ordinal);
        Assert.Contains("[EMAIL]", result.JsonPayload, StringComparison.Ordinal);
        Assert.Contains("[REDACTED]", result.StackTrace, StringComparison.Ordinal);
    }

    [Fact]
    public void Redactor_Should_Fail_Closed_On_Malformed_Deep_And_Oversized_Input()
    {
        var pipeline = new PayloadRedactor(new RedactionOptions { MaxDepth = 2, MaxInputBytes = 20 });

        Assert.Throws<InvalidDataException>(() => pipeline.Redact(new RedactionInput("not-json", new Dictionary<string, string?>())));
        Assert.Throws<InvalidDataException>(() => pipeline.Redact(new RedactionInput("{\"a\":{\"b\":{\"c\":1}}}", new Dictionary<string, string?>())));
        Assert.Throws<InvalidDataException>(() => pipeline.Redact(new RedactionInput("{\"value\":\"this is too long\"}", new Dictionary<string, string?>())));
    }
}