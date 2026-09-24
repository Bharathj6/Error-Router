using Microsoft.EntityFrameworkCore;
using UniversalErrorPlatform.Api.Channels;
using UniversalErrorPlatform.Api.Workers;
using UniversalErrorPlatform.Infrastructure.Fingerprinting;
using UniversalErrorPlatform.Infrastructure.Integrations;
using UniversalErrorPlatform.Infrastructure.Ownership;
using UniversalErrorPlatform.Infrastructure.Persistence;
using UniversalErrorPlatform.Infrastructure.Sanitization;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Database Persistence (PostgreSQL 16 via EF Core & Npgsql)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=universal_error_platform;Username=uep_admin;Password=uep_secure_password_2026;";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
        npgsqlOptions.CommandTimeout(30);
    });
});

// 2. Register Core Processing Pipeline Services
builder.Services.AddSingleton<ITelemetryChannel, TelemetryChannel>();
builder.Services.AddSingleton<IPayloadSanitizer, PayloadSanitizer>();
builder.Services.AddSingleton<IFingerprintCalculator, FingerprintCalculator>();
builder.Services.AddSingleton<IOwnershipMatcher, HierarchicalOwnershipMatcher>();
builder.Services.AddSingleton<IResilientTicketingDispatcher, ResilientTicketingDispatcher>();

// 3. Register Third-Party Ticketing HTTP Clients
builder.Services.AddHttpClient<JiraTicketingProvider>((sp, client) =>
{
    var baseUrl = builder.Configuration["Jira:BaseUrl"] ?? "https://jira.internal.corp";
    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    var token = builder.Configuration["Jira:ApiToken"] ?? "jira-svc-token-dummy";
    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    client.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddHttpClient<AzureDevOpsTicketingProvider>((sp, client) =>
{
    var orgUrl = builder.Configuration["AzureDevOps:OrganizationUrl"] ?? "https://dev.azure.com/internal-corp";
    client.BaseAddress = new Uri(orgUrl);
    var pat = builder.Configuration["AzureDevOps:PatToken"] ?? "ado-pat-dummy";
    var basicAuth = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($":{pat}"));
    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", basicAuth);
    client.Timeout = TimeSpan.FromSeconds(15);
});

// 4. Register Background Ingestion Worker
builder.Services.AddHostedService<TelemetryProcessingWorker>();

// 5. Add Web API Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Universal Production Error Engineering Automation Platform",
        Version = "v1.0.0",
        Description = "Sub-50ms ingestion, PII redaction, SHA-256 fingerprinting, hierarchical ownership, and resilient ticketing."
    });
});

// 6. CORS Policy for Frontend Dashboard
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 7. Health Checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Run migrations on startup in non-testing environments
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        // db.Database.Migrate();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database migration check bypassed during initial boot.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
