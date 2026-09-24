import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Github, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Sliders, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Workflow,
  Sparkles,
  Link2
} from 'lucide-react';
import { UserIdentityMapping, ToolIntegrationConfig } from '../types';

interface IntegrationsSettingsModalProps {
  onClose: () => void;
  config: ToolIntegrationConfig;
  onUpdateConfig: (newConfig: ToolIntegrationConfig) => void;
  users: UserIdentityMapping[];
  onUpdateUsers: (newUsers: UserIdentityMapping[]) => void;
}

export const IntegrationsSettingsModal: React.FC<IntegrationsSettingsModalProps> = ({
  onClose,
  config,
  onUpdateConfig,
  users,
  onUpdateUsers
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'users' | 'orchestration'>('tools');
  const [localConfig, setLocalConfig] = useState<ToolIntegrationConfig>(config);
  const [localUsers, setLocalUsers] = useState<UserIdentityMapping[]>(users);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState<Partial<UserIdentityMapping>>({
    name: '',
    email: '',
    githubUsername: '',
    jiraDisplayName: '',
    azureBoardsDisplayName: '',
    azureBoardsEmail: '',
    team: 'Core Platform & DB',
    role: 'Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  });

  const handleSaveAll = () => {
    onUpdateConfig(localConfig);
    onUpdateUsers(localUsers);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.githubUsername) return;

    const created: UserIdentityMapping = {
      id: 'usr-' + Date.now().toString(36),
      name: newUser.name,
      email: newUser.email || `${newUser.githubUsername}@acme.corp`,
      githubUsername: newUser.githubUsername,
      jiraAccountId: 'jira_' + Math.random().toString(36).substring(2, 7),
      jiraDisplayName: newUser.jiraDisplayName || newUser.name,
      azureBoardsEmail: newUser.azureBoardsEmail || `${newUser.githubUsername}@dev.azure.com`,
      azureBoardsDisplayName: newUser.azureBoardsDisplayName || newUser.name,
      team: newUser.team || 'General Engineering',
      role: newUser.role || 'Software Engineer',
      avatar: newUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    };

    setLocalUsers([...localUsers, created]);
    setShowAddUserModal(false);
    setNewUser({
      name: '',
      email: '',
      githubUsername: '',
      jiraDisplayName: '',
      azureBoardsDisplayName: '',
      azureBoardsEmail: '',
      team: 'Core Platform & DB',
      role: 'Software Engineer'
    });
  };

  const handleDeleteUser = (id: string) => {
    setLocalUsers(localUsers.filter(u => u.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-md shadow-cyan-500/20 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Tool Integrations & User Identity Mapping
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  VCS + Jira + Azure Boards
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your VCS (GitHub) commit author mapping to Jira accounts & Azure Boards identities for automatic error orchestration.
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-800 bg-slate-950 text-xs">
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tools'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            1. Tool Connections (GitHub, Jira, Azure Boards)
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            2. User Identity Directory ({localUsers.length} Mapped)
          </button>
          <button
            onClick={() => setActiveTab('orchestration')}
            className={`py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'orchestration'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            3. Automated Assignment Policies
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-950">
          
          {/* TAB 1: TOOLS CONFIG */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              
              {/* GitHub Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-white border border-slate-700">
                      <Github className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        GitHub / VCS Repository Integration
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Connected & Synced
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tracks line-level commits and calculates frequent authors per function/method.
                      </p>
                    </div>
                  </div>
                  <button className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                    Manage Webhooks <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">GitHub Organization</label>
                    <input
                      type="text"
                      value={localConfig.github.org}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        github: { ...localConfig.github, org: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Default Branch</label>
                    <input
                      type="text"
                      value={localConfig.github.defaultBranch}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        github: { ...localConfig.github, defaultBranch: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">Tracked Repositories</label>
                    <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950 border border-slate-700 rounded-lg">
                      {localConfig.github.repos.map((repo, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                          {repo}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Jira Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Atlassian Jira Cloud Integration
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Authenticated
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Automatically creates Jira Bug tickets and assigns them to the responsible Git committer.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Jira Domain</label>
                    <input
                      type="text"
                      value={localConfig.jira.domain}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        jira: { ...localConfig.jira, domain: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Project Key</label>
                    <input
                      type="text"
                      value={localConfig.jira.projectKey}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        jira: { ...localConfig.jira, projectKey: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Issue Type</label>
                    <input
                      type="text"
                      value={localConfig.jira.issueType}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        jira: { ...localConfig.jira, issueType: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Azure Boards Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-900/40 text-indigo-400 border border-indigo-800">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Microsoft Azure Boards & DevOps Integration
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Authenticated
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Dispatches work items & tasks directly to team sprints assigned to the identified committer.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Azure DevOps Org</label>
                    <input
                      type="text"
                      value={localConfig.azureBoards.organization}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        azureBoards: { ...localConfig.azureBoards, organization: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Project Name</label>
                    <input
                      type="text"
                      value={localConfig.azureBoards.project}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        azureBoards: { ...localConfig.azureBoards, project: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Area Path</label>
                    <input
                      type="text"
                      value={localConfig.azureBoards.areaPath}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        azureBoards: { ...localConfig.azureBoards, areaPath: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: USER DIRECTORY MAPPINGS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Cross-Platform User Identity Directory</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connects Git commit authors to Jira and Azure Boards accounts so errors automatically assign to the right engineer.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Map New Developer
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Engineer</th>
                      <th className="py-3 px-4">GitHub Commit Handle</th>
                      <th className="py-3 px-4">Jira Account</th>
                      <th className="py-3 px-4">Azure Boards Identity</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {localUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                            />
                            <div>
                              <div className="font-semibold text-white">{user.name}</div>
                              <div className="text-[11px] text-slate-400">{user.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300">
                          @{user.githubUsername}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">{user.jiraDisplayName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{user.jiraAccountId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">{user.azureBoardsDisplayName}</div>
                          <div className="text-[10px] text-slate-500">{user.azureBoardsEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                            {user.team}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add User Modal */}
              {showAddUserModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <form
                    onSubmit={handleAddUser}
                    className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-cyan-400" />
                        Map New Developer Identity
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newUser.name}
                          onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="e.g. Rachel Green"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">GitHub Username</label>
                        <input
                          type="text"
                          required
                          value={newUser.githubUsername}
                          onChange={e => setNewUser({ ...newUser, githubUsername: e.target.value })}
                          placeholder="e.g. rgreen-eng"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Jira Display Name</label>
                        <input
                          type="text"
                          value={newUser.jiraDisplayName}
                          onChange={e => setNewUser({ ...newUser, jiraDisplayName: e.target.value })}
                          placeholder="e.g. Rachel Green (Senior SRE)"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Azure Boards Email</label>
                        <input
                          type="email"
                          value={newUser.azureBoardsEmail}
                          onChange={e => setNewUser({ ...newUser, azureBoardsEmail: e.target.value })}
                          placeholder="e.g. rachel.green@dev.azure.com"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Team</label>
                        <select
                          value={newUser.team}
                          onChange={e => setNewUser({ ...newUser, team: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Payments Engineering">Payments Engineering</option>
                          <option value="Core Platform & DB">Core Platform & DB</option>
                          <option value="Identity & Auth Gateway">Identity & Auth Gateway</option>
                          <option value="Data & Analytics">Data & Analytics</option>
                          <option value="Web & Growth">Web & Growth</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 text-xs font-semibold"
                      >
                        Add to Directory
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: ORCHESTRATION POLICIES */}
          {activeTab === 'orchestration' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Automated Ticket Dispatch & Direct Assignment Rules
                </h4>
                <p className="text-xs text-slate-400">
                  When an error occurs, the system traces the stack line, blames the most recent / frequent committer, and triggers multi-platform ticket creation.
                </p>

                <div className="space-y-4 pt-2">
                  
                  {/* Jira toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white">Auto-Assign JIRA Bug to Line Culprit</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Creates ticket in Jira project <span className="font-mono text-cyan-400">{localConfig.jira.projectKey}</span> with priority based on error severity and assigns directly to committer.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.orchestrationRules.autoAssignJira}
                        onChange={e => setLocalConfig({
                          ...localConfig,
                          orchestrationRules: { ...localConfig.orchestrationRules, autoAssignJira: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  {/* Azure Boards toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white">Auto-Assign Azure Boards Task to Line Culprit</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Creates work item in Azure DevOps area <span className="font-mono text-indigo-400">{localConfig.azureBoards.areaPath}</span> and assigns directly to author's Azure identity.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.orchestrationRules.autoAssignAzureBoards}
                        onChange={e => setLocalConfig({
                          ...localConfig,
                          orchestrationRules: { ...localConfig.orchestrationRules, autoAssignAzureBoards: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Confidence Slider */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">Minimum Culprit Confidence Threshold</div>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {localConfig.orchestrationRules.minConfidenceThreshold}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={localConfig.orchestrationRules.minConfidenceThreshold}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        orchestrationRules: {
                          ...localConfig.orchestrationRules,
                          minConfidenceThreshold: parseInt(e.target.value, 10)
                        }
                      })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-400">
                      If line blame confidence is below this threshold, tickets fall back to the On-Call rotation queue.
                    </div>
                  </div>

                  {/* Fallback queue */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 text-xs">Fallback Triage Queue / Team</label>
                    <input
                      type="text"
                      value={localConfig.orchestrationRules.fallbackTeam}
                      onChange={e => setLocalConfig({
                        ...localConfig,
                        orchestrationRules: { ...localConfig.orchestrationRules, fallbackTeam: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Tokens and API credentials encrypted at rest.
          </div>
          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved changes!
              </span>
            )}
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-600/20"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
