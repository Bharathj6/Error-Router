import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Fingerprint, 
  Clock, 
  Server, 
  UserCheck, 
  Copy, 
  Check, 
  Layers, 
  FileCode, 
  Terminal,
  Activity,
  AlertTriangle,
  GitCommit,
  Workflow,
  Building2,
  Sparkles,
  GitPullRequest,
  CheckCircle2
} from 'lucide-react';
import { ErrorGroupModel, ErrorStatus } from '../types';

interface ErrorDetailModalProps {
  errorGroup: ErrorGroupModel;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: ErrorStatus) => void;
}

export const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({
  errorGroup,
  onClose,
  onStatusChange
}) => {
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [activeTab, setActiveTab] = useState<'blame' | 'stack' | 'breadcrumbs' | 'context' | 'tickets'>('blame');
  const [selectedOccurrenceIndex, setSelectedOccurrenceIndex] = useState(0);

  const occurrences = errorGroup.occurrences || [];
  const currentOccurrence = occurrences[selectedOccurrenceIndex] || null;
  const culprit = errorGroup.culprit;
  const breadcrumbs = errorGroup.breadcrumbs || [];

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(errorGroup.fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const statusColors: Record<ErrorStatus, string> = {
    Open: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    Investigating: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Ignored: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="space-y-2 flex-1 pr-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[errorGroup.status]}`}>
                {errorGroup.status.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {errorGroup.serviceName}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono uppercase rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                {errorGroup.runtime}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {errorGroup.environment}
              </span>
              {errorGroup.repo && (
                <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                  {errorGroup.repo}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight break-all">
              {errorGroup.exceptionType}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2">
              {errorGroup.message}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Status Toggle */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              {(['Open', 'Investigating', 'Resolved', 'Ignored'] as ErrorStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(errorGroup.id, st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    errorGroup.status === st
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suspect Committer Banner (Sentry Style) */}
        {culprit && (
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border-b border-indigo-800/30 p-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={culprit.avatarUrl}
                alt={culprit.authorName}
                className="w-12 h-12 rounded-full ring-2 ring-emerald-500 object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Suspect Committer & Culprit
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {culprit.confidenceScore}% Confidence
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {culprit.authorName} <span className="text-xs font-mono font-normal text-cyan-400">(@{culprit.githubUsername})</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Committed: <span className="font-mono text-slate-300">{culprit.commitSha}</span> &mdash; "{culprit.commitMessage}"
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right shrink-0">
              <div className="text-xs">
                <div className="text-slate-400 text-[11px]">Method Commit Frequency</div>
                <div className="font-bold text-slate-200">
                  {culprit.recentMethodCommitsCount} of {culprit.totalMethodCommitsCount} changes to <code className="text-cyan-300 font-mono">{culprit.methodName}()</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-950 text-xs">
          <button
            onClick={() => setActiveTab('blame')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'blame'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Line Blame & Code Frame
          </button>
          <button
            onClick={() => setActiveTab('stack')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'stack'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Stack Trace
          </button>
          <button
            onClick={() => setActiveTab('breadcrumbs')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'breadcrumbs'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Breadcrumbs Trail ({breadcrumbs.length})
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'context'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Scrubbed Context (JSONB)
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            JIRA & Azure Boards Orchestration
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
          
          {/* TAB 1: LINE BLAME & CODE FRAME */}
          {activeTab === 'blame' && (
            <div className="space-y-4">
              {culprit ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      {culprit.filePath} &mdash; line {culprit.lineChanged} in {culprit.methodName}()
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Blamed to commit {culprit.commitSha}
                    </span>
                  </div>

                  {/* Code Frame with Blame */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 font-mono text-xs">
                    <div className="divide-y divide-slate-800/60">
                      {culprit.codeSnippet.map((line, idx) => (
                        <div
                          key={idx}
                          className={`flex items-stretch transition ${
                            line.isErrorLine
                              ? 'bg-rose-950/60 text-rose-200 font-medium'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          {/* Line Number */}
                          <div className={`w-14 py-2 px-3 text-right select-none border-r ${
                            line.isErrorLine
                              ? 'bg-rose-900/50 border-rose-800 text-rose-300 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                          }`}>
                            {line.lineNumber}
                          </div>

                          {/* Blame annotation column */}
                          <div className={`w-40 py-2 px-3 truncate select-none border-r text-[10px] flex items-center gap-1.5 ${
                            line.isErrorLine
                              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400'
                          }`}>
                            <span className="font-semibold">@{line.author}</span>
                            <span className="opacity-60">{line.commitSha}</span>
                          </div>

                          {/* Code Content */}
                          <div className="flex-1 py-2 px-4 whitespace-pre overflow-x-auto">
                            {line.content}
                            {line.isErrorLine && (
                              <span className="ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-500 text-white shadow-sm">
                                Offending Line
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Culprit Confidence Reasoning
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {culprit.reason}
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No line blame artifact available for this record.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STACK TRACE */}
          {activeTab === 'stack' && currentOccurrence && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Normalized Stack Trace (Stripped memory offsets & line drifts for SHA-256 grouping)</span>
                <span className="font-mono text-slate-500">Correlation ID: {currentOccurrence.correlationId}</span>
              </div>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
                {currentOccurrence.stackTrace}
              </pre>
            </div>
          )}

          {/* TAB 3: BREADCRUMBS */}
          {activeTab === 'breadcrumbs' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Timeline of telemetry events and HTTP actions leading directly to this error:
              </div>
              <div className="space-y-2">
                {breadcrumbs.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs"
                  >
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-400 border border-slate-800">
                      {b.timestamp}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                      {b.category}
                    </span>
                    <div className="flex-1 text-slate-200">
                      {b.message}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.level === 'error' ? 'bg-rose-950 text-rose-300' :
                      b.level === 'warning' ? 'bg-amber-950 text-amber-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {b.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONTEXT */}
          {activeTab === 'context' && currentOccurrence && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  FR-03 Redacted Request Context (Pre-Persistence Scrubbing Applied)
                </span>
                <span className="font-mono text-slate-500">PostgreSQL JSONB payload</span>
              </div>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
                {JSON.stringify(currentOccurrence.requestContext, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 5: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Jira Card */}
                {errorGroup.jiraTicket ? (
                  <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800">
                          <Workflow className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Atlassian JIRA Cloud</div>
                          <div className="text-[10px] text-slate-400">Project: {errorGroup.jiraTicket.projectKey}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {errorGroup.jiraTicket.key}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200">
                      {errorGroup.jiraTicket.summary}
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Engineer:</span>
                        <span className="text-white font-semibold flex items-center gap-1.5">
                          <img src={errorGroup.jiraTicket.assigneeAvatar} className="w-4 h-4 rounded-full" />
                          {errorGroup.jiraTicket.assignee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-cyan-400 font-mono font-semibold">{errorGroup.jiraTicket.status}</span>
                      </div>
                    </div>

                    <a
                      href={errorGroup.jiraTicket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                    >
                      Open in Jira Cloud <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
                    No Jira ticket linked.
                  </div>
                )}

                {/* Azure Boards Card */}
                {errorGroup.azureBoardsTask ? (
                  <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-900/40 text-indigo-400 border border-indigo-800">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Azure Boards Work Item</div>
                          <div className="text-[10px] text-slate-400">{errorGroup.azureBoardsTask.areaPath}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {errorGroup.azureBoardsTask.workItemId}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200">
                      {errorGroup.azureBoardsTask.title}
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Engineer:</span>
                        <span className="text-white font-semibold flex items-center gap-1.5">
                          <img src={errorGroup.azureBoardsTask.assignedToAvatar} className="w-4 h-4 rounded-full" />
                          {errorGroup.azureBoardsTask.assignedTo}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">State:</span>
                        <span className="text-emerald-400 font-mono font-semibold">{errorGroup.azureBoardsTask.state}</span>
                      </div>
                    </div>

                    <a
                      href={errorGroup.azureBoardsTask.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                    >
                      Open in Azure DevOps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
                    No Azure Boards task linked.
                  </div>
                )}

              </div>

              {/* Orchestration Audit Trail */}
              {errorGroup.orchestrationLog && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Automated Orchestration Audit Trail
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {errorGroup.orchestrationLog.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-cyan-400 shrink-0">[{log.timestamp}]</span>
                        <span className="text-emerald-400 font-semibold shrink-0">{log.step}:</span>
                        <span className="text-slate-300">{log.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span>SHA-256: {errorGroup.fingerprint.slice(0, 16)}...</span>
            <button
              onClick={handleCopyFingerprint}
              className="p-1 hover:text-white transition"
              title="Copy Fingerprint"
            >
              {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div>
            Occurrences: <span className="text-white font-bold">{errorGroup.occurrenceCount}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
