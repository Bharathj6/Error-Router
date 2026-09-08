using ErrorRouter.Api.Endpoints;
using ErrorRouter.Application.Abstractions;
using ErrorRouter.Application.Ingestion;
using ErrorRouter.Application.Sanitization;
using ErrorRouter.Application.Tenancy;
using ErrorRouter.Infrastructure.Persistence;
using ErrorRouter.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using ErrorRouter.Infrastructure.Sanitization;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel((context, options) =>
{
	options.Limits.MaxRequestBodySize = context.Configuration.GetValue<long?>("Ingestion:MaxBodyBytes") ?? 262_144;
});
builder.Services.ConfigureHttpJsonOptions(options =>
{
	options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
});

builder.Services.AddHealthChecks();
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<IApiKeyValidator, ApiKeyValidator>();
builder.Services.AddSingleton<IApiKeyService, ApiKeyService>();
builder.Services.AddSingleton<IRequestValidator, IngestionRequestValidator>();
builder.Services.AddSingleton<IRateLimiter, AllowAllRateLimiter>();
builder.Services.AddScoped<IIngestionService, IngestionService>();
builder.Services.AddSingleton<IRedactionPipeline>(_ => new PayloadRedactor(new RedactionOptions
{
	MaxInputBytes = 262_144,
	MaxOutputBytes = 262_144,
	MaxDepth = 16
}));
builder.Services.AddDbContext<ErrorRouterDbContext>((serviceProvider, options) =>
{
	var configuration = serviceProvider.GetRequiredService<IConfiguration>();
	var connectionString = configuration.GetConnectionString("Postgres");
	if (!string.IsNullOrWhiteSpace(connectionString))
	{
		options.UseNpgsql(connectionString);
	}
});

var app = builder.Build();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");
app.MapGet("/", () => "ErrorRouter API is running.");
app.MapIngestionEndpoints();

app.Run();
