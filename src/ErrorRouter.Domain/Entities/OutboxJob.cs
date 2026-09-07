using ErrorRouter.Domain.Enums;

namespace ErrorRouter.Domain.Entities;

using ErrorRouter.Domain.ValueObjects;

public sealed class OutboxJob
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public JobType JobType { get; private set; }
    public string Payload { get; private set; } = string.Empty;
    public JobStatus Status { get; private set; }
    public DateTime ScheduledAtUtc { get; private set; }
    public DateTime? LeaseUntilUtc { get; private set; }
    public string? LeaseWorkerId { get; private set; }
    public int AttemptCount { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? SucceededAtUtc { get; private set; }
    public DateTime? LastErrorAtUtc { get; private set; }
    public string? LastError { get; private set; }

    private OutboxJob()
    {
    }

    public static OutboxJob Create(Guid organizationId, JobType jobType, string payload, DateTime scheduledAtUtc, TenantScope tenantScope)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (string.IsNullOrWhiteSpace(payload))
        {
            throw new ArgumentException("Job payload is required.", nameof(payload));
        }

        if (tenantScope.OrganizationId != organizationId)
        {
            throw new ArgumentException("Tenant scope does not match the organization.", nameof(tenantScope));
        }

        return new OutboxJob
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            JobType = jobType,
            Payload = payload.Trim(),
            Status = JobStatus.Pending,
            ScheduledAtUtc = scheduledAtUtc,
            LeaseUntilUtc = null,
            LeaseWorkerId = null,
            AttemptCount = 0,
            CreatedAtUtc = DateTime.UtcNow,
            SucceededAtUtc = null,
            LastErrorAtUtc = null,
            LastError = null
        };
    }

    public bool Lease(DateTime leaseUntilUtc, string workerId)
    {
        if (Status is JobStatus.Succeeded or JobStatus.DeadLettered or JobStatus.InProgress)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(workerId))
        {
            throw new ArgumentException("Worker ID is required.", nameof(workerId));
        }

        Status = JobStatus.InProgress;
        LeaseUntilUtc = leaseUntilUtc;
        LeaseWorkerId = workerId;
        AttemptCount += 1;
        return true;
    }

    public void MarkSucceeded(DateTime succeededAtUtc)
    {
        if (Status != JobStatus.InProgress)
        {
            throw new InvalidOperationException("Only an in-progress job can succeed.");
        }

        Status = JobStatus.Succeeded;
        SucceededAtUtc = succeededAtUtc;
        LeaseUntilUtc = null;
        LeaseWorkerId = null;
    }

    public void MarkFailed(string error, DateTime failedAtUtc)
    {
        if (Status != JobStatus.InProgress)
        {
            throw new InvalidOperationException("Only an in-progress job can fail.");
        }

        if (string.IsNullOrWhiteSpace(error))
        {
            throw new ArgumentException("Job error is required.", nameof(error));
        }

        Status = JobStatus.Failed;
        LastError = error.Trim();
        LastErrorAtUtc = failedAtUtc;
        LeaseUntilUtc = null;
        LeaseWorkerId = null;
    }

    public DateTime ScheduleRetry(int attemptNumber, DateTime now)
    {
        if (attemptNumber < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(attemptNumber));
        }

        var backoffMinutes = Math.Min(60, (int)Math.Pow(2, attemptNumber));
        var retryAt = now.AddMinutes(backoffMinutes);
        Status = JobStatus.Pending;
        ScheduledAtUtc = retryAt;
        LeaseUntilUtc = null;
        LeaseWorkerId = null;
        return retryAt;
    }

    public void MoveToDeadLetter(string error, DateTime failedAtUtc)
    {
        if (string.IsNullOrWhiteSpace(error))
        {
            throw new ArgumentException("Job error is required.", nameof(error));
        }

        Status = JobStatus.DeadLettered;
        LastError = error.Trim();
        LastErrorAtUtc = failedAtUtc;
        LeaseUntilUtc = null;
        LeaseWorkerId = null;
    }
}
