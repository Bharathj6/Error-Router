using System.Linq.Expressions;
using ErrorRouter.Domain.Entities;
using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DomainApplication = ErrorRouter.Domain.Entities.Application;

namespace ErrorRouter.Infrastructure.Persistence;

public sealed class ErrorRouterDbContext : DbContext
{
    public ErrorRouterDbContext(DbContextOptions<ErrorRouterDbContext> options)
        : this(options, null)
    {
    }

    public ErrorRouterDbContext(DbContextOptions<ErrorRouterDbContext> options, Guid? tenantOrganizationId)
        : base(options)
    {
        TenantOrganizationId = tenantOrganizationId;
    }

    public Guid? TenantOrganizationId { get; }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<DomainApplication> Applications => Set<DomainApplication>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Domain.Entities.Environment> Environments => Set<Domain.Entities.Environment>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<ApiCredential> ApiCredentials => Set<ApiCredential>();
    public DbSet<TicketingIntegration> TicketingIntegrations => Set<TicketingIntegration>();
    public DbSet<IntegrationBinding> IntegrationBindings => Set<IntegrationBinding>();
    public DbSet<OwnershipRule> OwnershipRules => Set<OwnershipRule>();
    public DbSet<ErrorGroup> ErrorGroups => Set<ErrorGroup>();
    public DbSet<ErrorOccurrence> ErrorOccurrences => Set<ErrorOccurrence>();
    public DbSet<SourceEventClaim> SourceEventClaims => Set<SourceEventClaim>();
    public DbSet<TicketLink> TicketLinks => Set<TicketLink>();
    public DbSet<OutboxJob> Jobs => Set<OutboxJob>();
    public DbSet<DeadLetter> DeadLetters => Set<DeadLetter>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureOrganization(modelBuilder.Entity<Organization>());
        ConfigureApplication(modelBuilder.Entity<DomainApplication>());
        ConfigureService(modelBuilder.Entity<Service>());
        ConfigureEnvironment(modelBuilder.Entity<Domain.Entities.Environment>());
        ConfigureTeam(modelBuilder.Entity<Team>());
        ConfigureCredential(modelBuilder.Entity<ApiCredential>());
        ConfigureIntegration(modelBuilder.Entity<TicketingIntegration>());
        ConfigureBinding(modelBuilder.Entity<IntegrationBinding>());
        ConfigureOwnershipRule(modelBuilder.Entity<OwnershipRule>());
        ConfigureErrorGroup(modelBuilder.Entity<ErrorGroup>());
        ConfigureOccurrence(modelBuilder.Entity<ErrorOccurrence>());
        ConfigureSourceEventClaim(modelBuilder.Entity<SourceEventClaim>());
        ConfigureTicketLink(modelBuilder.Entity<TicketLink>());
        ConfigureJob(modelBuilder.Entity<OutboxJob>());
        ConfigureDeadLetter(modelBuilder.Entity<DeadLetter>());
        ConfigureAuditEvent(modelBuilder.Entity<AuditEvent>());

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private void ConfigureOrganization(EntityTypeBuilder<Organization> entity)
    {
        entity.ToTable("organizations");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.Slug).HasMaxLength(100);
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.UpdatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("ux_organizations_slug");
        entity.HasQueryFilter(x => TenantOrganizationId != null && x.Id == TenantOrganizationId);
    }

    private void ConfigureApplication(EntityTypeBuilder<DomainApplication> entity)
    {
        entity.ToTable("applications");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique().HasDatabaseName("ux_applications_organization_name");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureService(EntityTypeBuilder<Service> entity)
    {
        entity.ToTable("services");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.ApplicationId, x.Name }).IsUnique().HasDatabaseName("ux_services_application_name");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureEnvironment(EntityTypeBuilder<Domain.Entities.Environment> entity)
    {
        entity.ToTable("environments");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.ApplicationId, x.Name }).IsUnique().HasDatabaseName("ux_environments_application_name");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureTeam(EntityTypeBuilder<Team> entity)
    {
        entity.ToTable("teams");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.Slug).HasMaxLength(100);
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique().HasDatabaseName("ux_teams_organization_name");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureCredential(EntityTypeBuilder<ApiCredential> entity)
    {
        entity.ToTable("api_credentials");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.ApplicationId).IsRequired();
        entity.Property(x => x.ServiceId).IsRequired();
        entity.Property(x => x.EnvironmentId).IsRequired();
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.KeyPrefix).HasMaxLength(32).IsRequired();
        entity.Property(x => x.KeyHash).HasMaxLength(256).IsRequired();
        entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.RevokedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.KeyPrefix }).IsUnique().HasDatabaseName("ux_api_credentials_prefix");
        entity.HasIndex(x => new { x.KeyPrefix, x.Status }).HasDatabaseName("ix_api_credentials_prefix_status");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<DomainApplication>().WithMany().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Service>().WithMany().HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Domain.Entities.Environment>().WithMany().HasForeignKey(x => x.EnvironmentId).OnDelete(DeleteBehavior.Restrict);
    }

    private void ConfigureIntegration(EntityTypeBuilder<TicketingIntegration> entity)
    {
        entity.ToTable("ticketing_integrations");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.ProviderType).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.EncryptedCredentials).HasMaxLength(8192).IsRequired();
        entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique().HasDatabaseName("ux_integrations_organization_name");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureBinding(EntityTypeBuilder<IntegrationBinding> entity)
    {
        entity.ToTable("integration_bindings");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.IntegrationId, x.ApplicationId, x.ServiceId, x.EnvironmentId }).IsUnique().HasDatabaseName("ux_integration_bindings_scope");
        entity.HasIndex(x => new { x.OrganizationId, x.Priority }).HasDatabaseName("ix_integration_bindings_priority");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<TicketingIntegration>().WithMany().HasForeignKey(x => x.IntegrationId).OnDelete(DeleteBehavior.Restrict);
    }

    private void ConfigureOwnershipRule(EntityTypeBuilder<OwnershipRule> entity)
    {
        entity.ToTable("ownership_rules");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
        entity.Property(x => x.Predicate).HasColumnType("jsonb").IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.Priority }).HasDatabaseName("ix_ownership_rules_priority");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureErrorGroup(EntityTypeBuilder<ErrorGroup> entity)
    {
        entity.ToTable("error_groups");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.Fingerprint).HasColumnType("char(64)").IsRequired();
        entity.Property(x => x.Title).HasMaxLength(500).IsRequired();
        entity.Property(x => x.Message).HasMaxLength(4000).IsRequired();
        entity.Property(x => x.FirstSeenAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.LastSeenAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.UpdatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.Fingerprint }).IsUnique().HasDatabaseName("ux_error_groups_organization_fingerprint");
        entity.HasIndex(x => new { x.OrganizationId, x.LastSeenAtUtc }).HasDatabaseName("ix_error_groups_tenant_last_seen");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureOccurrence(EntityTypeBuilder<ErrorOccurrence> entity)
    {
        entity.ToTable("error_occurrences");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.SourceEventId).HasMaxLength(256).IsRequired();
        entity.Property(x => x.Fingerprint).HasColumnType("char(64)").IsRequired();
        entity.Property(x => x.ServiceName).HasMaxLength(200).IsRequired();
        entity.Property(x => x.EnvironmentName).HasMaxLength(100).IsRequired();
        entity.Property(x => x.Message).HasMaxLength(4000).IsRequired();
        entity.Property(x => x.Payload).HasColumnType("jsonb").IsRequired();
        entity.Property(x => x.OccurredAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.SourceEventId }).HasDatabaseName("ix_error_occurrences_source_event");
        entity.HasIndex(x => new { x.OrganizationId, x.ErrorGroupId, x.OccurredAtUtc }).HasDatabaseName("ix_error_occurrences_group_time");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<ErrorGroup>().WithMany().HasForeignKey(x => x.ErrorGroupId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureSourceEventClaim(EntityTypeBuilder<SourceEventClaim> entity)
    {
        entity.ToTable("source_event_claims");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.SourceEvent).HasConversion(x => x.Value, x => SourceEventKey.Create(x)).HasMaxLength(256).IsRequired();
        entity.Property(x => x.ClaimedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.SourceEvent }).IsUnique().HasDatabaseName("ux_source_event_claims_organization_event");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureTicketLink(EntityTypeBuilder<TicketLink> entity)
    {
        entity.ToTable("ticket_links");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.ExternalTicketKey).HasMaxLength(256).IsRequired();
        entity.Property(x => x.ExternalUrl).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.ProviderType).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.ResolvedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.ErrorGroupId, x.IntegrationId }).IsUnique().HasDatabaseName("ux_ticket_links_group_integration");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<ErrorGroup>().WithMany().HasForeignKey(x => x.ErrorGroupId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<TicketingIntegration>().WithMany().HasForeignKey(x => x.IntegrationId).OnDelete(DeleteBehavior.Restrict);
    }

    private void ConfigureJob(EntityTypeBuilder<OutboxJob> entity)
    {
        entity.ToTable("jobs");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.JobType).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.Payload).HasColumnType("jsonb").IsRequired();
        entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(x => x.ScheduledAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.LeaseUntilUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.SucceededAtUtc).HasColumnType("timestamp with time zone");
        entity.Property(x => x.LastErrorAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.Status, x.ScheduledAtUtc }).HasDatabaseName("ix_jobs_status_next");
        entity.HasIndex(x => new { x.OrganizationId, x.Status, x.ScheduledAtUtc }).HasDatabaseName("ix_jobs_tenant_status_next");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureDeadLetter(EntityTypeBuilder<DeadLetter> entity)
    {
        entity.ToTable("dead_letters");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.JobType).HasMaxLength(32).IsRequired();
        entity.Property(x => x.Payload).HasColumnType("jsonb").IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.CreatedAtUtc }).HasDatabaseName("ix_dead_letters_tenant_time");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureAuditEvent(EntityTypeBuilder<AuditEvent> entity)
    {
        entity.ToTable("audit_events");
        entity.HasKey(x => x.Id);
        ConfigureTenantEntity(entity, x => x.OrganizationId);
        entity.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        entity.Property(x => x.EntityId).HasMaxLength(256).IsRequired();
        entity.Property(x => x.EventType).HasMaxLength(100).IsRequired();
        entity.Property(x => x.Summary).HasMaxLength(2000).IsRequired();
        entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
        entity.HasIndex(x => new { x.OrganizationId, x.CreatedAtUtc }).HasDatabaseName("ix_audit_events_tenant_time");
        entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureTenantEntity<TEntity>(EntityTypeBuilder<TEntity> entity, Expression<Func<TEntity, Guid>> organizationSelector)
        where TEntity : class
    {
        entity.Property(organizationSelector).IsRequired();
    }

    private static string ToSnakeCase(string value)
    {
        var result = new System.Text.StringBuilder(value.Length + 8);
        for (var index = 0; index < value.Length; index++)
        {
            if (index > 0 && char.IsUpper(value[index]))
            {
                result.Append('_');
            }

            result.Append(char.ToLowerInvariant(value[index]));
        }

        return result.ToString();
    }
}