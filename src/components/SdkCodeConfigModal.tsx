import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  GitBranch, 
  ExternalLink,
  Zap,
  Info,
  AlertTriangle,
  Bug
} from 'lucide-react';
import { StackRuntime } from '../types';

interface SdkCodeConfigModalProps {
  onClose: () => void;
}

interface SdkSpec {
  id: StackRuntime;
  label: string;
  badge: string;
  badgeColor: string;
  installCommand: string;
  fileName: string;
  sampleCode: string;
  description: string;
}

const SDK_SPECS: SdkSpec[] = [
  {
    id: 'node',
    label: 'Node.js / TypeScript',
    badge: '@uep/node v1.4.0',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    installCommand: 'npm install @uep/node @uep/tracing',
    fileName: 'src/index.ts',
    description: 'Automatic capture for Express, Fastify, NestJS, and standalone async workers with unhandled rejection tracking.',
    sampleCode: `import * as UEP from "@uep/node";

// 1. Initialize UEP SDK in your entry point
UEP.init({
  dsn: "https://uep.acme.corp/api/v1/telemetry/ingest",
  apiKey: process.env.UEP_API_KEY, // Auto-verified in-memory (<1ms)
  environment: process.env.NODE_ENV || "production",
  release: "checkout-service@v2.14.0",
  
  // Connect code repository for Line-Level Git Blame
  git: {
    repository: "acme-corp/checkout-service-node",
    commitSha: process.env.GIT_COMMIT_SHA, // e.g. 7f9b21a
    branch: "main"
  },

  // Tool integrations: JIRA & Azure Boards auto-dispatch
  orchestration: {
    autoAssignToCommitter: true, // Finds committer of the failing line
    createJiraTicket: true,
    createAzureBoardsBug: true
  },
  
  // Sensitive Data Redaction rules (FR-03 zero PII leakage)
  sanitization: {
    redactHeaders: ["Authorization", "Cookie", "X-Api-Key"],
    redactBodyKeys: ["password", "token", "cardNumber", "cvv"]
  }
});

// 2. Logging & Capturing at code level
try {
  UEP.addBreadcrumb({
    category: "payment",
    message: "Initiating payment confirmation intent",
    level: "info",
    data: { orderId: "ord_99182", amount: 14900 }
  });

  const charge = await stripeClient.confirm(intentId);
} catch (err) {
  // Pop the error: UEP captures stack trace line (e.g. line 184),
  // identifies Git committer via GitHub API, and creates JIRA & Azure Boards tickets!
  UEP.captureException(err, {
    tags: { section: "checkout", gateway: "stripe" },
    extra: { customerId: "cust_8812" }
  });
}

// 3. Informational & Warning logs in UEP Dashboard
UEP.logWarning("Payment gateway latency elevated above threshold", {
  currentLatencyMs: 1420,
  p99Target: 500
});

UEP.logInfo("Reconciliation batch processed successfully", {
  batchId: "batch-2026-09",
  count: 850
});`
  },
  {
    id: 'python',
    label: 'Python',
    badge: 'uep-sdk v1.2.1',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    installCommand: 'pip install uep-python celery-uep',
    fileName: 'app/main.py',
    description: 'Integrates with FastAPI, Django, Flask, and Celery workers with traceback line-blame resolution.',
    sampleCode: `import uep
import os

# 1. Initialize UEP in your application bootstrap
uep.init(
    dsn="https://uep.acme.corp/api/v1/telemetry/ingest",
    api_key=os.getenv("UEP_API_KEY"),
    environment=os.getenv("ENV", "production"),
    release="billing-worker@v3.1.2",
    
    # Git Blame Repository Linking
    git_repo="acme-corp/billing-worker-py",
    commit_sha=os.getenv("COMMIT_SHA"),
    
    # Automated Ticket Assignment to Recent Committer
    auto_orchestrate={
        "jira": {"project_key": "PAY", "auto_assign": True},
        "azure_boards": {"area_path": "CoreEngineering\\\\Billing", "auto_assign": True}
    }
)

# 2. Add Breadcrumbs and Capture Unhandled Errors
uep.add_breadcrumb(
    category="tax_calc",
    message="Applying compound VAT rate for EU jurisdiction",
    level="info",
    data={"country": "DE", "marginal_rate": 0.19}
)

try:
    tax_result = calculate_compound_tax(invoice.amount, invoice.tax_profile)
except Exception as exc:
    # Captures exact traceback line (tax_engine.py:92), blames recent author
    # and dispatches JIRA & Azure Boards tickets directly to them!
    uep.capture_exception(exc, extra={"invoice_id": invoice.id})

# 3. Log Warnings & Info directly to UEP UI
uep.log_warning("Currency exchange rate stale by > 4 hours", currency="EUR")
uep.log_info("Tax ledger sync completed", reconciled_entries=1420)`
  },
  {
    id: 'go',
    label: 'Go (Golang)',
    badge: 'go.uep.io/sdk v1.1.0',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    installCommand: 'go get -u go.uep.io/sdk',
    fileName: 'cmd/server/main.go',
    description: 'Ultra-lightweight Go SDK with zero-allocation stack capture, HTTP middleware, and goroutine panic recovery.',
    sampleCode: `package main

import (
    "os"
    "go.uep.io/sdk"
)

func main() {
    // 1. Initialize UEP Go Client
    client, err := uep.Init(uep.Config{
        Dsn:         "https://uep.acme.corp/api/v1/telemetry/ingest",
        ApiKey:      os.Getenv("UEP_API_KEY"),
        Environment: "production",
        Release:     "auth-gateway@v1.18.4",
        GitRepo:     "acme-corp/auth-gateway-go",
        CommitSha:   os.Getenv("GIT_COMMIT"),
        AutoOrchestration: uep.OrchestrationConfig{
            AutoAssignCommitter: true, // Assigns to author of validator.go:64
            JiraProject:         "SEC",
            AzureBoardsArea:     "CoreEngineering\\\\Security",
        },
    })
    if err != nil {
        panic(err)
    }
    defer client.Flush()

    // 2. Add Breadcrumb and Recover Panics
    defer client.RecoverPanic()

    client.AddBreadcrumb(&uep.Breadcrumb{
        Category: "auth",
        Message:  "Validating JWT claims and token expiry window",
        Level:    uep.LevelInfo,
    })

    claims, err := validator.VerifySessionToken(rawToken)
    if err != nil {
        // Log warning or capture exception
        client.CaptureError(err, map[string]interface{}{
            "session_id": "sess_99182",
            "caller_ip":  "198.51.100.99",
        })
    }

    client.LogInfo("JWT cluster keys rotated successfully", nil)
}`
  },
  {
    id: 'dotnet',
    label: '.NET 8 / C#',
    badge: 'UniversalErrorPlatform.AspNetCore v2.0.0',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    installCommand: 'dotnet add package UniversalErrorPlatform.AspNetCore',
    fileName: 'Program.cs',
    description: 'Native ASP.NET Core middleware, EF Core interceptors, and background worker crash handlers.',
    sampleCode: `var builder = WebApplication.CreateBuilder(args);

// 1. Register UEP in dependency injection container
builder.Services.AddUniversalErrorPlatform(options =>
{
    options.Dsn = "https://uep.acme.corp/api/v1/telemetry/ingest";
    options.ApiKey = builder.Configuration["UEP:ApiKey"];
    options.Environment = builder.Environment.EnvironmentName;
    options.Release = "order-service@v2.10.8";
    
    // Connect Git repository for line blame
    options.GitRepository = "acme-corp/order-service-dotnet";
    options.CommitSha = builder.Configuration["BUILD_SOURCEVERSION"];
    
    // Orchestration to JIRA & Azure Boards
    options.Orchestration.AutoAssignResponsibleCommitter = true;
    options.Orchestration.JiraProjectKey = "PAY";
    options.Orchestration.AzureBoardsArea = @"CoreEngineering\\Orders";
});

var app = builder.Build();

// 2. Enable UEP Middleware (Sub-50ms SLA ingestion)
app.UseUniversalErrorPlatform();

app.MapPost("/api/v1/orders/{id}/fulfill", async (Guid id, IOrderService orders, IUEPClient uep) =>
{
    uep.AddBreadcrumb("orders", "Starting serializable transaction for fulfillment", LogLevel.Information);

    try
    {
        await orders.FulfillBatchAsync(id);
        uep.LogInfo("Order batch fulfilled", new { OrderId = id });
        return Results.Ok();
    }
    catch (Exception ex)
    {
        // Blames line 55 in OrderRepository.cs, matches committer Alex Rivera,
        // and assigns JIRA ticket PAY-1852 + Azure Boards #98230!
        uep.CaptureException(ex, new { OrderId = id });
        throw;
    }
});`
  },
  {
    id: 'react',
    label: 'React / Browser UI',
    badge: '@uep/react v1.3.0',
    badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
    installCommand: 'npm install @uep/react',
    fileName: 'src/main.tsx',
    description: 'Client-side React Error Boundary, click tracking, console interception, and source-map line blame.',
    sampleCode: `import React from "react";
import ReactDOM from "react-dom/client";
import * as UEP from "@uep/react";
import App from "./App";

// 1. Initialize UEP Browser SDK
UEP.init({
  dsn: "https://uep.acme.corp/api/v1/telemetry/ingest",
  apiKey: import.meta.env.VITE_UEP_API_KEY,
  environment: "production",
  release: "checkout-web@v4.1.0",
  git: {
    repository: "acme-corp/checkout-web-react",
    commitSha: import.meta.env.VITE_GIT_COMMIT
  },
  integrations: [
    UEP.browserTracingIntegration(),
    UEP.autoBreadcrumbIntegration({ clicks: true, console: true, dom: true })
  ],
  orchestration: {
    autoAssignToCommitter: true,
    createJiraTicket: true,
    createAzureBoardsBug: true
  }
});

// 2. Wrap root component with UEP Error Boundary
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UEP.ErrorBoundary fallback={<ErrorFallbackUI />}>
      <App />
    </UEP.ErrorBoundary>
  </React.StrictMode>
);

// In components:
// UEP.captureException(err);
// UEP.logWarning("Postal code format unhandled", { raw: input });`
  },
  {
    id: 'java',
    label: 'Java / Spring Boot',
    badge: 'uep-spring-boot-starter v1.0.4',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    installCommand: '<dependency>\n  <groupId>io.uep</groupId>\n  <artifactId>uep-spring-boot-starter</artifactId>\n  <version>1.0.4</version>\n</dependency>',
    fileName: 'application.yml',
    description: 'Spring WebMVC, WebFlux, and Logback appender integration with line-level commit tracking.',
    sampleCode: `uep:
  dsn: "https://uep.acme.corp/api/v1/telemetry/ingest"
  api-key: "\${UEP_API_KEY}"
  environment: "production"
  release: "inventory-service@v1.9.0"
  git:
    repository: "acme-corp/inventory-service-java"
    commit-sha: "\${GIT_COMMIT}"
  orchestration:
    auto-assign-committer: true
    jira:
      project-key: "INV"
    azure-boards:
      area-path: "CoreEngineering\\\\Inventory"

# In your Spring Service:
# @Autowired
# private UEPClient uep;
#
# try {
#     inventoryService.reserve(sku);
# } catch (StockDepletedException ex) {
#     uep.captureException(ex);
# }
# uep.logWarn("Warehouse replenishment delay detected");`
  }
];

