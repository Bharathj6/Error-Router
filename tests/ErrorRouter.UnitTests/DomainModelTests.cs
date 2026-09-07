using ErrorRouter.Domain.Entities;
using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.UnitTests;

public class DomainModelTests
{
    [Fact]
    public void Fingerprint_Should_Trim_And_Require_Valid_Characters()
    {
        var fingerprint = Fingerprint.Create("  abc123  ");

        Assert.Equal("abc123", fingerprint.Value);
        Assert.Equal(6, fingerprint.Value.Length);

        var exception = Assert.Throws<ArgumentException>(() => Fingerprint.Create("invalid!"));
        Assert.Contains("hex", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SourceEventKey_Should_Reject_Empty_Values()
    {
        Assert.Throws<ArgumentException>(() => SourceEventKey.Create(string.Empty));
        Assert.Throws<ArgumentException>(() => SourceEventKey.Create("   "));
    }

    [Fact]
    public void ErrorOccurrence_Should_Track_Count_And_Require_Valid_Tenant()
    {
        var organizationId = Guid.NewGuid();
        var tenantScope = TenantScope.Create(organizationId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var occurrence = ErrorOccurrence.Create(
            organizationId: organizationId,
            sourceEventId: "evt-123",
            fingerprint: Fingerprint.Create("a1b2c3"),
            serviceName: "payments",
            environmentName: "prod",
            message: "Something failed",
            payload: "{\"status\":500}",
            occurredAtUtc: DateTime.UtcNow,
            tenantScope: tenantScope);

        Assert.Equal(1, occurrence.Count);
        Assert.Equal("payments", occurrence.ServiceName);

        Assert.Throws<ArgumentException>(() => ErrorOccurrence.Create(
            organizationId: Guid.Empty,
            sourceEventId: "evt-456",
            fingerprint: Fingerprint.Create("abcdef"),
            serviceName: "payments",
            environmentName: "prod",
            message: "Something failed",
            payload: "{\"status\":500}",
            occurredAtUtc: DateTime.UtcNow,
            tenantScope: tenantScope));
    }

    [Fact]
    public void TicketLink_Should_Create_Valid_Link_And_Expose_Status()
    {
        var organizationId = Guid.NewGuid();
        var tenantScope = TenantScope.Create(organizationId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var link = TicketLink.Create(
            organizationId: organizationId,
            errorGroupId: Guid.NewGuid(),
            integrationId: Guid.NewGuid(),
            externalTicketKey: "ABC-123",
            externalUrl: "https://example.com/tickets/ABC-123",
            providerType: TicketProviderType.Jira,
            createdAtUtc: DateTime.UtcNow,
            tenantScope: tenantScope);

        Assert.Equal("ABC-123", link.ExternalTicketKey);
        Assert.Equal(TicketLinkStatus.Open, link.Status);
        Assert.Equal("Open", TicketLinkStatus.Open.ToString());
    }

    [Fact]
    public void OutboxJob_Should_Lease_And_Compute_Retry_At()
    {
        var organizationId = Guid.NewGuid();
        var tenantScope = TenantScope.Create(organizationId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var job = OutboxJob.Create(
            organizationId: organizationId,
            jobType: JobType.RouteError,
            payload: "{\"route\":true}",
            scheduledAtUtc: DateTime.UtcNow,
            tenantScope: tenantScope);

        var leased = job.Lease(leaseUntilUtc: DateTime.UtcNow.AddMinutes(5), workerId: "worker-1");

        Assert.True(leased);
        Assert.Equal(JobStatus.InProgress, job.Status);
        Assert.Equal("worker-1", job.LeaseWorkerId);

        var retryAt = job.ScheduleRetry(3, DateTime.UtcNow);
        Assert.True(retryAt > DateTime.UtcNow);
    }
}
