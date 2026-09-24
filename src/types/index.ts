export type LogLevel = 'error' | 'warning' | 'info' | 'debug';

export type ErrorStatus = 'Open' | 'Investigating' | 'Resolved' | 'Ignored';

export type StackRuntime = 'node' | 'python' | 'go' | 'dotnet' | 'java' | 'react';

export type VCSProvider = 'github' | 'gitlab' | 'azure_repos' | 'bitbucket';

export type TaskTracker = 'jira' | 'azure_boards' | 'linear' | 'github_issues';

export interface CodeFrameLine {
  lineNumber: number;
  content: string;
  isErrorLine: boolean;
  author: string;
  commitSha: string;
  commitDate: string;
}

export interface GitBlameCulprit {
  authorName: string;
  authorEmail: string;
  githubUsername: string;
  avatarUrl: string;
  commitSha: string;
  commitMessage: string;
  committedAt: string;
  lineChanged: number;
  filePath: string;
  methodName: string;
  confidenceScore: number; // e.g. 94%
  reason: string;
  recentMethodCommitsCount: number;
  totalMethodCommitsCount: number;
  codeSnippet: CodeFrameLine[];
}

export interface Breadcrumb {
  id: string;
  type: 'navigation' | 'http' | 'log' | 'db' | 'user' | 'system';
  category: string;
  message: string;
  level: LogLevel;
  timestamp: string;
  data?: Record<string, any>;
}

export interface TicketLinkModel {
  id: string;
  integrationType: 'Jira' | 'AzureDevOps';
  externalTicketId: string;
  externalTicketUrl: string;
  status: string;
  lastSyncedAt: string;
  assignedTo?: string;
  assigneeAvatar?: string;
}

export interface AzureBoardsWorkItem {
  id: string;
  workItemId: string;
  title: string;
  workItemType: 'Bug' | 'Task' | 'Issue';
  state: string;
  assignedTo: string;
  assignedToAvatar?: string;
  url: string;
  areaPath: string;
  lastSyncedAt: string;
}

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  issueType: string;
  status: string;
  assignee: string;
  assigneeAvatar?: string;
  url: string;
  projectKey: string;
  lastSyncedAt: string;
}

export interface ErrorOccurrenceModel {
  id: string;
  timestamp: string;
  stackTrace: string;
  rawStackTrace?: string;
  requestContext: Record<string, any>;
  rawRequestContext?: Record<string, any>;
  version: string;
  correlationId: string;
  sourceEventId?: string;
}

export interface OrchestrationStepLog {
  step: string;
  timestamp: string;
  status: 'success' | 'running' | 'failed';
  detail: string;
}

export interface ErrorGroupModel {
  id: string;
  organizationId: string;
  serviceId: string;
  serviceName: string;
  environment: string;
  fingerprint: string;
  exceptionType: string;
  message: string;
  status: ErrorStatus;
  level: LogLevel;
  runtime: StackRuntime;
  repo: string;
  repoBranch?: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  assignedTeam: string;
  assignedOwner: string;
  ownershipMatchRule: string;
  routeTemplate?: string;
  ticketLinks: TicketLinkModel[];
  occurrences?: ErrorOccurrenceModel[];
  culprit?: GitBlameCulprit;
  breadcrumbs?: Breadcrumb[];
  jiraTicket?: JiraTicket;
  azureBoardsTask?: AzureBoardsWorkItem;
  orchestrationLog?: OrchestrationStepLog[];
}

export interface UserIdentityMapping {
  id: string;
  name: string;
  email: string;
  githubUsername: string;
  jiraAccountId: string;
  jiraDisplayName: string;
  azureBoardsEmail: string;
  azureBoardsDisplayName: string;
  team: string;
  role: string;
  avatar: string;
}

export interface ToolIntegrationConfig {
  github: {
    connected: boolean;
    org: string;
    repos: string[];
    tokenMasked: string;
    defaultBranch: string;
    webhookActive: boolean;
  };
  azureBoards: {
    connected: boolean;
    organization: string;
    project: string;
    areaPath: string;
    workItemType: 'Bug' | 'Task';
    patMasked: string;
  };
  jira: {
    connected: boolean;
    domain: string;
    projectKey: string;
    issueType: string;
    email: string;
    apiTokenMasked: string;
  };
  orchestrationRules: {
    enabled: boolean;
    autoAssignJira: boolean;
    autoAssignAzureBoards: boolean;
    minConfidenceThreshold: number; // 70%
    fallbackTeam: string;
    notifySlack: boolean;
  };
}

export interface IngestionSimResult {
  accepted: boolean;
  latencyMs: number;
  trackingId: string;
  fingerprint: string;
  isNewGroup: boolean;
  sanitizedTokensCount: number;
  matchedOwnership: {
    team: string;
    owner: string;
    rule: string;
    hierarchyStep: string;
  };
  culpritFound?: GitBlameCulprit;
  ticketCreated?: {
    provider: 'Jira' | 'AzureDevOps';
    ticketId: string;
    url: string;
  };
  azureBoardsCreated?: {
    workItemId: string;
    url: string;
    assignedTo: string;
  };
}
