import React, { useState } from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  GitCommit, 
  Workflow, 
  Building2, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Code2, 
  Clock, 
  AlertTriangle,
  FileCode,
  Check
} from 'lucide-react';
import { 
  ErrorGroupModel, 
  StackRuntime, 
  UserIdentityMapping, 
  ToolIntegrationConfig,
  GitBlameCulprit,
  OrchestrationStepLog,
  JiraTicket,
  AzureBoardsWorkItem
} from '../types';
import { PipelineEngine } from '../utils/pipelineEngine';

interface ErrorOrchestrationSimulatorModalProps {
  onClose: () => void;
  users: UserIdentityMapping[];
  config: ToolIntegrationConfig;
  onOrchestrationComplete: (newGroup: ErrorGroupModel) => void;
}

interface ScenarioTemplate {
  name: string;
  runtime: StackRuntime;
  service: string;
  repo: string;
  exceptionType: string;
  message: string;
  stackTrace: string;
  expectedCulpritName: string;
}

const SCENARIOS: ScenarioTemplate[] = [
  {
    name: 'Node.js Stripe Gateway Timeout (Line 184)',
    runtime: 'node',
    service: 'checkout-service',
    repo: 'acme-corp/checkout-service-node',
    exceptionType: 'StripeGatewayTimeoutError',
    message: 'Upstream payment gateway timed out after 30000ms while confirming PaymentIntent',
    stackTrace: `StripeGatewayTimeoutError: Upstream payment gateway timed out after 30000ms
    at StripeClient.executeStripeCharge (/app/src/services/stripeClient.ts:184:28)
    at CheckoutService.processPayment (/app/src/services/checkoutService.ts:89:14)
    at PaymentsController.processCharge (/app/src/controllers/paymentsController.ts:42:10)`,
    expectedCulpritName: 'Sarah Chen'
  },
  {
    name: 'Python Decimal Precision Overflow (Line 92)',
    runtime: 'python',
    service: 'billing-worker',
    repo: 'acme-corp/billing-worker-py',
    exceptionType: 'decimal.InvalidOperation',
    message: 'InvalidOperation: Quantize result has too many digits for current decimal context',
    stackTrace: `Traceback (most recent call last):
  File "billing/worker.py", line 142, in process_invoice
    tax = calculate_compound_tax(invoice.amount, invoice.tax_profile)
  File "billing/tax_engine.py", line 92, in calculate_compound_tax
    return raw_tax.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
decimal.InvalidOperation: Quantize result has too many digits for current decimal context`,
    expectedCulpritName: 'Elena Rostova'
  },
  {
    name: 'Go JWT Zero-Skew Expiry Spike (Line 64)',
    runtime: 'go',
    service: 'auth-gateway',
    repo: 'acme-corp/auth-gateway-go',
    exceptionType: 'jwt.ErrTokenExpired',
    message: 'Token verification failed: JWT token has expired across clustered cache sync',
    stackTrace: `jwt.ErrTokenExpired: token is expired by 1s
    at internal/jwt.(*Validator).VerifySessionToken (/app/internal/jwt/validator.go:64)
    at internal/handlers.(*AuthHandler).ExchangeToken (/app/internal/handlers/auth.go:31)
    at net/http.HandlerFunc.ServeHTTP (/usr/local/go/src/net/http/server.go:2084)`,
    expectedCulpritName: 'Marcus Vance'
  },
  {
    name: '.NET PostgreSQL Deadlock (Line 55)',
    runtime: 'dotnet',
    service: 'order-service',
    repo: 'acme-corp/order-service-dotnet',
    exceptionType: 'Npgsql.NpgsqlException',
    message: 'NpgsqlException: 40P01: deadlock detected between process 49102 and process 49104',
    stackTrace: `Npgsql.NpgsqlException (0x80004005): Exception while connecting to PostgreSQL server: deadlock detected
   at Npgsql.Internal.NpgsqlConnector.DoReadMessage(Boolean async, DataRowLoadingMode dataRowLoadingMode, Boolean readingNotifications) in Connector.cs:line 291
   at OrderService.Data.OrderRepository.FulfillOrderBatchAsync(Guid id) in C:\\apps\\OrderService\\OrderRepository.cs:line 55
   at OrderService.Controllers.OrdersController.Fulfill(Guid id) in C:\\apps\\OrderService\\OrdersController.cs:line 38`,
    expectedCulpritName: 'Alex Rivera'
  }
];

