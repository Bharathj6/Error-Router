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
        var errorGroupId = Guid.NewGuid();

        var occurrence = ErrorOccurrence.Create(
            organizationId: organizationId,
            errorGroupId: errorGroupId,
            sourceEventId: "evt-123",
            fingerprint: Fingerprint.Create("a1b2c3"),
            serviceName: "payments",
            environmentName: "prod",
            message: "Something failed",
            payload: "{\"status\":500}",
            occurredAtUtc: DateTime.UtcNow,
            tenantScope: tenantScope);

        Assert.Equal(1, occurrence.Count);
        Assert.Equal(errorGroupId, occurrence.ErrorGroupId);
        Assert.Equal("payments", occurrence.ServiceName);

        Assert.Throws<ArgumentException>(() => ErrorOccurrence.Create(
            organizationId: Guid.Empty,
            errorGroupId: errorGroupId,
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
    public void TenantAggregates_Should_Keep_Organization_Scope()
    {
        var organizationId = Guid.NewGuid();
        var tenantScope = TenantScope.Create(organizationId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var team = Team.Create(Guid.NewGuid(), organizationId, "Payments", "payments", tenantScope);
        var credential = ApiCredential.Create(Guid.NewGuid(), organizationId, "ingestion", "er_live", "hash", tenantScope);
        var integration = TicketingIntegration.Create(Guid.NewGuid(), organizationId, "Jira", TicketProviderType.Jira, "encrypted", tenantScope);

        Assert.Equal(organizationId, team.OrganizationId);
        Assert.Equal(ApiCredentialStatus.Active, credential.Status);
        Assert.Equal(IntegrationStatus.Active, integration.Status);
        Assert.Throws<ArgumentException>(() => Team.Create(Guid.NewGuid(), Guid.NewGuid(), "Payments", null, tenantScope));
    }

    [Fact]
    public void Decisions_Should_Expose_Explainable_Result()
    {
        var ruleId = Guid.NewGuid();
        var teamId = Guid.NewGuid();
        var integrationId = Guid.NewGuid();

        var ownership = OwnershipDecision.Assigned(teamId, ruleId, "matched service rule");
        var routing = RoutingDecision.Routed(integrationId, "matched production binding");

        Assert.Equal(teamId, ownership.TeamId);
        Assert.Equal(ruleId, ownership.RuleId);
        Assert.Equal(integrationId, routing.IntegrationId);
        Assert.Equal("matched production binding", routing.Reason);
    }

    [Fact]
    public void OutboxJob_Should_Reject_Invalid_State_Transitions()
    {
        var organizationId = Guid.NewGuid();
        var tenantScope = TenantScope.Create(organizationId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var job = OutboxJob.Create(organizationId, JobType.RouteError, "{}", DateTime.UtcNow, tenantScope);

        Assert.Throws<InvalidOperationException>(() => job.MarkSucceeded(DateTime.UtcNow));
        Assert.True(job.Lease(DateTime.UtcNow.AddMinutes(5), "worker-1"));
        job.MarkSucceeded(DateTime.UtcNow);
        Assert.False(job.Lease(DateTime.UtcNow.AddMinutes(5), "worker-2"));
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
