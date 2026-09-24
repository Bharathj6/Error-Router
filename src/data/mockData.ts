import { 
  ErrorGroupModel, 
  UserIdentityMapping, 
  ToolIntegrationConfig 
} from '../types';

export const mockUserMappings: UserIdentityMapping[] = [
  {
    id: 'usr-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.corp',
    githubUsername: 'sarah-chen',
    jiraAccountId: 'jira_acc_99214',
    jiraDisplayName: 'Sarah Chen (Staff Engineer)',
    azureBoardsEmail: 'sarah.chen@dev.azure.com',
    azureBoardsDisplayName: 'Sarah Chen',
    team: 'Payments Engineering',
    role: 'Principal Backend Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-002',
    name: 'Alex Rivera',
    email: 'alex.rivera@acme.corp',
    githubUsername: 'arivera-dev',
    jiraAccountId: 'jira_acc_88102',
    jiraDisplayName: 'Alex Rivera (Senior SRE)',
    azureBoardsEmail: 'alex.rivera@dev.azure.com',
    azureBoardsDisplayName: 'Alex Rivera',
    team: 'Core Platform & DB',
    role: 'Staff Infrastructure Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-003',
    name: 'Marcus Vance',
    email: 'marcus.vance@acme.corp',
    githubUsername: 'mvance-sec',
    jiraAccountId: 'jira_acc_77319',
    jiraDisplayName: 'Marcus Vance (Security Lead)',
    azureBoardsEmail: 'marcus.vance@dev.azure.com',
    azureBoardsDisplayName: 'Marcus Vance',
    team: 'Identity & Auth Gateway',
    role: 'Lead Security Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-004',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.corp',
    githubUsername: 'erostova-ml',
    jiraAccountId: 'jira_acc_66412',
    jiraDisplayName: 'Elena Rostova (Data Platforms)',
    azureBoardsEmail: 'elena.rostova@dev.azure.com',
    azureBoardsDisplayName: 'Elena Rostova',
    team: 'Data & Analytics',
    role: 'Senior Data Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-005',
    name: 'David Kim',
    email: 'david.kim@acme.corp',
    githubUsername: 'dkim-frontend',
    jiraAccountId: 'jira_acc_55209',
    jiraDisplayName: 'David Kim (Frontend UI)',
    azureBoardsEmail: 'david.kim@dev.azure.com',
    azureBoardsDisplayName: 'David Kim',
    team: 'Web & Growth',
    role: 'Senior UI Architect',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80'
  }
];

export const mockToolIntegrationConfig: ToolIntegrationConfig = {
  github: {
    connected: true,
    org: 'acme-corp',
    repos: [
      'acme-corp/payment-service',
      'acme-corp/order-service-node',
      'acme-corp/billing-worker-py',
      'acme-corp/auth-gateway-go',
      'acme-corp/checkout-web-react'
    ],
    tokenMasked: 'ghp_live_••••••••••••••••994a',
    defaultBranch: 'main',
    webhookActive: true
  },
  azureBoards: {
    connected: true,
    organization: 'acme-corp-devops',
    project: 'CoreEngineering',
    areaPath: 'CoreEngineering\\Services',
    workItemType: 'Bug',
    patMasked: 'ado_pat_••••••••••••••••881f'
  },
  jira: {
    connected: true,
    domain: 'acme-corp.atlassian.net',
    projectKey: 'PAY',
    issueType: 'Bug',
    email: 'orchestrator-bot@acme.corp',
    apiTokenMasked: 'jira_tok_••••••••••••••••221a'
  },
  orchestrationRules: {
    enabled: true,
    autoAssignJira: true,
    autoAssignAzureBoards: true,
    minConfidenceThreshold: 70,
    fallbackTeam: 'Triage Engineering On-Call',
    notifySlack: true
  }
};

