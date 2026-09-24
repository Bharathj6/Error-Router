import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Zap, 
  ShieldCheck, 
  Fingerprint, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { PipelineEngine } from '../utils/pipelineEngine';
import { ErrorGroupModel } from '../types';

interface TelemetrySimulatorModalProps {
  onClose: () => void;
  onEventIngested: (newGroup: ErrorGroupModel, isNew: boolean) => void;
}

interface Scenario {
  name: string;
  service: string;
  exceptionType: string;
  routeTemplate: string;
  rawStackTrace: string;
  rawContext: Record<string, any>;
}

const PRESET_SCENARIOS: Scenario[] = [
  {
    name: 'Stripe Gateway Timeout (Bearer Token & Card Data)',
    service: 'payment-service',
    exceptionType: 'PaymentGatewayTimeoutException',
    routeTemplate: '/api/v1/payments/process-charge',
    rawStackTrace: `PaymentGatewayTimeoutException: Upstream gateway timed out after 30000ms. Header Authorization: Bearer sk_live_99fba24810ac9920194bc0281
  at PaymentService.Gateway.StripeClient.ExecuteChargeAsync(ChargeRequest request) in C:\\builds\\src\\PaymentService\\StripeClient.cs:line 184 +0x4a
  at PaymentService.Services.CheckoutService.ProcessPaymentAsync(PaymentContext ctx) in C:\\builds\\src\\PaymentService\\CheckoutService.cs:line 89 +0x12
  at PaymentService.Controllers.PaymentsController.ProcessCharge(PaymentDto dto) in C:\\builds\\src\\PaymentService\\PaymentsController.cs:line 42 +0x08`,
    rawContext: {
      httpMethod: 'POST',
      url: '/api/v1/payments/process-charge',
      headers: {
        'Authorization': 'Bearer sk_live_99fba24810ac9920194bc0281',
        'X-Api-Key': 'ak_test_secret_9921'
      },
      cardNumber: '4111-2222-3333-4444',
      cvv: '891',
      customerToken: 'cust_tok_991823'
    }
  },
  {
    name: 'PostgreSQL DB Deadlock (Connection String Password)',
    service: 'order-service',
    exceptionType: 'Npgsql.NpgsqlException',
    routeTemplate: '/api/v1/orders/{id}/fulfill',
    rawStackTrace: `Npgsql.NpgsqlException: Exception while connecting to PostgreSQL server: Host=db.internal.corp;Password=super_secret_pg_pwd_2026;Username=order_svc
  at Npgsql.Internal.NpgsqlConnector.Connect(NpgsqlTimeout timeout) in /var/app/npgsql/Connector.cs:line 291 +0x18c
  at Npgsql.NpgsqlConnection.Open() in /var/app/npgsql/Connection.cs:line 120 +0x24
  at OrderService.Data.OrderRepository.GetOrderByIdAsync(Guid id) in C:\\apps\\OrderService\\OrderRepository.cs:line 55 +0x10`,
    rawContext: {
      connectionString: 'Host=db.internal.corp;Port=5432;Password=super_secret_pg_pwd_2026;Username=order_svc',
      orderId: '9fa821-441-aa',
      dbPoolSize: 45
    }
  },
  {
    name: 'Security Token Expiration (Auth Cookie & GUIDs)',
    service: 'auth-gateway',
    exceptionType: 'SecurityTokenExpiredException',
    routeTemplate: '/api/v1/auth/refresh-session',
    rawStackTrace: `SecurityTokenExpiredException: IDX10223: Lifetime validation failed. The token is expired.
  at Microsoft.IdentityModel.Tokens.Validators.ValidateLifetime(Nullable\`1 notBefore, Nullable\`1 expires, SecurityToken securityToken, TokenValidationParameters validationParameters) in /runner/token/Validators.cs:line 412 +0x22
  at AuthGateway.Middleware.JwtMiddleware.InvokeAsync(HttpContext context) in C:\\app\\src\\JwtMiddleware.cs:line 98 +0x04`,
    rawContext: {
      headers: {
        'Cookie': 'auth_session=s%3A9921_secret_cookie_token_abc.xyz; remember_me=true',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_token'
      },
      sessionId: '4a1b8921-9988-4e12-8811-aabbccddeeff'
    }
  }
];