export const SdkCodeConfigModal: React.FC<SdkCodeConfigModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<StackRuntime>('node');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeSdk = SDK_SPECS.find(s => s.id === activeTab) || SDK_SPECS[0];

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(activeSdk.installCommand);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeSdk.sampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Multi-Stack In-Code Configuration (Sentry-Compatible)
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Universal SDKs
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your repository in code. Errors, logs, info, and warnings are captured and auto-orchestrated.
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

        {/* Runtime Tabs Bar */}
        <div className="flex items-center gap-1.5 px-6 pt-3 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          {SDK_SPECS.map(sdk => (
            <button
              key={sdk.id}
              onClick={() => setActiveTab(sdk.id)}
              className={`px-4 py-2.5 rounded-t-lg font-medium text-xs flex items-center gap-2 transition whitespace-nowrap border-t border-x ${
                activeTab === sdk.id
                  ? 'bg-slate-900 text-white border-slate-700 border-b-transparent shadow-sm'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span>{sdk.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${sdk.badgeColor}`}>
                {sdk.id}
              </span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
          
          {/* Description banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600/15 text-indigo-400 border border-indigo-600/30">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">{activeSdk.label} Integration</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{activeSdk.description}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${activeSdk.badgeColor}`}>
                {activeSdk.badge}
              </span>
            </div>
          </div>

          {/* Installation Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                1. Install Package
              </span>
              <button
                onClick={handleCopyInstall}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
              >
                {copiedInstall ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedInstall ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-cyan-300 flex items-center justify-between">
              <code>{activeSdk.installCommand}</code>
            </div>
          </div>

          {/* In-Code Setup Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                2. Configure in Code ({activeSdk.fileName})
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white transition"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Snippet'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto shadow-inner selection:bg-indigo-900/50">
              <pre className="whitespace-pre">{activeSdk.sampleCode}</pre>
            </div>
          </div>

          {/* How Orchestration Works Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-800/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Line-Level Blame</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  SDK captures exact file and line number where error popped, querying GitHub API to find the commit author.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Commit Frequency</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Calculates who frequently commits to that method/function to guarantee accurate culprit assignment.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Auto-Assign Tickets</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Automatically generates JIRA ticket and Azure Boards bug, assigning directly to that responsible committer.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <div>
            DSN format: <code className="text-cyan-300 font-mono">https://&lt;key&gt;@uep.acme.corp/api/v1/telemetry/ingest</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Configurator
          </button>
        </div>

      </div>
    </div>
  );
};