export const initialErrorGroups: ErrorGroupModel[] = [
  {
    id: 'grp-node-001',
    organizationId: 'org-acme-prod-01',
    serviceId: 'srv-checkout-node',
    serviceName: 'checkout-service',
    environment: 'production',
    runtime: 'node',
    level: 'error',
    repo: 'acme-corp/checkout-service-node',
    repoBranch: 'main',
    fingerprint: '3b8f10c668b5a1b327b878347fba11b81628d9c0205c083bc701048e7ba4890c',
    exceptionType: 'StripeGatewayTimeoutError',
    message: 'Upstream payment gateway timed out after 30000ms while confirming PaymentIntent',
    status: 'Open',
    occurrenceCount: 142,
    firstSeen: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
    lastSeen: new Date(Date.now() - 1000 * 45).toISOString(),
    assignedTeam: 'Payments Engineering',
    assignedOwner: 'sarah.chen@acme.corp',
    ownershipMatchRule: 'GitBlame: Exact line author (commit 7f9b21a) + 82% method frequency',
    routeTemplate: '/api/v1/payments/process-charge',
    culprit: {
      authorName: 'Sarah Chen',
      authorEmail: 'sarah.chen@acme.corp',
      githubUsername: 'sarah-chen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      commitSha: '7f9b21a',
      commitMessage: 'feat(payments): update Stripe SDK to v14 & set aggressive 30s timeout',
      committedAt: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
      lineChanged: 184,
      filePath: 'src/services/stripeClient.ts',
      methodName: 'executeStripeCharge',
      confidenceScore: 96,
      reason: 'Direct author of line 184 in commit 7f9b21a (3 hours ago). Authored 14 of the last 17 commits to executeStripeCharge().',
      recentMethodCommitsCount: 14,
      totalMethodCommitsCount: 17,
      codeSnippet: [
        { lineNumber: 181, content: '    const idempotencyKey = ctx.correlationId;', isErrorLine: false, author: 'sarah-chen', commitSha: '7f9b21a', commitDate: '3 hours ago' },
        { lineNumber: 182, content: '    const client = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 30000 });', isErrorLine: false, author: 'sarah-chen', commitSha: '7f9b21a', commitDate: '3 hours ago' },
        { lineNumber: 183, content: '    // Trigger payment confirmation intent', isErrorLine: false, author: 'sarah-chen', commitSha: '7f9b21a', commitDate: '3 hours ago' },
        { lineNumber: 184, content: '    const charge = await client.paymentIntents.confirm(intentId, { ...payload });', isErrorLine: true, author: 'sarah-chen', commitSha: '7f9b21a', commitDate: '3 hours ago' },
        { lineNumber: 185, content: '    if (!charge || charge.status !== "succeeded") {', isErrorLine: false, author: 'sarah-chen', commitSha: '7f9b21a', commitDate: '3 hours ago' },
        { lineNumber: 186, content: '      throw new Error(`Charge status unconfirmed: ${charge?.status}`);', isErrorLine: false, author: 'arivera-dev', commitSha: '1a029fe', commitDate: '5 days ago' }
      ]
    },
    jiraTicket: {
      id: 't-jira-901',
      key: 'PAY-1849',
      summary: 'StripeGatewayTimeoutError: Upstream gateway timed out in src/services/stripeClient.ts:184',
      issueType: 'Bug',
      status: 'IN PROGRESS',
      assignee: 'Sarah Chen (Staff Engineer)',
      assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      url: 'https://acme-corp.atlassian.net/browse/PAY-1849',
      projectKey: 'PAY',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    azureBoardsTask: {
      id: 't-ado-901',
      workItemId: 'ADO#98214',
      title: 'Fix StripeGatewayTimeoutError in executeStripeCharge()',
      workItemType: 'Bug',
      state: 'Active',
      assignedTo: 'Sarah Chen',
      assignedToAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      url: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98214',
      areaPath: 'CoreEngineering\\Payments',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    ticketLinks: [
      {
        id: 't-jira-901',
        integrationType: 'Jira',
        externalTicketId: 'PAY-1849',
        externalTicketUrl: 'https://acme-corp.atlassian.net/browse/PAY-1849',
        status: 'IN PROGRESS',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        assignedTo: 'Sarah Chen'
      },
      {
        id: 't-ado-901',
        integrationType: 'AzureDevOps',
        externalTicketId: 'ADO#98214',
        externalTicketUrl: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98214',
        status: 'Active',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        assignedTo: 'Sarah Chen'
      }
    ],
    breadcrumbs: [
      { id: 'b1', type: 'navigation', category: 'router', message: 'POST /api/v1/payments/process-charge received', level: 'info', timestamp: '12:04:18.102' },
      { id: 'b2', type: 'user', category: 'auth', message: 'Bearer token authenticated: user_usr_998124', level: 'info', timestamp: '12:04:18.115' },
      { id: 'b3', type: 'db', category: 'postgres', message: 'SELECT * FROM orders WHERE id = $1', level: 'info', timestamp: '12:04:18.140', data: { latency: '3.2ms', rows: 1 } },
      { id: 'b4', type: 'http', category: 'stripe-api', message: 'POST https://api.stripe.com/v1/payment_intents/pi_9182/confirm', level: 'info', timestamp: '12:04:18.200' },
      { id: 'b5', type: 'log', category: 'network', message: 'TCP socket timeout while waiting for gateway packet after 30000ms', level: 'warning', timestamp: '12:04:48.201' },
      { id: 'b6', type: 'system', category: 'orchestrator', message: 'Auto-orchestrator resolved suspect committer Sarah Chen and assigned JIRA PAY-1849 & ADO#98214', level: 'info', timestamp: '12:04:48.350' }
    ],
    orchestrationLog: [
      { step: 'SDK Capture', timestamp: '12:04:48.205', status: 'success', detail: 'Node.js @uep/node captured unhandled rejection in stripeClient.ts:184' },
      { step: 'Git Blame Engine', timestamp: '12:04:48.245', status: 'success', detail: 'Identified commit 7f9b21a by @sarah-chen (96% culprit confidence)' },
      { step: 'Identity Mapping', timestamp: '12:04:48.260', status: 'success', detail: 'Mapped GitHub @sarah-chen -> Jira Sarah Chen -> Azure Boards Sarah Chen' },
      { step: 'Jira Dispatch', timestamp: '12:04:48.310', status: 'success', detail: 'Created Bug PAY-1849 in project PAY; assigned to Sarah Chen' },
      { step: 'Azure Boards Dispatch', timestamp: '12:04:48.350', status: 'success', detail: 'Created Work Item #98214 in CoreEngineering\\Payments; assigned to Sarah Chen' }
    ],
    occurrences: [
      {
        id: 'occ-001',
        timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
        stackTrace: `StripeGatewayTimeoutError: Upstream payment gateway timed out after 30000ms
    at StripeClient.executeStripeCharge (/app/src/services/stripeClient.ts:184:28)
    at CheckoutService.processPayment (/app/src/services/checkoutService.ts:89:14)
    at PaymentsController.processCharge (/app/src/controllers/paymentsController.ts:42:10)`,
        rawStackTrace: `StripeGatewayTimeoutError: Upstream payment gateway timed out after 30000ms. Header Authorization: Bearer sk_live_99fba24810ac9920194bc0281
    at StripeClient.executeStripeCharge (/app/src/services/stripeClient.ts:184:28)
    at CheckoutService.processPayment (/app/src/services/checkoutService.ts:89:14)
    at PaymentsController.processCharge (/app/src/controllers/paymentsController.ts:42:10)`,
        requestContext: {
          clientIp: '198.51.100.44',
          httpMethod: 'POST',
          route: '/api/v1/payments/process-charge',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer [REDACTED]',
            'X-Correlation-Id': 'corr-9104-aa1'
          },
          body: {
            amount: 14900,
            currency: 'USD',
            cardNumber: '[REDACTED]',
            cvv: '[REDACTED]',
            customerToken: '[REDACTED]'
          }
        },
        version: 'v2.14.0',
        correlationId: 'corr-9104-aa1',
        sourceEventId: 'evt-991204128'
      }
    ]
  },
  {
    id: 'grp-py-002',
    organizationId: 'org-acme-prod-01',
    serviceId: 'srv-billing-py',
    serviceName: 'billing-worker',
    environment: 'production',
    runtime: 'python',
    level: 'error',
    repo: 'acme-corp/billing-worker-py',
    repoBranch: 'main',
    fingerprint: 'a17c490e5512bc900812bcae918234ab10928174625341209384751029384756',
    exceptionType: 'decimal.InvalidOperation',
    message: 'InvalidOperation: Quantize result has too many digits for current decimal context',
    status: 'Open',
    occurrenceCount: 68,
    firstSeen: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    lastSeen: new Date(Date.now() - 1000 * 180).toISOString(),
    assignedTeam: 'Data & Analytics',
    assignedOwner: 'elena.rostova@acme.corp',
    ownershipMatchRule: 'GitBlame: Exact line author (commit e28bc01) + 91% method frequency',
    routeTemplate: 'worker:billing:reconciliation_loop',
    culprit: {
      authorName: 'Elena Rostova',
      authorEmail: 'elena.rostova@acme.corp',
      githubUsername: 'erostova-ml',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      commitSha: 'e28bc01',
      commitMessage: 'fix(tax): adjust sub-cent precision rounding for multi-currency invoices',
      committedAt: new Date(Date.now() - 1000 * 3600 * 16).toISOString(),
      lineChanged: 92,
      filePath: 'billing/tax_engine.py',
      methodName: 'calculate_compound_tax',
      confidenceScore: 94,
      reason: 'Direct author of line 92 in commit e28bc01 (16 hours ago). Most frequent committer to tax_engine.py (21 commits).',
      recentMethodCommitsCount: 19,
      totalMethodCommitsCount: 21,
      codeSnippet: [
        { lineNumber: 89, content: '    rate = Decimal(str(tax_profile.marginal_rate))', isErrorLine: false, author: 'erostova-ml', commitSha: 'e28bc01', commitDate: '16 hours ago' },
        { lineNumber: 90, content: '    ctx = getcontext()', isErrorLine: false, author: 'erostova-ml', commitSha: 'e28bc01', commitDate: '16 hours ago' },
        { lineNumber: 91, content: '    raw_tax = (base_amount * rate) / Decimal("100.0")', isErrorLine: false, author: 'erostova-ml', commitSha: 'e28bc01', commitDate: '16 hours ago' },
        { lineNumber: 92, content: '    return raw_tax.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)', isErrorLine: true, author: 'erostova-ml', commitSha: 'e28bc01', commitDate: '16 hours ago' },
        { lineNumber: 93, content: '  except Exception as err:', isErrorLine: false, author: 'erostova-ml', commitSha: 'e28bc01', commitDate: '16 hours ago' }
      ]
    },
    jiraTicket: {
      id: 't-jira-902',
      key: 'PAY-1850',
      summary: 'decimal.InvalidOperation in tax_engine.py:92',
      issueType: 'Bug',
      status: 'TO DO',
      assignee: 'Elena Rostova (Data Platforms)',
      assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      url: 'https://acme-corp.atlassian.net/browse/PAY-1850',
      projectKey: 'PAY',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    azureBoardsTask: {
      id: 't-ado-902',
      workItemId: 'ADO#98218',
      title: 'Fix decimal precision overflow in calculate_compound_tax()',
      workItemType: 'Bug',
      state: 'New',
      assignedTo: 'Elena Rostova',
      assignedToAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      url: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98218',
      areaPath: 'CoreEngineering\\Billing',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    ticketLinks: [
      {
        id: 't-jira-902',
        integrationType: 'Jira',
        externalTicketId: 'PAY-1850',
        externalTicketUrl: 'https://acme-corp.atlassian.net/browse/PAY-1850',
        status: 'TO DO',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        assignedTo: 'Elena Rostova'
      },
      {
        id: 't-ado-902',
        integrationType: 'AzureDevOps',
        externalTicketId: 'ADO#98218',
        externalTicketUrl: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98218',
        status: 'New',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        assignedTo: 'Elena Rostova'
      }
    ],
    breadcrumbs: [
      { id: 'b21', type: 'system', category: 'celery', message: 'Celery worker consumed task: billing.reconciliation_job', level: 'info', timestamp: '14:20:01.002' },
      { id: 'b22', type: 'db', category: 'postgres', message: 'SELECT invoice_id, amount, tax_code FROM pending_invoices', level: 'info', timestamp: '14:20:01.045' },
      { id: 'b23', type: 'log', category: 'currency', message: 'Processing currency EUR with marginal rate 21.00%', level: 'info', timestamp: '14:20:01.080' },
      { id: 'b24', type: 'system', category: 'orchestrator', message: 'Auto-orchestrator matched Elena Rostova via Git Blame; dispatched tickets', level: 'info', timestamp: '14:20:01.210' }
    ],
    occurrences: [
      {
        id: 'occ-002',
        timestamp: new Date(Date.now() - 1000 * 180).toISOString(),
        stackTrace: `Traceback (most recent call last):
  File "billing/worker.py", line 142, in process_invoice
    tax = calculate_compound_tax(invoice.amount, invoice.tax_profile)
  File "billing/tax_engine.py", line 92, in calculate_compound_tax
    return raw_tax.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
decimal.InvalidOperation: Quantize result has too many digits for current decimal context`,
        requestContext: {
          invoiceId: 'inv_8829141',
          currency: 'EUR',
          amount: '9999999999999999.99'
        },
        version: 'v3.1.2',
        correlationId: 'corr-py-8812'
      }
    ]
  },
  {
    id: 'grp-go-003',
    organizationId: 'org-acme-prod-01',
    serviceId: 'srv-auth-go',
    serviceName: 'auth-gateway',
    environment: 'production',
    runtime: 'go',
    level: 'warning',
    repo: 'acme-corp/auth-gateway-go',
    repoBranch: 'main',
    fingerprint: '6c91a02194bb8120019488a1029384bc19283746554102938475610293847123',
    exceptionType: 'jwt.ErrTokenExpired',
    message: 'Token verification failed: JWT token has expired across clustered cache sync',
    status: 'Investigating',
    occurrenceCount: 382,
    firstSeen: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    lastSeen: new Date(Date.now() - 1000 * 12).toISOString(),
    assignedTeam: 'Identity & Auth Gateway',
    assignedOwner: 'marcus.vance@acme.corp',
    ownershipMatchRule: 'GitBlame: Exact line author (commit 881ba9f) + Security Lead',
    routeTemplate: '/v1/auth/exchange',
    culprit: {
      authorName: 'Marcus Vance',
      authorEmail: 'marcus.vance@acme.corp',
      githubUsername: 'mvance-sec',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      commitSha: '881ba9f',
      commitMessage: 'refactor(jwt): enforce strict zero-skew window in token validator',
      committedAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
      lineChanged: 64,
      filePath: 'internal/jwt/validator.go',
      methodName: 'VerifySessionToken',
      confidenceScore: 98,
      reason: 'Authored commit 881ba9f modifying zero-skew clock constraint on line 64. Authored 95% of internal/jwt/*',
      recentMethodCommitsCount: 16,
      totalMethodCommitsCount: 17,
      codeSnippet: [
        { lineNumber: 61, content: 'func (v *Validator) VerifySessionToken(raw string) (*Claims, error) {', isErrorLine: false, author: 'mvance-sec', commitSha: '881ba9f', commitDate: '24 hours ago' },
        { lineNumber: 62, content: '    parsed, err := jwt.ParseWithClaims(raw, &Claims{}, v.keyFunc)', isErrorLine: false, author: 'mvance-sec', commitSha: '881ba9f', commitDate: '24 hours ago' },
        { lineNumber: 63, content: '    // Strict zero-leeway clock comparison', isErrorLine: false, author: 'mvance-sec', commitSha: '881ba9f', commitDate: '24 hours ago' },
        { lineNumber: 64, content: '    if !parsed.Valid || claims.ExpiresAt.Before(time.Now().UTC()) {', isErrorLine: true, author: 'mvance-sec', commitSha: '881ba9f', commitDate: '24 hours ago' },
        { lineNumber: 65, content: '        return nil, jwt.ErrTokenExpired', isErrorLine: false, author: 'mvance-sec', commitSha: '881ba9f', commitDate: '24 hours ago' },
        { lineNumber: 66, content: '    }', isErrorLine: false, author: 'mvance-sec', commitSha: '881ba9f', commitDate: '24 hours ago' }
      ]
    },
    jiraTicket: {
      id: 't-jira-903',
      key: 'SEC-402',
      summary: 'jwt.ErrTokenExpired: Zero-skew causing premature logout spikes in validator.go:64',
      issueType: 'Task',
      status: 'IN PROGRESS',
      assignee: 'Marcus Vance (Security Lead)',
      assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      url: 'https://acme-corp.atlassian.net/browse/SEC-402',
      projectKey: 'SEC',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    azureBoardsTask: {
      id: 't-ado-903',
      workItemId: 'ADO#98222',
      title: 'Relax JWT zero-skew clock leeway to 15 seconds',
      workItemType: 'Task',
      state: 'Active',
      assignedTo: 'Marcus Vance',
      assignedToAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      url: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98222',
      areaPath: 'CoreEngineering\\Security',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    ticketLinks: [
      {
        id: 't-jira-903',
        integrationType: 'Jira',
        externalTicketId: 'SEC-402',
        externalTicketUrl: 'https://acme-corp.atlassian.net/browse/SEC-402',
        status: 'IN PROGRESS',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        assignedTo: 'Marcus Vance'
      },
      {
        id: 't-ado-903',
        integrationType: 'AzureDevOps',
        externalTicketId: 'ADO#98222',
        externalTicketUrl: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98222',
        status: 'Active',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        assignedTo: 'Marcus Vance'
      }
    ],
    breadcrumbs: [
      { id: 'b31', type: 'http', category: 'gateway', message: 'POST /v1/auth/exchange HTTP/2.0', level: 'info', timestamp: '15:11:02.100' },
      { id: 'b32', type: 'user', category: 'session', message: 'Session ID: sess_99a8182 parsed from Cookie', level: 'info', timestamp: '15:11:02.102' },
      { id: 'b33', type: 'log', category: 'validator', message: 'Comparing token exp: 1727140262 against now: 1727140263 (1s drift)', level: 'warning', timestamp: '15:11:02.103' }
    ],
    occurrences: [
      {
        id: 'occ-003',
        timestamp: new Date(Date.now() - 1000 * 12).toISOString(),
        stackTrace: `jwt.ErrTokenExpired: token is expired by 1s
    at internal/jwt.(*Validator).VerifySessionToken (/app/internal/jwt/validator.go:64)
    at internal/handlers.(*AuthHandler).ExchangeToken (/app/internal/handlers/auth.go:31)
    at net/http.HandlerFunc.ServeHTTP (/usr/local/go/src/net/http/server.go:2084)`,
        requestContext: {
          clientIp: '198.51.100.99',
          userAgent: 'Mozilla/5.0 Chrome/120'
        },
        version: 'v1.18.4',
        correlationId: 'corr-go-9912'
      }
    ]
  },
  {
    id: 'grp-dotnet-004',
    organizationId: 'org-acme-prod-01',
    serviceId: 'srv-order-dotnet',
    serviceName: 'order-service',
    environment: 'production',
    runtime: 'dotnet',
    level: 'error',
    repo: 'acme-corp/order-service-dotnet',
    repoBranch: 'main',
    fingerprint: '9f8e17b20914bc8a102938475610293847561029384756102938475610293847',
    exceptionType: 'Npgsql.NpgsqlException',
    message: 'NpgsqlException: 40P01: deadlock detected between process 49102 and process 49104',
    status: 'Open',
    occurrenceCount: 23,
    firstSeen: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    lastSeen: new Date(Date.now() - 1000 * 90).toISOString(),
    assignedTeam: 'Core Platform & DB',
    assignedOwner: 'alex.rivera@acme.corp',
    ownershipMatchRule: 'GitBlame: Exact line author (commit 44fe901) + DB Lead',
    routeTemplate: '/api/v1/orders/{id}/fulfill',
    culprit: {
      authorName: 'Alex Rivera',
      authorEmail: 'alex.rivera@acme.corp',
      githubUsername: 'arivera-dev',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      commitSha: '44fe901',
      commitMessage: 'perf(fulfillment): parallelize order fulfillment line items update',
      committedAt: new Date(Date.now() - 1000 * 3600 * 7).toISOString(),
      lineChanged: 55,
      filePath: 'src/OrderService/Data/OrderRepository.cs',
      methodName: 'FulfillOrderBatchAsync',
      confidenceScore: 92,
      reason: 'Author of commit 44fe901 modifying transactional isolation lock order on line 55 (7 hours ago).',
      recentMethodCommitsCount: 11,
      totalMethodCommitsCount: 13,
      codeSnippet: [
        { lineNumber: 52, content: '    await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);', isErrorLine: false, author: 'arivera-dev', commitSha: '44fe901', commitDate: '7 hours ago' },
        { lineNumber: 53, content: '    // Lock line items sequentially to prevent out-of-order race conditions', isErrorLine: false, author: 'arivera-dev', commitSha: '44fe901', commitDate: '7 hours ago' },
        { lineNumber: 54, content: '    var items = await _db.OrderItems.Where(x => x.OrderId == id).ToListAsync();', isErrorLine: false, author: 'arivera-dev', commitSha: '44fe901', commitDate: '7 hours ago' },
        { lineNumber: 55, content: '    await _db.Database.ExecuteSqlRawAsync("UPDATE inventory SET stock = stock - 1 WHERE sku = {0}", sku);', isErrorLine: true, author: 'arivera-dev', commitSha: '44fe901', commitDate: '7 hours ago' },
        { lineNumber: 56, content: '    await tx.CommitAsync();', isErrorLine: false, author: 'arivera-dev', commitSha: '44fe901', commitDate: '7 hours ago' }
      ]
    },
    jiraTicket: {
      id: 't-jira-904',
      key: 'PAY-1852',
      summary: 'PostgreSQL 40P01 Deadlock in OrderRepository.cs:55 during batch fulfillment',
      issueType: 'Bug',
      status: 'OPEN',
      assignee: 'Alex Rivera (Senior SRE)',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      url: 'https://acme-corp.atlassian.net/browse/PAY-1852',
      projectKey: 'PAY',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    },
    azureBoardsTask: {
      id: 't-ado-904',
      workItemId: 'ADO#98230',
      title: 'Fix deadlock in inventory decrement during fulfill order batch',
      workItemType: 'Bug',
      state: 'Active',
      assignedTo: 'Alex Rivera',
      assignedToAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      url: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98230',
      areaPath: 'CoreEngineering\\Orders',
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    },
    ticketLinks: [
      {
        id: 't-jira-904',
        integrationType: 'Jira',
        externalTicketId: 'PAY-1852',
        externalTicketUrl: 'https://acme-corp.atlassian.net/browse/PAY-1852',
        status: 'OPEN',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        assignedTo: 'Alex Rivera'
      },
      {
        id: 't-ado-904',
        integrationType: 'AzureDevOps',
        externalTicketId: 'ADO#98230',
        externalTicketUrl: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98230',
        status: 'Active',
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        assignedTo: 'Alex Rivera'
      }
    ],
    breadcrumbs: [
      { id: 'b41', type: 'navigation', category: 'api', message: 'PUT /api/v1/orders/9fa821-441-aa/fulfill', level: 'info', timestamp: '16:04:10.012' },
      { id: 'b42', type: 'db', category: 'postgres', message: 'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE', level: 'info', timestamp: '16:04:10.015' },
      { id: 'b43', type: 'db', category: 'postgres', message: 'ERROR 40P01: deadlock detected between process 49102 and 49104', level: 'error', timestamp: '16:04:10.420' },
      { id: 'b44', type: 'system', category: 'orchestrator', message: 'Auto-orchestration created Jira PAY-1852 & Azure DevOps #98230 assigned to Alex Rivera', level: 'info', timestamp: '16:04:10.550' }
    ],
    occurrences: [
      {
        id: 'occ-004',
        timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
        stackTrace: `Npgsql.NpgsqlException (0x80004005): Exception while connecting to PostgreSQL server: deadlock detected
   at Npgsql.Internal.NpgsqlConnector.DoReadMessage(Boolean async, DataRowLoadingMode dataRowLoadingMode, Boolean readingNotifications) in Connector.cs:line 291
   at OrderService.Data.OrderRepository.FulfillOrderBatchAsync(Guid id) in C:\\apps\\OrderService\\OrderRepository.cs:line 55
   at OrderService.Controllers.OrdersController.Fulfill(Guid id) in C:\\apps\\OrderService\\OrdersController.cs:line 38`,
        requestContext: {
          orderId: '9fa821-441-aa',
          warehouseId: 'wh-east-01',
          isolationLevel: 'Serializable'
        },
        version: 'v2.10.8',
        correlationId: 'corr-net-7712'
      }
    ]
  },
  {
    id: 'grp-react-005',
    organizationId: 'org-acme-prod-01',
    serviceId: 'srv-checkout-web',
    serviceName: 'checkout-web',
    environment: 'production',
    runtime: 'react',
    level: 'error',
    repo: 'acme-corp/checkout-web-react',
    repoBranch: 'main',
    fingerprint: '1092837461029384756102938475610293847561029384756102938475612345',
    exceptionType: 'TypeError',
    message: "TypeError: Cannot read properties of undefined (reading 'split') in address parser",
    status: 'Resolved',
    occurrenceCount: 89,
    firstSeen: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    lastSeen: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    assignedTeam: 'Web & Growth',
    assignedOwner: 'david.kim@acme.corp',
    ownershipMatchRule: 'GitBlame: Exact line author (commit c99104a) + UI Architect',
    routeTemplate: '/checkout/step-2-shipping',
    culprit: {
      authorName: 'David Kim',
      authorEmail: 'david.kim@acme.corp',
      githubUsername: 'dkim-frontend',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      commitSha: 'c99104a',
      commitMessage: 'feat(shipping): parse international postal codes into sub-districts',
      committedAt: new Date(Date.now() - 1000 * 3600 * 70).toISOString(),
      lineChanged: 42,
      filePath: 'src/components/ShippingForm.tsx',
      methodName: 'formatPostalCode',
      confidenceScore: 97,
      reason: 'Author of commit c99104a on line 42. Authored 88% of checkout form UI code.',
      recentMethodCommitsCount: 15,
      totalMethodCommitsCount: 17,
      codeSnippet: [
        { lineNumber: 39, content: '  const formatPostalCode = (rawPostal: string | undefined) => {', isErrorLine: false, author: 'dkim-frontend', commitSha: 'c99104a', commitDate: '3 days ago' },
        { lineNumber: 40, content: '    // Parse country code prefix', isErrorLine: false, author: 'dkim-frontend', commitSha: 'c99104a', commitDate: '3 days ago' },
        { lineNumber: 41, content: '    const clean = rawPostal?.trim();', isErrorLine: false, author: 'dkim-frontend', commitSha: 'c99104a', commitDate: '3 days ago' },
        { lineNumber: 42, content: '    const [prefix, suffix] = clean.split("-"); // Bug: throws if clean is undefined!', isErrorLine: true, author: 'dkim-frontend', commitSha: 'c99104a', commitDate: '3 days ago' },
        { lineNumber: 43, content: '    return `${prefix.toUpperCase()} ${suffix}`;', isErrorLine: false, author: 'dkim-frontend', commitSha: 'c99104a', commitDate: '3 days ago' },
        { lineNumber: 44, content: '  };', isErrorLine: false, author: 'dkim-frontend', commitSha: 'c99104a', commitDate: '3 days ago' }
      ]
    },
    jiraTicket: {
      id: 't-jira-905',
      key: 'WEB-319',
      summary: 'TypeError: Cannot read properties of undefined in ShippingForm.tsx:42',
      issueType: 'Bug',
      status: 'DONE',
      assignee: 'David Kim (Frontend UI)',
      assigneeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      url: 'https://acme-corp.atlassian.net/browse/WEB-319',
      projectKey: 'WEB',
      lastSyncedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
    },
    azureBoardsTask: {
      id: 't-ado-905',
      workItemId: 'ADO#98201',
      title: 'Fix unhandled undefined in ShippingForm postal code splitter',
      workItemType: 'Bug',
      state: 'Resolved',
      assignedTo: 'David Kim',
      assignedToAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      url: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98201',
      areaPath: 'CoreEngineering\\Frontend',
      lastSyncedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
    },
    ticketLinks: [
      {
        id: 't-jira-905',
        integrationType: 'Jira',
        externalTicketId: 'WEB-319',
        externalTicketUrl: 'https://acme-corp.atlassian.net/browse/WEB-319',
        status: 'DONE',
        lastSyncedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
        assignedTo: 'David Kim'
      },
      {
        id: 't-ado-905',
        integrationType: 'AzureDevOps',
        externalTicketId: 'ADO#98201',
        externalTicketUrl: 'https://dev.azure.com/acme-corp-devops/CoreEngineering/_workitems/edit/98201',
        status: 'Resolved',
        lastSyncedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
        assignedTo: 'David Kim'
      }
    ],
    breadcrumbs: [
      { id: 'b51', type: 'user', category: 'ui.click', message: 'User clicked button: [Proceed to Shipping]', level: 'info', timestamp: '11:10:04.220' },
      { id: 'b52', type: 'navigation', category: 'route', message: 'Navigation to /checkout/step-2-shipping', level: 'info', timestamp: '11:10:04.230' },
      { id: 'b53', type: 'user', category: 'form', message: 'User left postal code field empty', level: 'warning', timestamp: '11:10:04.290' },
      { id: 'b54', type: 'system', category: 'orchestrator', message: 'Auto-orchestrator resolved David Kim via GitHub blame; assigned tickets', level: 'info', timestamp: '11:10:04.340' }
    ],
    occurrences: [
      {
        id: 'occ-005',
        timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
        stackTrace: `TypeError: Cannot read properties of undefined (reading 'split')
    at formatPostalCode (https://app.acme.corp/assets/ShippingForm-c819a.js:42:18)
    at handleShippingSubmit (https://app.acme.corp/assets/ShippingForm-c819a.js:89:12)
    at HTMLButtonElement.dispatch (https://app.acme.corp/assets/vendor-9912a.js:14:81)`,
        requestContext: {
          userAgent: 'Mozilla/5.0 Safari/605.1.15',
          viewport: '390x844'
        },
        version: 'v4.1.0',
        correlationId: 'corr-react-9912'
      }
    ]
  }
];
