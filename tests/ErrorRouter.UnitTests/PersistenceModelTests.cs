using ErrorRouter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ErrorRouter.UnitTests;

public class PersistenceModelTests
{
    [Fact]
    public void Model_Should_Use_Postgres_Types_And_Named_Unique_Indexes()
    {
        var options = new DbContextOptionsBuilder<ErrorRouterDbContext>()
            .UseNpgsql("Host=localhost;Database=errorrouter;Username=test;Password=test")
            .Options;

        using var context = new ErrorRouterDbContext(options, Guid.NewGuid());

        var occurrence = context.Model.FindEntityType(typeof(ErrorRouter.Domain.Entities.ErrorOccurrence))!;
        var payload = occurrence.FindProperty(nameof(ErrorRouter.Domain.Entities.ErrorOccurrence.Payload))!;
        Assert.Equal("jsonb", payload.GetColumnType());

        var groups = context.Model.FindEntityType(typeof(ErrorRouter.Domain.Entities.ErrorGroup))!;
        var fingerprint = groups.FindProperty(nameof(ErrorRouter.Domain.Entities.ErrorGroup.Fingerprint))!;
        Assert.Equal("char(64)", fingerprint.GetColumnType());
        Assert.Contains(groups.GetIndexes(), index => index.IsUnique && index.GetDatabaseName() == "ux_error_groups_organization_fingerprint");

        var sourceClaims = context.Model.FindEntityType(typeof(ErrorRouter.Domain.Entities.SourceEventClaim))!;
        Assert.Contains(sourceClaims.GetIndexes(), index => index.IsUnique && index.GetDatabaseName() == "ux_source_event_claims_organization_event");
    }

    [Fact]
    public void TenantQueryGuard_Should_Reject_Mismatched_Context()
    {
        var options = new DbContextOptionsBuilder<ErrorRouterDbContext>()
            .UseNpgsql("Host=localhost;Database=errorrouter;Username=test;Password=test")
            .Options;

        using var context = new ErrorRouterDbContext(options, Guid.NewGuid());
        var scope = ErrorRouter.Domain.ValueObjects.TenantScope.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        Assert.Throws<InvalidOperationException>(() => TenantQueryGuard.RequireContextOrganization(context, scope.OrganizationId));
    }
}