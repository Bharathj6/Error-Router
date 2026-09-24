import React from 'react';
import { 
  X, 
  ArrowRight, 
  Database, 
  Server, 
  ShieldCheck, 
  Fingerprint, 
  Send, 
  Layers, 
  RotateCcw,
  Zap,
  Activity,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface ArchitectureDiagramProps {
  onClose: () => void;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Universal Production Error Platform — Architecture Topology
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                End-to-End distributed flow from Sub-50ms ingestion to pre-persistence redaction, SHA-256 grouping, and resilient ticketing.
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

        {/* Visual Diagram */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950 font-sans">
          
          {/* Ingestion & Pipeline Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Step 1: Telemetry Sources */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  <Activity className="w-4 h-4" />
                  1. Telemetry Sources
                </div>
                <div className="text-xs text-slate-300 font-medium">Production Services</div>
                <ul className="text-[11px] text-slate-400 mt-2 space-y-1 font-mono">
                  <li>• payment-service</li>
                  <li>• order-service</li>
                  <li>• auth-gateway</li>
                  <li>• inventory-api</li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                HTTP POST with <code className="text-cyan-300">X-Api-Key</code>
              </div>
            </div>

            {/* Step 2: Ingestion Controller */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  <Zap className="w-4 h-4" />
                  2. Ingestion API (FR-02)
                </div>
                <div className="text-xs text-slate-200 font-medium">IngestionController.cs</div>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  In-memory credential validation, pushes to <code className="text-indigo-300 font-mono">System.Threading.Channels</code>, returns <strong className="text-emerald-400">202 Accepted</strong> within <strong>&lt;50ms</strong>.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-800/40 text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sub-50ms SLA Guaranteed
              </div>
            </div>

            {/* Step 3: Core Engines */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  3. Processing Pipeline
                </div>
                <div className="text-xs text-slate-200 font-medium">TelemetryProcessingWorker</div>
                <ul className="text-[11px] text-slate-400 mt-2 space-y-1.5">
                  <li className="flex items-center gap-1.5 text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <strong>FR-03:</strong> Regex PII Redaction
                  </li>
                  <li className="flex items-center gap-1.5 text-indigo-300">
                    <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                    <strong>FR-04:</strong> SHA-256 Normalizer
                  </li>
                  <li className="flex items-center gap-1.5 text-cyan-300">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <strong>FR-06:</strong> Ownership Matcher
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                Idempotent grouping (FR-05)
              </div>
            </div>

            {/* Step 4: Storage & Ticketing */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <RotateCcw className="w-4 h-4" />
                  4. Persistence & Dispatch
                </div>
                <div className="text-xs text-slate-200 font-medium">PostgreSQL 16 + Polly v8</div>
                <ul className="text-[11px] text-slate-400 mt-2 space-y-1">
                  <li>• EF Core Npgsql (JSONB)</li>
                  <li>• Composite: <code className="text-slate-300">uq_org_fingerprint</code></li>
                  <li>• Jira Cloud (REST v3)</li>
                  <li>• Azure DevOps (REST v7.1)</li>
                  <li>• Dead-Letter Queue (DLQ)</li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-semibold">
                Retry: 0s, 10s, 30s, 2m, 10m
              </div>
            </div>

          </div>

          {/* Database Schema Entity Relationships */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              PostgreSQL 16 Core Relational Schema (PRD Section 4)
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-2">organizations</div>
                <div className="text-slate-400 text-[11px] space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>name: VARCHAR(255)</div>
                  <div>slug: VARCHAR(100) (UQ)</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-indigo-400 font-bold border-b border-slate-800 pb-1 mb-2">error_groups</div>
                <div className="text-slate-400 text-[11px] space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>organization_id: UUID (FK)</div>
                  <div>service_id: UUID (FK)</div>
                  <div className="text-emerald-300 font-bold">fingerprint: CHAR(64)</div>
                  <div>exception_type: VARCHAR</div>
                  <div>status: VARCHAR(50)</div>
                  <div className="text-amber-300 text-[10px]">UQ: (org_id, fingerprint)</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1 mb-2">error_occurrences</div>
                <div className="text-slate-400 text-[11px] space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>error_group_id: UUID (FK)</div>
                  <div>timestamp: TIMESTAMPTZ</div>
                  <div>stack_trace: TEXT</div>
                  <div className="text-emerald-300 font-bold">request_context: JSONB</div>
                  <div>correlation_id: VARCHAR</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-amber-400 font-bold border-b border-slate-800 pb-1 mb-2">ticket_links</div>
                <div className="text-slate-400 text-[11px] space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>error_group_id: UUID (FK)</div>
                  <div>integration_id: UUID (FK)</div>
                  <div>external_ticket_id: VARCHAR</div>
                  <div>status: VARCHAR(100)</div>
                  <div className="text-amber-300 text-[10px]">UQ: (group_id, integ_id)</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs"
          >
            Close Diagram
          </button>
        </div>

      </div>
    </div>
  );
};
