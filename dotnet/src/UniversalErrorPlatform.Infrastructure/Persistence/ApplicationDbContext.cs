namespace UniversalErrorPlatform.Infrastructure.Persistence;

using Microsoft.EntityFrameworkCore;
using UniversalErrorPlatform.Domain.Entities;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ErrorGroup> ErrorGroups => Set<ErrorGroup>();
    public DbSet<ErrorOccurrence> ErrorOccurrences => Set<ErrorOccurrence>();
    public DbSet<TicketingIntegration> TicketingIntegrations => Set<TicketingIntegration>();
    public DbSet<TicketLink> TicketLinks => Set<TicketLink>();
    public DbSet<DeadLetterEvent> DeadLetterEvents => Set<DeadLetterEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Organization Configuration
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.ToTable("organizations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
        });

        // 2. Service Configuration
        modelBuilder.Entity<Service>(entity =>
        {
            entity.ToTable("services");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Environment).HasMaxLength(50).HasDefaultValue("production").IsRequired();
            entity.Property(e => e.RepositoryUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Services)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.OrganizationId, e.Name, e.Environment })
                  .IsUnique()
                  .HasDatabaseName("uq_service_org_env_name");
        });

        // 3. ErrorGroup Configuration (PRD Section 4)
        modelBuilder.Entity<ErrorGroup>(entity =>
        {
            entity.ToTable("error_groups");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");

            // Fingerprint must be exact CHAR(64)
            entity.Property(e => e.Fingerprint).HasColumnType("char(64)").IsRequired();
            entity.Property(e => e.ExceptionType).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Open").IsRequired();
            entity.Property(e => e.OccurrenceCount).HasDefaultValue(1).IsRequired();
            entity.Property(e => e.FirstSeen).HasDefaultValueSql("NOW()").IsRequired();
            entity.Property(e => e.LastSeen).HasDefaultValueSql("NOW()").IsRequired();
            entity.Property(e => e.AssignedTeam).HasMaxLength(100);
            entity.Property(e => e.AssignedOwner).HasMaxLength(100);
            entity.Property(e => e.OwnershipMatchRule).HasMaxLength(200);

            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.ErrorGroups)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Service)
                  .WithMany(s => s.ErrorGroups)
                  .HasForeignKey(e => e.ServiceId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Composite constraint: uq_org_fingerprint (PRD Section 4)
            entity.HasIndex(e => new { e.OrganizationId, e.Fingerprint })
                  .IsUnique()
                  .HasDatabaseName("uq_org_fingerprint");

            // Indices for fast retrieval (PRD Section 4 & FR-05)
            entity.HasIndex(e => e.Status).HasDatabaseName("idx_error_groups_status");
            entity.HasIndex(e => e.LastSeen).HasDatabaseName("idx_error_groups_last_seen");
        });

        // 4. ErrorOccurrence Configuration (PRD Section 4)
        modelBuilder.Entity<ErrorOccurrence>(entity =>
        {
            entity.ToTable("error_occurrences");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Timestamp).HasDefaultValueSql("NOW()").IsRequired();
            entity.Property(e => e.StackTrace).IsRequired();

            // PostgreSQL JSONB column mapping for request_context (PRD Section 4)
            entity.Property(e => e.RequestContext)
                  .HasColumnType("jsonb");

            entity.Property(e => e.Version).HasMaxLength(100);
            entity.Property(e => e.CorrelationId).HasMaxLength(255);
            entity.Property(e => e.SourceEventId).HasMaxLength(255);

            entity.HasOne(e => e.ErrorGroup)
                  .WithMany(g => g.Occurrences)
                  .HasForeignKey(e => e.ErrorGroupId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.ErrorGroupId, e.Timestamp })
                  .HasDatabaseName("idx_error_occurrences_group_time");
        });

        // 5. TicketingIntegration Configuration
        modelBuilder.Entity<TicketingIntegration>(entity =>
        {
            entity.ToTable("ticketing_integrations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ProviderType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ConfigJson).HasColumnType("jsonb").HasDefaultValue("{}");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Integrations)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 6. TicketLink Configuration (PRD Section 4)
        modelBuilder.Entity<TicketLink>(entity =>
        {
            entity.ToTable("ticket_links");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ExternalTicketId).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastSyncedAt).HasDefaultValueSql("NOW()").IsRequired();
            entity.Property(e => e.ExternalTicketUrl).HasMaxLength(500);

            entity.HasOne(e => e.ErrorGroup)
                  .WithMany(g => g.TicketLinks)
                  .HasForeignKey(e => e.ErrorGroupId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Integration)
                  .WithMany(i => i.TicketLinks)
                  .HasForeignKey(e => e.IntegrationId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Composite constraint: uq_error_group_integration (PRD Section 4)
            entity.HasIndex(e => new { e.ErrorGroupId, e.IntegrationId })
                  .IsUnique()
                  .HasDatabaseName("uq_error_group_integration");
        });

        // 7. DeadLetterEvent Configuration (FR-08)
        modelBuilder.Entity<DeadLetterEvent>(entity =>
        {
            entity.ToTable("dead_letter_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.PayloadJson).HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.FailureReason).IsRequired();
            entity.Property(e => e.RetryCount).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
        });
    }
}
