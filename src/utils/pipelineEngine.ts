// 1:1 Mirror of Core Processing Engines (FR-03, FR-04, FR-06) + Git Blame & Multi-Platform Orchestrator

import { 
  GitBlameCulprit, 
  CodeFrameLine, 
  UserIdentityMapping, 
  OrchestrationStepLog,
  StackRuntime,
  LogLevel,
  JiraTicket,
  AzureBoardsWorkItem
} from '../types';
import { mockUserMappings, mockToolIntegrationConfig } from '../data/mockData';

export interface SanitizationResult {
  sanitizedStackTrace: string;
  sanitizedContext: Record<string, any>;
  redactedCount: number;
  detectedSecrets: string[];
}

export interface ParsedStackFrame {
  methodName: string;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  runtime: StackRuntime;
}

export class PipelineEngine {
  private static sensitiveKeyRegex = /(password|passwd|pwd|secret|token|apikey|api_key|auth|bearer|cookie|ssn|credit_card|cvv|private_key|connection_string)/i;
  
  private static bearerTokenRegex = /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi;
  private static headerAuthRegex = /(Authorization|Proxy-Authorization|X-Api-Key|X-Auth-Token)(\s*:\s*)([^\r\n]+)/gi;
  private static cookieRegex = /(Set-Cookie|Cookie)(\s*:\s*)([^\r\n]+)/gi;
  private static connStringPwdRegex = /(Password|Pwd)\s*=\s*([^;]+)/gi;

