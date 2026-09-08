using ErrorRouter.Application.Abstractions;
using ErrorRouter.Application.Ingestion;
using ErrorRouter.Contracts.Ingestion;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Api.Endpoints;

public static class IngestionEndpoints
{
    public static IEndpointRouteBuilder MapIngestionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/v1/ingest", HandleAsync)
            .Accepts<IngestErrorRequest>("application/json")
            .Produces<IngestAcceptedResponse>(StatusCodes.Status202Accepted)
            .Produces<IngestErrorResponse>(StatusCodes.Status400BadRequest)
            .Produces<IngestErrorResponse>(StatusCodes.Status401Unauthorized)
            .Produces<IngestErrorResponse>(StatusCodes.Status413PayloadTooLarge)
            .Produces<IngestErrorResponse>(StatusCodes.Status429TooManyRequests);

        return endpoints;
    }

    private static async Task<IResult> HandleAsync(
        HttpContext httpContext,
        IngestErrorRequest request,
        IApiKeyValidator apiKeyValidator,
        ITenantContext tenantContext,
        IRequestValidator requestValidator,
        IRateLimiter rateLimiter,
        IIngestionService ingestionService,
        CancellationToken cancellationToken)
    {
        var correlationId = GetCorrelationId(httpContext);
        httpContext.Response.Headers["X-Correlation-Id"] = correlationId;

        if (string.IsNullOrWhiteSpace(httpContext.Request.ContentType) ||
            !httpContext.Request.ContentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Json(new IngestErrorResponse("unsupported_media_type", "Content-Type must be application/json.", correlationId), statusCode: StatusCodes.Status415UnsupportedMediaType);
        }

        var presentedKey = httpContext.Request.Headers["X-Api-Key"].FirstOrDefault();
        var tenantScope = await apiKeyValidator.ValidateAsync(presentedKey ?? string.Empty, cancellationToken);
        if (tenantScope is null)
        {
            return Results.Json(new IngestErrorResponse("unauthorized", "A valid API key is required.", correlationId), statusCode: StatusCodes.Status401Unauthorized);
        }

        tenantContext.Set(tenantScope);
        try
        {
            if (!await rateLimiter.AllowAsync(tenantScope, cancellationToken))
            {
                return Results.Json(new IngestErrorResponse("rate_limited", "The ingestion rate limit was exceeded.", correlationId), statusCode: StatusCodes.Status429TooManyRequests);
            }

            var errors = requestValidator.Validate(request);
            if (errors.Count > 0)
            {
                return Results.Json(new IngestErrorResponse("invalid_request", string.Join("; ", errors), correlationId), statusCode: StatusCodes.Status400BadRequest);
            }

            var acceptance = await ingestionService.AcceptAsync(request, tenantScope, correlationId, cancellationToken);
            return Results.Json(new IngestAcceptedResponse(acceptance.AcceptanceId, "accepted", correlationId), statusCode: StatusCodes.Status202Accepted);
        }
        finally
        {
            tenantContext.Clear();
        }
    }

    private static string GetCorrelationId(HttpContext httpContext)
    {
        var requested = httpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault();
        return Guid.TryParse(requested, out var correlationId)
            ? correlationId.ToString("D")
            : Guid.NewGuid().ToString("D");
    }
}