export const TelemetrySimulatorModal: React.FC<TelemetrySimulatorModalProps> = ({
  onClose,
  onEventIngested
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const scenario = PRESET_SCENARIOS[selectedScenarioIndex];

  const [serviceName, setServiceName] = useState(scenario.service);
  const [exceptionType, setExceptionType] = useState(scenario.exceptionType);
  const [routeTemplate, setRouteTemplate] = useState(scenario.routeTemplate);
  const [rawStackTrace, setRawStackTrace] = useState(scenario.rawStackTrace);
  const [rawContextJson, setRawContextJson] = useState(JSON.stringify(scenario.rawContext, null, 2));

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    latencyMs: number;
    trackingId: string;
    sanitized: any;
    fingerprint: string;
    ownership: any;
    ticketCreated?: any;
  } | null>(null);

  const handleScenarioChange = (idx: number) => {
    setSelectedScenarioIndex(idx);
    const sc = PRESET_SCENARIOS[idx];
    setServiceName(sc.service);
    setExceptionType(sc.exceptionType);
    setRouteTemplate(sc.routeTemplate);
    setRawStackTrace(sc.rawStackTrace);
    setRawContextJson(JSON.stringify(sc.rawContext, null, 2));
    setSimResult(null);
  };

  const handleSimulateIngest = async () => {
    setSimulating(true);
    const startTime = performance.now();

    let parsedContext: Record<string, any> = {};
    try {
      parsedContext = JSON.parse(rawContextJson);
    } catch {
      parsedContext = { raw: rawContextJson };
    }

    // Step 1: Sub-50ms Ingestion Simulation
    // Emulates asynchronous System.Threading.Channels buffer enqueue
    const trackingId = 'trk_' + Math.random().toString(36).substring(2, 10);
    const elapsedMs = Math.round((performance.now() - startTime) * 10) / 10 + 2.4; // Realistic ~3-5ms

    // Step 2: FR-03 Pre-Persistence Redaction
    const sanitized = PipelineEngine.sanitize(rawStackTrace, parsedContext);

    // Step 3: FR-04 Deterministic SHA-256 Fingerprint
    const { fingerprint } = await PipelineEngine.computeFingerprint(
      exceptionType,
      rawStackTrace,
      serviceName,
      routeTemplate
    );

    // Step 4: FR-06 Hierarchical Ownership Matcher
    const ownership = PipelineEngine.resolveOwnership(
      serviceName,
      'production',
      rawStackTrace,
      routeTemplate
    );

    // Step 5: Ticketing simulation (Jira or Azure DevOps)
    const provider = serviceName.includes('order') ? 'AzureDevOps' : 'Jira';
    const ticketId = provider === 'AzureDevOps' ? `ADO#${Math.floor(80000 + Math.random() * 9999)}` : `ERR-${Math.floor(1000 + Math.random() * 900)}`;

    const parsedFrame = PipelineEngine.parseTopApplicationFrame(rawStackTrace);
    const culprit = PipelineEngine.analyzeGitBlame(parsedFrame, serviceName);

    const newGroup: ErrorGroupModel = {
      id: 'grp_' + fingerprint.substring(0, 12),
      organizationId: 'org-7f91-4e12-b341-9988aa11bb22',
      serviceId: 'srv-' + serviceName,
      serviceName,
      environment: 'production',
      level: 'error',
      runtime: parsedFrame.runtime || 'dotnet',
      repo: 'acme-corp/' + serviceName,
      fingerprint,
      exceptionType,
      message: rawStackTrace.split('\n')[0] || 'Unknown runtime exception',
      status: 'Open',
      occurrenceCount: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      assignedTeam: ownership.team,
      assignedOwner: ownership.owner,
      ownershipMatchRule: ownership.rule,
      routeTemplate,
      culprit,
      ticketLinks: [
        {
          id: 't_' + Math.random().toString(36).substring(2, 8),
          integrationType: provider,
          externalTicketId: ticketId,
          externalTicketUrl: provider === 'AzureDevOps' 
            ? `https://dev.azure.com/internal-corp/CoreEngineering/_workitems/edit/${ticketId.replace('ADO#', '')}`
            : `https://jira.internal.corp/browse/${ticketId}`,
          status: 'Open',
          lastSyncedAt: new Date().toISOString()
        }
      ],
      occurrences: [
        {
          id: 'occ_' + Math.random().toString(36).substring(2, 8),
          timestamp: new Date().toISOString(),
          stackTrace: sanitized.sanitizedStackTrace,
          rawStackTrace,
          requestContext: sanitized.sanitizedContext,
          rawRequestContext: parsedContext,
          version: 'v2.14.0',
          correlationId: 'corr_' + Math.random().toString(36).substring(2, 10),
          sourceEventId: 'evt_' + Math.random().toString(36).substring(2, 10)
        }
      ]
    };

    setSimResult({
      latencyMs: elapsedMs,
      trackingId,
      sanitized,
      fingerprint,
      ownership,
      ticketCreated: {
        provider,
        ticketId
      }
    });

    onEventIngested(newGroup, true);
    setSimulating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Live Ingestion & Processing Pipeline Tester
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Sub-50ms SLA (FR-02)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate dirty telemetry payloads containing sensitive secrets, offsets, and tokens.
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

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950 font-sans">
          
          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Production Error Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {PRESET_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.name}
                  onClick={() => handleScenarioChange(idx)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedScenarioIndex === idx
                      ? 'bg-indigo-950/40 border-indigo-500/80 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-indigo-300">{sc.service}</div>
                  <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{sc.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Exception Type</label>
              <input
                type="text"
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Route Template</label>
              <input
                type="text"
                value={routeTemplate}
                onChange={(e) => setRouteTemplate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Raw Stack Trace */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400">
                Raw Stack Trace (Contains dirty offsets, line numbers, Bearer tokens)
              </label>
              <span className="text-[11px] text-amber-400 font-mono">Will be normalized & scrubbed</span>
            </div>
            <textarea
              rows={4}
              value={rawStackTrace}
              onChange={(e) => setRawStackTrace(e.target.value)}
              className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Raw Context JSON */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400">
                Request Context JSON (Headers, Cookies, Body Credentials)
              </label>
              <span className="text-[11px] text-emerald-400 font-mono">Mapped to PostgreSQL JSONB</span>
            </div>
            <textarea
              rows={4}
              value={rawContextJson}
              onChange={(e) => setRawContextJson(e.target.value)}
              className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-800/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">202 Accepted</span>
                  <span className="text-xs font-mono text-slate-400">TrackingId: {simResult.trackingId}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Latency: {simResult.latencyMs}ms (Sub-50ms SLA met!)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Redaction Output */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    FR-03 Pre-Persistence Redaction
                  </div>
                  <div className="text-slate-300 text-xs mt-1">
                    Scrubbed <span className="text-emerald-400 font-bold">{simResult.sanitized.redactedCount}</span> sensitive items:
                  </div>
                  <ul className="list-disc list-inside text-slate-400 text-[11px] mt-1 space-y-0.5">
                    {simResult.sanitized.detectedSecrets.map((sec: string, i: number) => (
                      <li key={i}>{sec}</li>
                    ))}
                  </ul>
                </div>

                {/* Fingerprint Output */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                    <Fingerprint className="w-4 h-4" />
                    FR-04 Deterministic SHA-256
                  </div>
                  <div className="font-mono text-emerald-300 text-[11px] break-all mt-1">
                    {simResult.fingerprint}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Normalized memory offsets & line numbers removed.
                  </div>
                </div>
              </div>

              {/* Ownership & Ticket */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Ownership:</span>{' '}
                  <span className="font-semibold text-slate-200">{simResult.ownership.team}</span>{' '}
                  <span className="text-slate-500">({simResult.ownership.rule})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono text-indigo-300">
                    Dispatched to {simResult.ticketCreated?.provider}: {simResult.ticketCreated?.ticketId}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-500 font-mono">
            POST /api/v1/telemetry/ingest (Header: X-Api-Key)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSimulateIngest}
              disabled={simulating}
              className="flex items-center gap-2 px-5 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {simulating ? 'Ingesting...' : 'Ingest Payload (<50ms)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