  // FR-03 Pre-Persistence Redaction
  public static sanitize(rawStackTrace: string, rawContext: Record<string, any>): SanitizationResult {
    let redactedCount = 0;
    const detectedSecrets: string[] = [];

    let sanitizedTrace = rawStackTrace || '';

    if (this.bearerTokenRegex.test(sanitizedTrace)) {
      sanitizedTrace = sanitizedTrace.replace(this.bearerTokenRegex, (match, prefix) => {
        redactedCount++;
        detectedSecrets.push('Bearer Authorization Token');
        return `${prefix}[REDACTED]`;
      });
    }

    if (this.headerAuthRegex.test(sanitizedTrace)) {
      sanitizedTrace = sanitizedTrace.replace(this.headerAuthRegex, (match, header, colon) => {
        redactedCount++;
        detectedSecrets.push(`${header} Header`);
        return `${header}${colon}[REDACTED]`;
      });
    }

    if (this.cookieRegex.test(sanitizedTrace)) {
      sanitizedTrace = sanitizedTrace.replace(this.cookieRegex, (match, header, colon) => {
        redactedCount++;
        detectedSecrets.push('Session Cookie');
        return `${header}${colon}[REDACTED]`;
      });
    }

    if (this.connStringPwdRegex.test(sanitizedTrace)) {
      sanitizedTrace = sanitizedTrace.replace(this.connStringPwdRegex, (match, prop) => {
        redactedCount++;
        detectedSecrets.push('Connection String Password');
        return `${prop}=[REDACTED]`;
      });
    }

    const sanitizedContext = JSON.parse(JSON.stringify(rawContext || {}));
    const scrubObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (this.sensitiveKeyRegex.test(key)) {
          redactedCount++;
          detectedSecrets.push(`Object property: "${key}"`);
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'string') {
          if (this.bearerTokenRegex.test(obj[key])) {
            redactedCount++;
            detectedSecrets.push(`Token in field "${key}"`);
            obj[key] = obj[key].replace(this.bearerTokenRegex, '$1[REDACTED]');
          }
          if (this.connStringPwdRegex.test(obj[key])) {
            redactedCount++;
            detectedSecrets.push(`Password in field "${key}"`);
            obj[key] = obj[key].replace(this.connStringPwdRegex, '$1=[REDACTED]');
          }
        } else if (typeof obj[key] === 'object') {
          scrubObject(obj[key]);
        }
      }
    };
    scrubObject(sanitizedContext);

    return {
      sanitizedStackTrace: sanitizedTrace,
      sanitizedContext,
      redactedCount,
      detectedSecrets: Array.from(new Set(detectedSecrets))
    };
  }

  // FR-04 Normalization: strip memory offsets, line numbers, GUIDs, timestamps
  public static normalizeStackFrames(rawStackTrace: string): string {
    if (!rawStackTrace) return '';
    return rawStackTrace
      .replace(/\+0x[0-9a-fA-F]+|\boffset\s+0x[0-9a-fA-F]+/g, '')
      .replace(/(:\s*line\s+\d+|:\d+:\d+|line\s+\d+)/gi, '')
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<GUID>')
      .replace(/\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?\b/g, '<TIMESTAMP>')
      .replace(/([A-Za-z]:\\[^:\n\r]*\\|\/(?:home|var|tmp|Users|app|runner)\/[^:\n\r]*\/)/gi, '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .slice(0, 15)
      .join('\n');
  }

  // Deterministic SHA-256
  public static async computeFingerprint(
    exceptionType: string,
    rawStackTrace: string,
    serviceName: string,
    routeTemplate?: string
  ): Promise<{ fingerprint: string; canonicalString: string; normalizedFrames: string }> {
    const cleanException = (exceptionType || 'UnknownException').trim();
    const cleanService = (serviceName || 'default-service').trim().toLowerCase();
    const cleanRoute = (routeTemplate || 'default-route').trim().toLowerCase();
    const normalizedFrames = this.normalizeStackFrames(rawStackTrace);

    const canonicalString = `${cleanException}|${cleanService}|${cleanRoute}|${normalizedFrames}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { fingerprint, canonicalString, normalizedFrames };
  }

  // Parse Stack Trace Frame (Supports Node.js, Python, Go, .NET, Java, React)
  public static parseTopApplicationFrame(stackTrace: string): ParsedStackFrame {
    const lines = stackTrace.split('\n');

    // 1. Python Frame: File "billing/tax_engine.py", line 92, in calculate_compound_tax
    const pyRegex = /File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+([A-Za-z0-9_]+)/;
    for (const line of lines) {
      const match = line.match(pyRegex);
      if (match) {
        return {
          filePath: match[1],
          lineNumber: parseInt(match[2], 10),
          methodName: match[3],
          runtime: 'python'
        };
      }
    }

    // 2. Node/JS Frame: at StripeClient.executeStripeCharge (/app/src/services/stripeClient.ts:184:28)
    const nodeRegex = /at\s+(?:([A-Za-z0-9_$.]+)\s+)?\(?([^:\n()]+):(\d+):?(\d+)?\)?/;
    for (const line of lines) {
      if (line.includes('node_modules') || line.includes('internal/modules')) continue;
      const match = line.match(nodeRegex);
      if (match) {
        return {
          methodName: match[1] || 'anonymous',
          filePath: match[2].trim(),
          lineNumber: parseInt(match[3], 10),
          columnNumber: match[4] ? parseInt(match[4], 10) : undefined,
          runtime: match[2].endsWith('.tsx') || match[2].endsWith('.jsx') ? 'react' : 'node'
        };
      }
    }

    // 3. Go Frame: at internal/jwt.(*Validator).VerifySessionToken (/app/internal/jwt/validator.go:64)
    const goRegex = /at\s+([A-Za-z0-9_./*()]+)\s+\(([^:\n]+):(\d+)\)/;
    for (const line of lines) {
      const match = line.match(goRegex);
      if (match) {
        return {
          methodName: match[1],
          filePath: match[2],
          lineNumber: parseInt(match[3], 10),
          runtime: 'go'
        };
      }
    }

    // 4. .NET Frame: at OrderService.Data.OrderRepository.FulfillOrderBatchAsync(Guid id) in C:\apps\OrderService\OrderRepository.cs:line 55
    const dotnetRegex = /at\s+([A-Za-z0-9_.]+)(?:\([^)]*\))?\s+(?:in\s+([^:\n]+):line\s+(\d+))/;
    for (const line of lines) {
      const match = line.match(dotnetRegex);
      if (match) {
        return {
          methodName: match[1].split('.').pop() || match[1],
          filePath: match[2],
          lineNumber: parseInt(match[3], 10),
          runtime: 'dotnet'
        };
      }
    }

    // Default fallback
    return {
      filePath: 'src/main.ts',
      lineNumber: 42,
      methodName: 'executeOperation',
      runtime: 'node'
    };
  }

  // Intelligent Git Blame & Commit Frequency Analyzer
  public static analyzeGitBlame(
    frame: ParsedStackFrame,
    serviceName: string,
    users: UserIdentityMapping[] = mockUserMappings
  ): GitBlameCulprit {
    const fileName = frame.filePath.toLowerCase();
    const method = frame.methodName.toLowerCase();

    // Match appropriate author based on stack frame file/service
    let matchedUser = users[0]; // default Sarah Chen

    if (fileName.includes('tax') || fileName.includes('billing') || frame.runtime === 'python') {
      matchedUser = users.find(u => u.githubUsername === 'erostova-ml') || users[3];
    } else if (fileName.includes('jwt') || fileName.includes('auth') || frame.runtime === 'go') {
      matchedUser = users.find(u => u.githubUsername === 'mvance-sec') || users[2];
    } else if (fileName.includes('order') || fileName.includes('npgsql') || fileName.includes('repo') || frame.runtime === 'dotnet') {
      matchedUser = users.find(u => u.githubUsername === 'arivera-dev') || users[1];
    } else if (fileName.includes('shipping') || fileName.includes('ui') || fileName.includes('form') || frame.runtime === 'react') {
      matchedUser = users.find(u => u.githubUsername === 'dkim-frontend') || users[4];
    } else if (serviceName.includes('payment') || fileName.includes('stripe')) {
      matchedUser = users.find(u => u.githubUsername === 'sarah-chen') || users[0];
    }

    // Commit SHA generation
    const sha = Math.random().toString(36).substring(2, 9);
    const line = frame.lineNumber || 42;

    // Build code snippet frame around line
    const codeSnippet: CodeFrameLine[] = [
      { lineNumber: line - 3, content: `    // Prepare execution context for ${frame.methodName}`, isErrorLine: false, author: matchedUser.githubUsername, commitSha: sha, commitDate: '4 hours ago' },
      { lineNumber: line - 2, content: `    const ctx = getRequestContext();`, isErrorLine: false, author: matchedUser.githubUsername, commitSha: sha, commitDate: '4 hours ago' },
      { lineNumber: line - 1, content: `    logger.info("Executing transaction pipeline");`, isErrorLine: false, author: matchedUser.githubUsername, commitSha: sha, commitDate: '4 hours ago' },
      { lineNumber: line, content: `    const result = await invokeUpstreamHandler(ctx, payload); // Thrown here!`, isErrorLine: true, author: matchedUser.githubUsername, commitSha: sha, commitDate: '4 hours ago' },
      { lineNumber: line + 1, content: `    return formatSuccessResponse(result);`, isErrorLine: false, author: matchedUser.githubUsername, commitSha: sha, commitDate: '4 hours ago' },
      { lineNumber: line + 2, content: `  } catch (err) {`, isErrorLine: false, author: matchedUser.githubUsername, commitSha: sha, commitDate: '4 hours ago' }
    ];

    const recentMethodCommits = Math.floor(12 + Math.random() * 5);
    const totalMethodCommits = recentMethodCommits + Math.floor(2 + Math.random() * 4);
    const confidenceScore = Math.min(99, Math.floor(90 + Math.random() * 8));

    return {
      authorName: matchedUser.name,
      authorEmail: matchedUser.email,
      githubUsername: matchedUser.githubUsername,
      avatarUrl: matchedUser.avatar,
      commitSha: sha,
      commitMessage: `feat(${serviceName}): optimize ${frame.methodName} flow and refresh client dependencies`,
      committedAt: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
      lineChanged: line,
      filePath: frame.filePath,
      methodName: frame.methodName,
      confidenceScore,
      reason: `Direct author of line ${line} in commit ${sha} (4 hours ago). Authored ${recentMethodCommits} of ${totalMethodCommits} commits to ${frame.methodName}() in ${frame.filePath}.`,
      recentMethodCommitsCount: recentMethodCommits,
      totalMethodCommitsCount: totalMethodCommits,
      codeSnippet
    };
  }

  // Dual Ticket Orchestration (JIRA + Azure Boards Auto-Assignment)
  public static orchestrateTickets(
    serviceName: string,
    exceptionType: string,
    culprit: GitBlameCulprit,
    user: UserIdentityMapping
  ): {
    jira: JiraTicket;
    azureBoards: AzureBoardsWorkItem;
    logs: OrchestrationStepLog[];
  } {
    const nowStr = new Date().toLocaleTimeString();
    const jiraKey = `PAY-${Math.floor(1800 + Math.random() * 150)}`;
    const adoId = `ADO#${Math.floor(98200 + Math.random() * 200)}`;

    const jira: JiraTicket = {
      id: 'jira-' + Math.random().toString(36).substring(2, 8),
      key: jiraKey,
      summary: `${exceptionType}: Unhandled fault in ${culprit.filePath}:${culprit.lineChanged}`,
      issueType: 'Bug',
      status: 'OPEN',
      assignee: user.jiraDisplayName,
      assigneeAvatar: user.avatar,
      url: `https://acme-corp.atlassian.net/browse/${jiraKey}`,
      projectKey: 'PAY',
      lastSyncedAt: new Date().toISOString()
    };

    const azureBoards: AzureBoardsWorkItem = {
      id: 'ado-' + Math.random().toString(36).substring(2, 8),
      workItemId: adoId,
      title: `Fix ${exceptionType} in ${culprit.methodName}()`,
      workItemType: 'Bug',
      state: 'Active',
      assignedTo: user.azureBoardsDisplayName,
      assignedToAvatar: user.avatar,
      url: `https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/${adoId.replace('ADO#', '')}`,
      areaPath: `CoreEngineering\\${user.team.replace(' ', '')}`,
      lastSyncedAt: new Date().toISOString()
    };

    const logs: OrchestrationStepLog[] = [
      {
        step: 'SDK Capture',
        timestamp: nowStr,
        status: 'success',
        detail: `Captured unhandled ${exceptionType} in ${culprit.filePath}:${culprit.lineChanged}`
      },
      {
        step: 'Git Blame Engine',
        timestamp: nowStr,
        status: 'success',
        detail: `Blamed line ${culprit.lineChanged} -> commit ${culprit.commitSha} by @${culprit.githubUsername} (${culprit.confidenceScore}% confidence)`
      },
      {
        step: 'Identity Mapping',
        timestamp: nowStr,
        status: 'success',
        detail: `Mapped GitHub @${culprit.githubUsername} -> Jira "${user.jiraDisplayName}" & Azure Boards "${user.azureBoardsDisplayName}"`
      },
      {
        step: 'JIRA Ticket Creation',
        timestamp: nowStr,
        status: 'success',
        detail: `Created ${jiraKey} (Bug) in project PAY; automatically assigned to ${user.name}`
      },
      {
        step: 'Azure Boards Task Creation',
        timestamp: nowStr,
        status: 'success',
        detail: `Created ${adoId} (Bug) in ${azureBoards.areaPath}; automatically assigned to ${user.name}`
      }
    ];

    return { jira, azureBoards, logs };
  }

  // FR-06 Hierarchical Ownership Matcher
  public static resolveOwnership(
    serviceName: string,
    environment: string,
    rawStackTrace: string,
    routeTemplate?: string
  ) {
    const text = `${rawStackTrace} ${routeTemplate || ''}`;

    if (/(\/checkout|\/payment|PaymentsController|BillingService|stripe)/i.test(text)) {
      return {
        team: 'Payments Engineering',
        owner: 'sarah.chen@acme.corp',
        rule: 'GitBlame: Exact line author + Payments Lead',
        step: '1. Git Blame & Path Evaluation'
      };
    }
    if (/(\/auth|\/login|\/oauth|TokenValidator|JwtService|jwt)/i.test(text)) {
      return {
        team: 'Identity & Auth Gateway',
        owner: 'marcus.vance@acme.corp',
        rule: 'GitBlame: Exact line author + Security Lead',
        step: '1. Git Blame & Path Evaluation'
      };
    }
    if (/(\/tax|\/billing|decimal|reconciliation)/i.test(text)) {
      return {
        team: 'Data & Analytics',
        owner: 'elena.rostova@acme.corp',
        rule: 'GitBlame: Exact line author + Data Platforms',
        step: '1. Git Blame & Path Evaluation'
      };
    }
    if (/(\/inventory|\/order|Npgsql|deadlock)/i.test(text)) {
      return {
        team: 'Core Platform & DB',
        owner: 'alex.rivera@acme.corp',
        rule: 'GitBlame: Exact line author + Senior SRE',
        step: '1. Git Blame & Path Evaluation'
      };
    }
    if (/(\/shipping|\/form|TypeError|react|ui)/i.test(text)) {
      return {
        team: 'Web & Growth',
        owner: 'david.kim@acme.corp',
        rule: 'GitBlame: Exact line author + Frontend UI Architect',
        step: '1. Git Blame & Path Evaluation'
      };
    }

    return {
      team: 'Triage Engineering On-Call',
      owner: 'sre-triage@acme.corp',
      rule: 'Fallback: On-Call Rotation Queue',
      step: '7. Triage Queue Fallback'
    };
  }
}
