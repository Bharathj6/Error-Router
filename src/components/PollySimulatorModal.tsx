import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Server, 
  Play, 
  Database,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface PollySimulatorModalProps {
  onClose: () => void;
}

interface AttemptLog {
  attemptNumber: number;
  delayText: string;
  status: 'pending' | 'retrying' | 'failed' | 'success';
  timestamp: string;
  errorMessage?: string;
}

export const PollySimulatorModal: React.FC<PollySimulatorModalProps> = ({ onClose }) => {
  const [targetProvider, setTargetProvider] = useState<'Jira' | 'AzureDevOps'>('Jira');
  const [failureMode, setFailureMode] = useState<'transient_recover' | 'permanent_dlq'>('permanent_dlq');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dlqRouted, setDlqRouted] = useState(false);
  const [logs, setLogs] = useState<AttemptLog[]>([]);

  const SCHEDULE = [
    { attempt: 1, delay: 'Immediate (0s)', waitMs: 600 },
    { attempt: 2, delay: '10s backoff', waitMs: 1000 },
    { attempt: 3, delay: '30s backoff', waitMs: 1200 },
    { attempt: 4, delay: '2m backoff', waitMs: 1400 },
    { attempt: 5, delay: '10m backoff', waitMs: 1600 }
  ];

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setDlqRouted(false);
    setLogs([]);
    setCurrentStep(0);

    const newLogs: AttemptLog[] = [];

    for (let i = 0; i < SCHEDULE.length; i++) {
      const step = SCHEDULE[i];
      setCurrentStep(i + 1);

      // Log start
      newLogs.push({
        attemptNumber: step.attempt,
        delayText: step.delay,
        status: 'retrying',
        timestamp: new Date().toLocaleTimeString()
      });
      setLogs([...newLogs]);

      await new Promise(r => setTimeout(r, step.waitMs));

      // Check if transient recovery mode succeeds at attempt 3
      if (failureMode === 'transient_recover' && step.attempt === 3) {
        newLogs[newLogs.length - 1].status = 'success';
        setLogs([...newLogs]);
        setIsRunning(false);
        return;
      }

      // Otherwise failure
      newLogs[newLogs.length - 1].status = 'failed';
      newLogs[newLogs.length - 1].errorMessage = `HTTP 503 Service Unavailable: ${targetProvider} upstream gateway timeout`;
      setLogs([...newLogs]);
    }

    // All 5 attempts exhausted -> Route to Dead-Letter Queue (DLQ)
    setDlqRouted(true);
    setIsRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <RotateCcw className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                FR-08 Resilient Ticketing Dispatcher & DLQ
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Polly v8 Resilience Pipeline
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact PRD schedule: Immediate, 10s, 30s, 2m, 10m backoff before routing to PostgreSQL DLQ.
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

        {/* Controls */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 font-medium">Target Ticketing Adapter</label>
            <div className="flex gap-2 mt-1.5">
              {(['Jira', 'AzureDevOps'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTargetProvider(p)}
                  className={`flex-1 py-1.5 px-3 rounded-lg border font-medium transition ${
                    targetProvider === p
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium">Simulation Test Case</label>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={() => setFailureMode('permanent_dlq')}
                className={`flex-1 py-1.5 px-3 rounded-lg border font-medium transition text-[11px] ${
                  failureMode === 'permanent_dlq'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Exhaust Retries → DLQ
              </button>
              <button
                onClick={() => setFailureMode('transient_recover')}
                className={`flex-1 py-1.5 px-3 rounded-lg border font-medium transition text-[11px] ${
                  failureMode === 'transient_recover'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Recover at Attempt 3
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-indigo-600/30"
            >
              <Play className="w-4 h-4 fill-white" />
              {isRunning ? 'Executing Pipeline...' : 'Run Polly Pipeline Test'}
            </button>
          </div>
        </div>

        {/* Schedule & Visual Pipeline */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
          
          {/* Polly Retry Schedule Tiles */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Polly Resilience Backoff Schedule (PRD FR-08)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {SCHEDULE.map((s) => {
                const log = logs.find(l => l.attemptNumber === s.attempt);
                return (
                  <div
                    key={s.attempt}
                    className={`p-3 rounded-xl border text-center transition ${
                      log?.status === 'retrying'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300 animate-pulse'
                        : log?.status === 'success'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : log?.status === 'failed'
                        ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-bold">Attempt {s.attempt}</div>
                    <div className="text-xs font-semibold mt-1">{s.delay}</div>
                    <div className="mt-2 text-[10px] font-mono uppercase font-bold">
                      {log ? log.status : 'Idle'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Logs */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resilience Pipeline Log Stream
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-2 max-h-48 overflow-y-auto shadow-inner">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">Click "Run Polly Pipeline Test" to observe resilient dispatch.</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-slate-500 text-[11px]">{l.timestamp}</span>
                    {l.status === 'retrying' && (
                      <span className="text-amber-400 font-semibold">[ATTEMPT {l.attemptNumber}] Executing with {l.delayText}...</span>
                    )}
                    {l.status === 'failed' && (
                      <span className="text-rose-400">[FAILURE {l.attemptNumber}] {l.errorMessage}</span>
                    )}
                    {l.status === 'success' && (
                      <span className="text-emerald-400 font-semibold">[SUCCESS] Ticket created on attempt {l.attemptNumber}!</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dead-Letter Queue Alert Card */}
          {dlqRouted && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                Retries Exhausted (5 Attempts) → Routed to Dead-Letter Queue (DLQ)
              </div>
              <p className="text-rose-200/90 leading-relaxed">
                As required by FR-08, when all 5 retry backoffs fail (Immediate, 10s, 30s, 2m, 10m), the dispatch payload is safely archived in the PostgreSQL <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">dead_letter_events</code> table for automated replay or manual operator intervention.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <div>Table: <span className="text-emerald-400">dead_letter_events</span></div>
                <div>Payload: <span className="text-slate-400">&#123; "service": "{targetProvider.toLowerCase()}-client", "retryCount": 5, "status": "DLQ_PENDING" &#125;</span></div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
