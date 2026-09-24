import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Fingerprint, 
  Server, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  FileCode, 
  Layers, 
  Activity, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  RefreshCw,
  GitBranch,
  Code2,
  Settings,
  Workflow,
  Building2,
  Cpu,
  Users,
  GitCommit,
  Bug,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  ErrorGroupModel, 
  ErrorStatus, 
  LogLevel, 
  StackRuntime, 
  UserIdentityMapping, 
  ToolIntegrationConfig 
} from '../types';
import { 
  initialErrorGroups, 
  mockUserMappings, 
  mockToolIntegrationConfig 
} from '../data/mockData';
import { ErrorDetailModal } from './ErrorDetailModal';
import { TelemetrySimulatorModal } from './TelemetrySimulatorModal';
import { SanitizerDiffModal } from './SanitizerDiffModal';
import { PollySimulatorModal } from './PollySimulatorModal';
import { DotnetCodeViewer } from './DotnetCodeViewer';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { SdkCodeConfigModal } from './SdkCodeConfigModal';
import { IntegrationsSettingsModal } from './IntegrationsSettingsModal';
import { ErrorOrchestrationSimulatorModal } from './ErrorOrchestrationSimulatorModal';

export const ErrorDashboard: React.FC = () => {
  const [errorGroups, setErrorGroups] = useState<ErrorGroupModel[]>(initialErrorGroups);
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroupModel | null>(null);

  // Cross-Tool Config & User Directory State
  const [userMappings, setUserMappings] = useState<UserIdentityMapping[]>(mockUserMappings);
  const [toolConfig, setToolConfig] = useState<ToolIntegrationConfig>(mockToolIntegrationConfig);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuntime, setSelectedRuntime] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals state
  const [showSdkConfig, setShowSdkConfig] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showOrchestrationSim, setShowOrchestrationSim] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showSanitizerDiff, setShowSanitizerDiff] = useState(false);
  const [showPollyTester, setShowPollyTester] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  // Status Colors
  const statusBadges: Record<ErrorStatus, { bg: string; text: string; border: string }> = {
    Open: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    Investigating: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    Resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Ignored: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' }
  };

  const runtimeBadges: Record<StackRuntime, { label: string; color: string }> = {
    node: { label: 'Node.js', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    python: { label: 'Python', color: 'bg-amber-950 text-amber-300 border-amber-800' },
    go: { label: 'Go', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
    dotnet: { label: '.NET 8', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
    java: { label: 'Java', color: 'bg-rose-950 text-rose-300 border-rose-800' },
    react: { label: 'React UI', color: 'bg-sky-950 text-sky-300 border-sky-800' }
  };

  // Filtered & Searched Data
  const filteredGroups = useMemo(() => {
    return errorGroups.filter(g => {
      const matchesSearch = 
        g.exceptionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.fingerprint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.culprit?.authorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.jiraTicket?.key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.azureBoardsTask?.workItemId || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRuntime = selectedRuntime === 'All' || g.runtime === selectedRuntime;
      const matchesLevel = selectedLevel === 'All' || g.level === selectedLevel;
      const matchesStatus = selectedStatus === 'All' || g.status === selectedStatus;

      return matchesSearch && matchesRuntime && matchesLevel && matchesStatus;
    });
  }, [errorGroups, searchQuery, selectedRuntime, selectedLevel, selectedStatus]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, currentPage, pageSize]);

  // Statistics
  const totalOccurrences = useMemo(() => {
    return errorGroups.reduce((acc, g) => acc + g.occurrenceCount, 0);
  }, [errorGroups]);

  const openIncidents = useMemo(() => {
    return errorGroups.filter(g => g.status === 'Open' || g.status === 'Investigating').length;
  }, [errorGroups]);

  const handleStatusChange = (id: string, newStatus: ErrorStatus) => {
    setErrorGroups(prev => prev.map(g => {
      if (g.id === id) {
        return {
          ...g,
          status: newStatus,
          ticketLinks: g.ticketLinks.map(t => ({ ...t, status: newStatus, lastSyncedAt: new Date().toISOString() })),
          jiraTicket: g.jiraTicket ? { ...g.jiraTicket, status: newStatus === 'Resolved' ? 'DONE' : newStatus === 'Investigating' ? 'IN PROGRESS' : 'OPEN' } : undefined,
          azureBoardsTask: g.azureBoardsTask ? { ...g.azureBoardsTask, state: newStatus === 'Resolved' ? 'Resolved' : 'Active' } : undefined
        };
      }
      return g;
    }));

    if (selectedGroup && selectedGroup.id === id) {
      setSelectedGroup(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleInjectNewGroup = (newGroup: ErrorGroupModel) => {
    setErrorGroups(prev => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/40">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  Universal Production Error Orchestration Platform
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Sentry-Compatible &bull; Multi-Stack
                </span>
              </div>
              <p className="text-xs text-slate-400">
                In-Code SDKs &bull; Line-Level Git Blame &bull; Automated JIRA & Azure Boards Assignment
              </p>
            </div>
          </div>

          {/* Core Action Suite */}
          <div className="flex items-center gap-2">
            
            {/* 1. SDK In-Code Setup Button */}
            <button
              onClick={() => setShowSdkConfig(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
              title="Configure in-code SDKs for Node, Python, Go, .NET, React"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>SDK In-Code Setup</span>
            </button>

            {/* 2. Tools & User Directory */}
            <button
              onClick={() => setShowIntegrations(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-800/60 shadow-sm transition cursor-pointer"
              title="Configure GitHub, Jira, Azure Boards & Developer Identity Mapping"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Tools & User Directory</span>
            </button>

            {/* 3. Live Error Orchestrator */}
            <button
              onClick={() => setShowOrchestrationSim(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer"
              title="Simulate runtime error, parse offending line, blame committer & auto-assign tickets"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Error Orchestrator</span>
            </button>

            {/* Telemetry Ingest Simulator */}
            <button
              onClick={() => setShowSimulator(true)}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 font-medium text-xs border border-slate-700 transition cursor-pointer"
              title="Test <50ms Ingestion SLA & PII Scrubbing"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ingestion SLA</span>
            </button>

            {/* Other tools */}
            <button
              onClick={() => setShowSanitizerDiff(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-400 font-medium text-xs border border-slate-700 transition cursor-pointer"
              title="FR-03 Redaction Diff"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PII Diff</span>
            </button>

            <button
              onClick={() => setShowPollyTester(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-medium text-xs border border-slate-700 transition cursor-pointer"
              title="Polly Retry / DLQ Tester"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Polly DLQ</span>
            </button>

            <button
              onClick={() => setShowArchitecture(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-purple-300 font-medium text-xs border border-purple-800/50 transition cursor-pointer"
              title="View full distributed architecture topology"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Topology</span>
            </button>

            <button
              onClick={() => setShowCodeViewer(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition cursor-pointer"
              title="Inspect backend code & contracts"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Contracts</span>
            </button>

          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono font-medium">Ingested Occurrences</div>
              <div className="text-2xl font-bold text-white mt-1">{totalOccurrences.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sub-50ms SLA Verified
              </div>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono font-medium">Line-Level Blame Rate</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <GitCommit className="w-3 h-3 text-cyan-400" /> Committer & SHA Identified
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono font-medium">Ticket Auto-Assignment</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">100%</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Workflow className="w-3 h-3 text-indigo-400" /> Jira & Azure Boards Synchronized
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono font-medium">Mapped Engineers</div>
              <div className="text-2xl font-bold text-white mt-1">{userMappings.length}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> GitHub &rarr; Jira & ADO linked
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Filters & Search Control Bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by exception, message, line author, repo, Jira key (PAY-1849)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Runtime Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedRuntime}
                onChange={(e) => {
                  setSelectedRuntime(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Stacks</option>
                <option value="node" className="bg-slate-900">Node.js</option>
                <option value="python" className="bg-slate-900">Python</option>
                <option value="go" className="bg-slate-900">Go</option>
                <option value="dotnet" className="bg-slate-900">.NET 8</option>
                <option value="react" className="bg-slate-900">React UI</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Levels</option>
                <option value="error" className="bg-slate-900">Errors Only</option>
                <option value="warning" className="bg-slate-900">Warnings Only</option>
                <option value="info" className="bg-slate-900">Info Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Statuses</option>
                <option value="Open" className="bg-slate-900">Open</option>
                <option value="Investigating" className="bg-slate-900">Investigating</option>
                <option value="Resolved" className="bg-slate-900">Resolved</option>
                <option value="Ignored" className="bg-slate-900">Ignored</option>
              </select>
            </div>

          </div>

        </div>

        {/* Sentry-Style Issues & Events Stream */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/90 shadow-xl">
          
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Production Issues & Orchestrated Events ({filteredGroups.length})
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Auto-resolved via Git Blame & Assigned to Committer
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {paginatedGroups.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No error groups match the specified filters.
              </div>
            ) : (
              paginatedGroups.map((group) => {
                const culprit = group.culprit;
                const runtimeInfo = runtimeBadges[group.runtime] || runtimeBadges.node;
                const statusBadge = statusBadges[group.status];

                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className="p-5 hover:bg-slate-800/50 transition cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                  >
                    
                    {/* Left: Stack info & message */}
                    <div className="space-y-2 flex-1 min-w-0 pr-4">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Level badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          group.level === 'error' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          group.level === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {group.level || 'error'}
                        </span>

                        {/* Runtime badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${runtimeInfo.color}`}>
                          {runtimeInfo.label}
                        </span>

                        {/* Service tag */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                          {group.serviceName}
                        </span>

                        {/* Repo & Line */}
                        {culprit && (
                          <span className="text-[11px] font-mono text-cyan-400/90 truncate">
                            {culprit.filePath}:{culprit.lineChanged} &bull; {culprit.methodName}()
                          </span>
                        )}
                      </div>

                      {/* Exception & Message */}
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition break-all">
                          {group.exceptionType}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {group.message}
                        </p>
                      </div>

                      {/* Culprit committer banner */}
                      {culprit && (
                        <div className="flex items-center gap-3 pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={culprit.avatarUrl}
                              alt={culprit.authorName}
                              className="w-5 h-5 rounded-full ring-1 ring-emerald-500 object-cover"
                            />
                            <span className="text-slate-300 font-medium">
                              {culprit.authorName}
                            </span>
                            <span className="text-[11px] font-mono text-cyan-400">
                              @{culprit.githubUsername}
                            </span>
                          </div>

                          <span className="text-slate-600">&bull;</span>

                          <span className="text-[11px] text-slate-400">
                            Commit <span className="font-mono text-slate-300">{culprit.commitSha}</span>
                          </span>

                          <span className="text-slate-600">&bull;</span>

                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                            {culprit.confidenceScore}% Blame Match
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Right: Tickets, Occurrences & Status */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                      
                      {/* Ticket Link Badges (JIRA + Azure Boards) */}
                      <div className="flex items-center gap-2">
                        {group.jiraTicket && (
                          <span
                            className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-800 text-[11px] font-mono font-medium text-blue-300 flex items-center gap-1.5 shadow-sm"
                            title={`Jira ${group.jiraTicket.key} assigned to ${group.jiraTicket.assignee}`}
                          >
                            <Workflow className="w-3 h-3 text-blue-400" />
                            {group.jiraTicket.key}
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            <span className="text-[10px] text-blue-200">{group.jiraTicket.assignee.split(' ')[0]}</span>
                          </span>
                        )}

                        {group.azureBoardsTask && (
                          <span
                            className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-800 text-[11px] font-mono font-medium text-indigo-300 flex items-center gap-1.5 shadow-sm"
                            title={`Azure Boards ${group.azureBoardsTask.workItemId} assigned to ${group.azureBoardsTask.assignedTo}`}
                          >
                            <Building2 className="w-3 h-3 text-indigo-400" />
                            {group.azureBoardsTask.workItemId}
                          </span>
                        )}
                      </div>

                      {/* Event Count */}
                      <div className="text-right">
                        <div className="text-sm font-bold text-white font-mono">
                          {group.occurrenceCount}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Events</div>
                      </div>

                      {/* Status */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {group.status}
                      </span>

                      {/* View Action */}
                      <div className="p-1.5 text-slate-400 group-hover:text-cyan-400 transition">
                        <ChevronRight className="w-5 h-5" />
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`p-1.5 rounded-lg border border-slate-800 transition ${
                  currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`p-1.5 rounded-lg border border-slate-800 transition ${
                  currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* MODAL DIALOGS */}
      
      {/* 1. Sentry-Like In-Code SDK Setup Modal */}
      {showSdkConfig && (
        <SdkCodeConfigModal onClose={() => setShowSdkConfig(false)} />
      )}

      {/* 2. Tools & User Identity Mapping Modal */}
      {showIntegrations && (
        <IntegrationsSettingsModal
          onClose={() => setShowIntegrations(false)}
          config={toolConfig}
          onUpdateConfig={setToolConfig}
          users={userMappings}
          onUpdateUsers={setUserMappings}
        />
      )}

      {/* 3. Live Error Orchestrator & Blame Simulator */}
      {showOrchestrationSim && (
        <ErrorOrchestrationSimulatorModal
          onClose={() => setShowOrchestrationSim(false)}
          users={userMappings}
          config={toolConfig}
          onOrchestrationComplete={handleInjectNewGroup}
        />
      )}

      {/* 4. Issue Detail Modal */}
      {selectedGroup && (
        <ErrorDetailModal
          errorGroup={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* 5. Telemetry Ingestion Simulator (<50ms SLA) */}
      {showSimulator && (
        <TelemetrySimulatorModal
          onClose={() => setShowSimulator(false)}
          onEventIngested={(newG: ErrorGroupModel) => {
            setErrorGroups(prev => [newG, ...prev]);
            setSelectedGroup(newG);
          }}
        />
      )}

      {/* 6. Sanitizer Diff */}
      {showSanitizerDiff && (
        <SanitizerDiffModal onClose={() => setShowSanitizerDiff(false)} />
      )}

      {/* 7. Polly Tester */}
      {showPollyTester && (
        <PollySimulatorModal onClose={() => setShowPollyTester(false)} />
      )}

      {/* 8. .NET Code Viewer & Topology */}
      {showCodeViewer && (
        <DotnetCodeViewer onClose={() => setShowCodeViewer(false)} />
      )}

      {showArchitecture && (
        <ArchitectureDiagram onClose={() => setShowArchitecture(false)} />
      )}

    </div>
  );
};
