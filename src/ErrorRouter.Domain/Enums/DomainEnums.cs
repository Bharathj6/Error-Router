namespace ErrorRouter.Domain.Enums;

public enum TicketProviderType
{
    Jira = 1,
    AzureDevOps = 2
}

public enum JobType
{
    RouteError = 1,
    CreateTicket = 2,
    ReconcileTicket = 3,
    RetryTicket = 4
}

public enum JobStatus
{
    Pending = 1,
    InProgress = 2,
    Succeeded = 3,
    Failed = 4,
    DeadLettered = 5
}

public enum TicketLinkStatus
{
    Open = 1,
    Resolved = 2,
    Closed = 3,
    Failed = 4
}
