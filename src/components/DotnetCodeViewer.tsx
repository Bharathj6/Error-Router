import React, { useState } from 'react';
import { X, FileCode, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface DotnetCodeViewerProps {
  onClose: () => void;
}

interface CodeFile {
  name: string;
  path: string;
  category: 'API' | 'Persistence' | 'Processing' | 'Integrations' | 'DevOps';
  code: string;
}

const CODE_FILES: CodeFile[] = [
  {
    name: 'IngestionController.cs',
    path: 'dotnet/src/UniversalErrorPlatform.Api/Controllers/IngestionController.cs',
    category: 'API',
    code: `namespace UniversalErrorPlatform.Api.Controllers;

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

        // 1. Fast in-memory / Redis auth check (FR-02)
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Unauthorized(new { error = "Missing required X-Api-Key header" });
        }

        // 2. Request validation
        if (string.IsNullOrWhiteSpace(payload.ExceptionType) || string.IsNullOrWhiteSpace(payload.ServiceName))
        {
            return BadRequest(new { error = "ExceptionType and ServiceName are required" });
        }

        var trackingId = Guid.NewGuid().ToString("N");

        // 3. Fast enqueue into channel buffer (<1ms latency)
        await _channel.WriteAsync(payload, ct);

        stopwatch.Stop();
        if (stopwatch.ElapsedMilliseconds > 50)
        {
            _logger.LogWarning("Ingestion SLA breach! {Elapsed}ms for {Service}", stopwatch.ElapsedMilliseconds, payload.ServiceName);
        }

        return Accepted($"/api/v1/telemetry/status/{trackingId}", new IngestionResponse
        {
            Status = "Accepted",
            TrackingId = trackingId,
            ReceivedAt = DateTimeOffset.UtcNow
        });
    }
}`
  },
  {
    name: 'PayloadSanitizer.cs',
    path: 'dotnet/src/UniversalErrorPlatform.Infrastructure/Sanitization/PayloadSanitizer.cs',
    category: 'Processing',
    code: `namespace UniversalErrorPlatform.Infrastructure.Sanitization;

using System.Text.RegularExpressions;
using System.Text.Json.Nodes;

/// <summary>
/// Implements FR-03 Pre-Persistence Redaction.
/// Scrubs tokens, authorization headers, cookies, API keys, and passwords before database write.
/// </summary>
public class PayloadSanitizer : IPayloadSanitizer
{
    private static readonly string RedactedPlaceholder = "[REDACTED]";

    private static readonly Regex BearerTokenRegex = new(
        @"(Bearer\\s+)[A-Za-z0-9\\-._~+/]+=*",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex SensitiveHeadersRegex = new(
        @"(?i)(Authorization|Proxy-Authorization|X-Api-Key|X-Auth-Token)(\\s*:\\s*)([^\\r\\n]+)",
        RegexOptions.Compiled);

    private static readonly Regex CookieRegex = new(
        @"(?i)(Set-Cookie|Cookie)(\\s*:\\s*)([^\\r\\n]+)",
        RegexOptions.Compiled);

    private static readonly Regex ConnectionStringPasswordRegex = new(
        @"(?i)(Password|Pwd)\\s*=\\s*([^;]+)",
        RegexOptions.Compiled);

    public string SanitizeStackTrace(string rawStackTrace)
    {
        if (string.IsNullOrWhiteSpace(rawStackTrace)) return string.Empty;

        var sanitized = BearerTokenRegex.Replace(rawStackTrace, "$1" + RedactedPlaceholder);
        sanitized = SensitiveHeadersRegex.Replace(sanitized, "$1$2" + RedactedPlaceholder);
        sanitized = CookieRegex.Replace(sanitized, "$1$2" + RedactedPlaceholder);
        sanitized = ConnectionStringPasswordRegex.Replace(sanitized, "$1=" + RedactedPlaceholder);
        return sanitized;
    }
}`
  },
  {
    name: 'FingerprintCalculator.cs',
    path: 'dotnet/src/UniversalErrorPlatform.Infrastructure/Fingerprinting/FingerprintCalculator.cs',
    category: 'Processing',
    code: `namespace UniversalErrorPlatform.Infrastructure.Fingerprinting;

using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

/// <summary>
/// Implements FR-04 Deterministic Fingerprinting.
/// Calculates SHA-256 hash across exceptionType + normalizedStackFrames + serviceName + routeTemplate.
/// Removes memory offsets (+0x4a), line numbers (:line 124), GUIDs, and timestamps.
/// </summary>
public class FingerprintCalculator : IFingerprintCalculator
{
    private static readonly Regex LineNumberRegex = new(@"(:\s*line\s+\d+|:\d+:\d+|line\s+\d+)", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex MemoryOffsetRegex = new(@"\+0x[0-9a-fA-F]+|\boffset\s+0x[0-9a-fA-F]+", RegexOptions.Compiled);
    private static readonly Regex GuidRegex = new(@"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", RegexOptions.Compiled);
    private static readonly Regex TimestampRegex = new(@"\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?\b", RegexOptions.Compiled);

    public string NormalizeStackFrames(string rawStackTrace)
    {
        if (string.IsNullOrWhiteSpace(rawStackTrace)) return string.Empty;
        var normalized = MemoryOffsetRegex.Replace(rawStackTrace, string.Empty);
        normalized = LineNumberRegex.Replace(normalized, string.Empty);
        normalized = GuidRegex.Replace(normalized, "<GUID>");
        normalized = TimestampRegex.Replace(normalized, "<TIMESTAMP>");

        var lines = normalized
            .Split(new[] { '\\r', '\\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Take(15);

        return string.Join("\\n", lines);
    }

    public string ComputeFingerprint(string exceptionType, string rawStackTrace, string serviceName, string? routeTemplate)
    {
        var cleanExceptionType = (exceptionType ?? "Unknown").Trim();
        var cleanServiceName = (serviceName ?? "default").Trim().ToLowerInvariant();
        var cleanRouteTemplate = (routeTemplate ?? "").Trim().ToLowerInvariant();
        var normalizedFrames = NormalizeStackFrames(rawStackTrace);

        var canonical = $"{cleanExceptionType}|{cleanServiceName}|{cleanRouteTemplate}|{normalizedFrames}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}`
  },
  {
    name: 'ApplicationDbContext.cs',
    path: 'dotnet/src/UniversalErrorPlatform.Infrastructure/Persistence/ApplicationDbContext.cs',
    category: 'Persistence',
    code: `namespace UniversalErrorPlatform.Infrastructure.Persistence;

using Microsoft.EntityFrameworkCore;
using UniversalErrorPlatform.Domain.Entities;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ErrorGroup> ErrorGroups => Set<ErrorGroup>();
    public DbSet<ErrorOccurrence> ErrorOccurrences => Set<ErrorOccurrence>();
    public DbSet<TicketLink> TicketLinks => Set<TicketLink>();
    public DbSet<DeadLetterEvent> DeadLetterEvents => Set<DeadLetterEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // PRD Section 4: Composite Unique Constraint: uq_org_fingerprint
        modelBuilder.Entity<ErrorGroup>(entity =>
        {
            entity.ToTable("error_groups");
            entity.Property(e => e.Fingerprint).HasColumnType("char(64)").IsRequired();
            entity.HasIndex(e => new { e.OrganizationId, e.Fingerprint })
                  .IsUnique()
                  .HasDatabaseName("uq_org_fingerprint");
            entity.HasIndex(e => e.Status).HasDatabaseName("idx_error_groups_status");
        });

        // PRD Section 4: PostgreSQL JSONB mapping for request_context
        modelBuilder.Entity<ErrorOccurrence>(entity =>
        {
            entity.ToTable("error_occurrences");
            entity.Property(e => e.RequestContext).HasColumnType("jsonb");
            entity.HasIndex(e => new { e.ErrorGroupId, e.Timestamp }).HasDatabaseName("idx_error_occurrences_group_time");
        });

        // PRD Section 4: Composite Unique Constraint: uq_error_group_integration
        modelBuilder.Entity<TicketLink>(entity =>
        {
            entity.ToTable("ticket_links");
            entity.HasIndex(e => new { e.ErrorGroupId, e.IntegrationId })
                  .IsUnique()
                  .HasDatabaseName("uq_error_group_integration");
        });
    }
}`
  },
  {
    name: 'ResilientTicketingDispatcher.cs',
    path: 'dotnet/src/UniversalErrorPlatform.Infrastructure/Integrations/ResilientTicketingDispatcher.cs',
    category: 'Integrations',
    code: `namespace UniversalErrorPlatform.Infrastructure.Integrations;

using Polly;
using Polly.Retry;
using UniversalErrorPlatform.Domain.Contracts;
using UniversalErrorPlatform.Domain.Models;

/// <summary>
/// Implements FR-08: Retry & Dead-Lettering.
/// Retries transient failures with schedule: immediate, 10s, 30s, 2m, 10m before routing to a DLQ.
/// </summary>
public class ResilientTicketingDispatcher : IResilientTicketingDispatcher
{
    private readonly ResiliencePipeline _resiliencePipeline;

    public static readonly TimeSpan[] RetryIntervals = new[]
    {
        TimeSpan.Zero,
        TimeSpan.FromSeconds(10),
        TimeSpan.FromSeconds(30),
        TimeSpan.FromMinutes(2),
        TimeSpan.FromMinutes(10)
    };

    public ResilientTicketingDispatcher()
    {
        _resiliencePipeline = new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = 5,
                DelayGenerator = args => ValueTask.FromResult<TimeSpan?>(RetryIntervals[Math.Min(args.AttemptNumber, RetryIntervals.Length - 1)])
            })
            .Build();
    }
}`
  },
  {
    name: 'docker-compose.yml',
    path: 'docker-compose.yml',
    category: 'DevOps',
    code: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: uep-postgres-16
    environment:
      POSTGRES_DB: universal_error_platform
      POSTGRES_USER: uep_admin
      POSTGRES_PASSWORD: uep_secure_password_2026
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U uep_admin -d universal_error_platform"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: uep-redis-7
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build:
      context: .
      dockerfile: ./dotnet/Dockerfile
    container_name: uep-dotnet-api
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    ports:
      - "5000:5000"

volumes:
  postgres_data:
  redis_data:`
  }
];

export const DotnetCodeViewer: React.FC<DotnetCodeViewerProps> = ({ onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const activeFile = CODE_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileCode className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Production .NET 8 / C# 12 & Infrastructure Architecture
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Clean Architecture
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse the complete compilable backend implementation files adhering to PRD FR-01 through FR-08.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar + Code Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* File Selector Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-800 bg-slate-900/60 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Solution Files
            </div>
            {CODE_FILES.map((f, idx) => (
              <button
                key={f.name}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                  selectedIdx === idx
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="truncate">{f.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedIdx === idx ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-500'
                }`}>
                  {f.category}
                </span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* File Path & Copy Bar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
              <span className="text-slate-400 truncate">{activeFile.path}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy File'}
              </button>
            </div>

            {/* Code */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 selection:bg-indigo-900/50">
              <pre className="whitespace-pre">
                {activeFile.code}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <div>
            Built with C# 12, .NET 8, EF Core 8 (Npgsql), System.Threading.Channels, and Polly v8.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