export const ErrorOrchestrationSimulatorModal: React.FC<ErrorOrchestrationSimulatorModalProps> = ({
  onClose,
  users,
  config,
  onOrchestrationComplete
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const scenario = SCENARIOS[selectedScenarioIndex];

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<OrchestrationStepLog[]>([]);
  const [culpritResult, setCulpritResult] = useState<GitBlameCulprit | null>(null);
  const [jiraResult, setJiraResult] = useState<JiraTicket | null>(null);
  const [azureBoardsResult, setAzureBoardsResult] = useState<AzureBoardsWorkItem | null>(null);
  const [createdGroup, setCreatedGroup] = useState<ErrorGroupModel | null>(null);

  const handleRunOrchestration = async () => {
    setIsRunning(true);
    setCurrentStep(1);
    setLogs([]);
    setCulpritResult(null);
    setJiraResult(null);
    setAzureBoardsResult(null);
    setCreatedGroup(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    // STEP 1: Ingestion & Stack Parse (<10ms)
    await new Promise(r => setTimeout(r, 400));
    const parsedFrame = PipelineEngine.parseTopApplicationFrame(scenario.stackTrace);
    
    setLogs(prev => [
      ...prev,
      {
        step: '1. Ingestion & Frame Parsing',
        timestamp: timeStr,
        status: 'success',
        detail: `Captured ${scenario.exceptionType} in ${scenario.service} at ${parsedFrame.filePath}:${parsedFrame.lineNumber}`
      }
    ]);

    // STEP 2: Git Blame Engine & Commit Frequency Analysis
    setCurrentStep(2);
    await new Promise(r => setTimeout(r, 600));

    const culprit = PipelineEngine.analyzeGitBlame(parsedFrame, scenario.service, users);
    setCulpritResult(culprit);

    setLogs(prev => [
      ...prev,
      {
        step: '2. Git Blame & Author Frequency',
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        detail: `Line ${culprit.lineChanged} blamed to commit ${culprit.commitSha} by @${culprit.githubUsername} (${culprit.confidenceScore}% confidence). ${culprit.recentMethodCommitsCount} recent commits to ${culprit.methodName}().`
      }
    ]);

    // STEP 3: Cross-Tool Identity Resolution
    setCurrentStep(3);
    await new Promise(r => setTimeout(r, 500));

    const matchedUser = users.find(u => u.githubUsername === culprit.githubUsername) || users[0];

    setLogs(prev => [
      ...prev,
      {
        step: '3. Identity Directory Mapping',
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        detail: `Mapped GitHub @${culprit.githubUsername} -> Jira "${matchedUser.jiraDisplayName}" & Azure Boards "${matchedUser.azureBoardsDisplayName}" (${matchedUser.team})`
      }
    ]);

    // STEP 4: Dual Ticket Dispatch (Jira + Azure Boards)
    setCurrentStep(4);
    await new Promise(r => setTimeout(r, 600));

    const { jira, azureBoards, logs: orchestratorLogs } = PipelineEngine.orchestrateTickets(
      scenario.service,
      scenario.exceptionType,
      culprit,
      matchedUser
    );

    setJiraResult(jira);
    setAzureBoardsResult(azureBoards);

    setLogs(prev => [
      ...prev,
      {
        step: '4. Multi-Platform Auto-Assignment',
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        detail: `Dispatched JIRA ${jira.key} and Azure Boards ${azureBoards.workItemId} directly to ${matchedUser.name}`
      }
    ]);

    // Compute fingerprint
    const fpResult = await PipelineEngine.computeFingerprint(
      scenario.exceptionType,
      scenario.stackTrace,
      scenario.service
    );

    // Build the full group model
    const newGroup: ErrorGroupModel = {
      id: 'grp-live-' + Date.now().toString(36),
      organizationId: 'org-acme-prod-01',
      serviceId: 'srv-' + scenario.service,
      serviceName: scenario.service,
      environment: 'production',
      runtime: scenario.runtime,
      level: 'error',
      repo: scenario.repo,
      fingerprint: fpResult.fingerprint,
      exceptionType: scenario.exceptionType,
      message: scenario.message,
      status: 'Open',
      occurrenceCount: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      assignedTeam: matchedUser.team,
      assignedOwner: matchedUser.email,
      ownershipMatchRule: `GitBlame: Exact line author (${culprit.commitSha}) + ${matchedUser.role}`,
      culprit,
      jiraTicket: jira,
      azureBoardsTask: azureBoards,
      orchestrationLog: orchestratorLogs,
      breadcrumbs: [
        { id: 'b-sim-1', type: 'navigation', category: 'runtime', message: `Execution initialized in ${scenario.service}`, level: 'info', timestamp: '12:00:00' },
        { id: 'b-sim-2', type: 'log', category: 'exception', message: scenario.message, level: 'error', timestamp: '12:00:01' },
        { id: 'b-sim-3', type: 'system', category: 'orchestrator', message: `Assigned Jira ${jira.key} & Azure Boards ${azureBoards.workItemId} to ${matchedUser.name}`, level: 'info', timestamp: '12:00:02' }
      ],
      ticketLinks: [
        {
          id: 'link-' + jira.id,
          integrationType: 'Jira',
          externalTicketId: jira.key,
          externalTicketUrl: jira.url,
          status: jira.status,
          lastSyncedAt: new Date().toISOString(),
          assignedTo: matchedUser.name,
          assigneeAvatar: matchedUser.avatar
        },
        {
          id: 'link-' + azureBoards.id,
          integrationType: 'AzureDevOps',
          externalTicketId: azureBoards.workItemId,
          externalTicketUrl: azureBoards.url,
          status: azureBoards.state,
          lastSyncedAt: new Date().toISOString(),
          assignedTo: matchedUser.name,
          assigneeAvatar: matchedUser.avatar
        }
      ],
      occurrences: [
        {
          id: 'occ-sim-' + Date.now(),
          timestamp: new Date().toISOString(),
          stackTrace: scenario.stackTrace,
          requestContext: {
            service: scenario.service,
            environment: 'production',
            simulated: true
          },
          version: 'v1.0.0',
          correlationId: 'corr-' + Math.random().toString(36).substring(2, 8)
        }
      ]
    };

    setCreatedGroup(newGroup);
    setIsRunning(false);
  };

  const handleInjectIntoDashboard = () => {
    if (createdGroup) {
      onOrchestrationComplete(createdGroup);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-md shadow-amber-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Live Error Orchestrator & Line-Blame Simulator
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Real-Time Pipeline
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate an unhandled error popping in production. Watch the system parse the offending line, blame the commit author, and assign JIRA + Azure Boards tasks.
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

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
          
          {/* Scenario Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select Multi-Stack Test Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {SCENARIOS.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedScenarioIndex(idx);
                    setCulpritResult(null);
                    setJiraResult(null);
                    setAzureBoardsResult(null);
                    setLogs([]);
                    setCurrentStep(0);
                    setCreatedGroup(null);
                  }}
                  className={`p-3 rounded-xl text-left border transition relative flex flex-col justify-between ${
                    selectedScenarioIndex === idx
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 text-cyan-300 border border-slate-700">
                        {sc.runtime}
                      </span>
                      <span className="text-[10px] text-slate-400">{sc.service}</span>
                    </div>
                    <div className="font-semibold text-xs text-white leading-snug">
                      {sc.name}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Expected Author:</span>
                    <span className="text-emerald-400 font-medium">{sc.expectedCulpritName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Code Stack Preview */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                Raw Stack Trace to Ingest ({scenario.service})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Repo: {scenario.repo}</span>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed border border-slate-800/60">
              {scenario.stackTrace}
            </pre>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleRunOrchestration}
              disabled={isRunning}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition shadow-lg ${
                isRunning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              {isRunning ? 'Orchestrating Error Pipeline...' : 'Trigger Runtime Error & Run Orchestration'}
            </button>
          </div>

          {/* 4-Step Pipeline Flow Visualization */}
          {currentStep > 0 && (
            <div className="space-y-4 pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Orchestration Pipeline Execution Timeline
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                {/* Step 1 */}
                <div className={`p-4 rounded-xl border transition ${
                  currentStep >= 1 ? 'bg-slate-900 border-cyan-500/80 shadow-md' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">STAGE 01</span>
                    {currentStep >= 1 && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="font-bold text-xs text-white">Capture & Parse Line</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    SDK captures error and extracts the top frame in under 10ms.
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-4 rounded-xl border transition ${
                  currentStep >= 2 ? 'bg-slate-900 border-indigo-500/80 shadow-md' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">STAGE 02</span>
                    {currentStep >= 2 && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="font-bold text-xs text-white">Git Blame Engine</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Blames line author and analyzes recent method commit ratio.
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-4 rounded-xl border transition ${
                  currentStep >= 3 ? 'bg-slate-900 border-purple-500/80 shadow-md' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">STAGE 03</span>
                    {currentStep >= 3 && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="font-bold text-xs text-white">Identity Mapping</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Maps GitHub handle to Jira and Azure Boards accounts.
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`p-4 rounded-xl border transition ${
                  currentStep >= 4 ? 'bg-slate-900 border-emerald-500/80 shadow-md' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">STAGE 04</span>
                    {currentStep >= 4 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="font-bold text-xs text-white">Ticket Auto-Dispatch</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Creates and assigns JIRA bug + Azure Boards work item!
                  </div>
                </div>

              </div>

              {/* Logs */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-cyan-400 shrink-0">[{log.timestamp}]</span>
                    <span className="text-emerald-400 font-semibold shrink-0">{log.step}:</span>
                    <span className="text-slate-300">{log.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Culprit Card & Ticket Widgets */}
          {culpritResult && jiraResult && azureBoardsResult && (
            <div className="space-y-4 pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Orchestration Artifacts & Ticket Assignments
              </div>

              {/* Culprit Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={culpritResult.avatarUrl}
                    alt={culpritResult.authorName}
                    className="w-12 h-12 rounded-full ring-2 ring-emerald-500 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{culpritResult.authorName}</span>
                      <span className="text-xs font-mono text-cyan-400">@{culpritResult.githubUsername}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {culpritResult.confidenceScore}% Culprit Confidence
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {culpritResult.reason}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400">Recent Commits to Method</div>
                  <div className="text-sm font-bold text-slate-200">
                    {culpritResult.recentMethodCommitsCount} of {culpritResult.totalMethodCommitsCount} commits
                  </div>
                </div>
              </div>

              {/* Tickets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Jira Ticket Box */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800">
                        <Workflow className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Atlassian JIRA Bug</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                      {jiraResult.key}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">{jiraResult.summary}</div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assigned To:</span>
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <img src={jiraResult.assigneeAvatar} className="w-4 h-4 rounded-full" />
                      {jiraResult.assignee}
                    </span>
                  </div>
                </div>

                {/* Azure Boards Box */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-900/40 text-indigo-400 border border-indigo-800">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Azure Boards Work Item</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {azureBoardsResult.workItemId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">{azureBoardsResult.title}</div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assigned To:</span>
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <img src={azureBoardsResult.assignedToAvatar} className="w-4 h-4 rounded-full" />
                      {azureBoardsResult.assignedTo}
                    </span>
                  </div>
                </div>

              </div>

              {/* Add to Dashboard Button */}
              <div className="p-4 bg-slate-900/80 border border-emerald-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Orchestration Completed Successfully
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Inject this newly orchestrated issue and its linked tickets into your primary dashboard stream.
                  </div>
                </div>
                <button
                  onClick={handleInjectIntoDashboard}
                  className="px-4 py-2 font-semibold text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-600/20"
                >
                  View in Issues Stream &rarr;
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <div>
            Orchestration latency: <span className="font-mono text-cyan-300">3.8ms</span> | Sub-50ms SLA met.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Simulator
          </button>
        </div>

      </div>
    </div>
  );
};
