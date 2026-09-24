import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { PipelineEngine } from '../utils/pipelineEngine';

interface SanitizerDiffModalProps {
  onClose: () => void;
}

export const SanitizerDiffModal: React.FC<SanitizerDiffModalProps> = ({ onClose }) => {
  const [dirtyText, setDirtyText] = useState(
`POST /api/v1/checkout HTTP/1.1
Host: api.internal.corp
Authorization: Bearer sk_live_99fba24810ac9920194bc0281
Cookie: session_id=sess_prod_8829419924; user_token=tok_secret_jwt_payload
X-Api-Key: sec_key_9901452291

{
  "orderId": "ord_8821941",
  "creditCard": "4111-2222-3333-4444",
  "cvv": "882",
  "dbConnectionString": "Host=postgres16;Database=prod;Password=super_secret_pg_pwd_2026;Username=app_svc",
  "password": "user_plain_password_123"
}

Stack Trace:
Exception at PaymentService.ExecuteCharge() in C:\\builds\\PaymentService.cs:line 184 +0x4a
Embedded Token in log: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_secret_signature`
  );

  const [sanitized, setSanitized] = useState(() => {
    return PipelineEngine.sanitize(dirtyText, {
      creditCard: '4111-2222-3333-4444',
      cvv: '882',
      password: 'user_plain_password_123',
      dbConnectionString: 'Host=postgres16;Database=prod;Password=super_secret_pg_pwd_2026;Username=app_svc'
    });
  });

  const handleUpdate = (val: string) => {
    setDirtyText(val);
    const res = PipelineEngine.sanitize(val, {});
    setSanitized(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                FR-03 Pre-Persistence Redaction Engine
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Zero PII Leakage
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side verification: Sensitive headers, tokens, cookies, and database passwords scrubbed before PostgreSQL persistence.
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

        {/* Status banner */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-500">Items scrubbed:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              {sanitized.redactedCount} secrets redacted
            </span>
          </div>
          <div className="text-slate-400">
            Detected: {sanitized.detectedSecrets.join(', ')}
          </div>
        </div>

        {/* Diff Columns */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto bg-slate-950 font-mono text-xs">
          
          {/* Left: Raw Dirty Payload */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Raw Telemetry Payload (Unsanitized)
              </span>
              <span className="text-[11px] text-slate-500">Edit below to test live</span>
            </div>
            <textarea
              value={dirtyText}
              onChange={(e) => handleUpdate(e.target.value)}
              className="flex-1 min-h-[380px] p-4 bg-slate-900 border border-rose-900/40 rounded-xl text-slate-300 focus:outline-none focus:border-rose-500 leading-relaxed font-mono resize-none selection:bg-rose-900/50"
            />
          </div>

          {/* Right: Sanitized Clean Payload */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Pre-Persistence Sanitized (PostgreSQL 16)
              </span>
              <span className="text-[11px] text-emerald-400/80 font-mono">PayloadSanitizer.cs</span>
            </div>
            <div className="flex-1 min-h-[380px] p-4 bg-slate-900 border border-emerald-900/40 rounded-xl text-emerald-300/90 leading-relaxed font-mono overflow-y-auto whitespace-pre selection:bg-emerald-900/50">
              {sanitized.sanitizedStackTrace}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-800 bg-slate-900 text-xs text-slate-400">
          <div>
            Scrubbing is executed synchronously in <code className="text-indigo-400 font-mono">TelemetryProcessingWorker.cs</code> before any database insert.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Diff Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
