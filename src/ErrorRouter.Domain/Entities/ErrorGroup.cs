using ErrorRouter.Domain.Enums;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Domain.Entities;

public sealed class ErrorGroup
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Fingerprint { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public int OccurrenceCount { get; private set; }
    public DateTime FirstSeenAtUtc { get; private set; }
    public DateTime LastSeenAtUtc { get; private set; }
    public int Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    private ErrorGroup()
    {
    }

    public static ErrorGroup Create(Guid organizationId, Fingerprint fingerprint, string title, string message, TenantScope tenantScope)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (tenantScope.OrganizationId != organizationId)
        {
            throw new ArgumentException("Tenant scope does not match the organization.", nameof(tenantScope));
        }

        var now = DateTime.UtcNow;

        return new ErrorGroup
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Fingerprint = fingerprint.Value,
            Title = string.IsNullOrWhiteSpace(title) ? "Untitled error" : title.Trim(),
            Message = message.Trim(),
            OccurrenceCount = 0,
            FirstSeenAtUtc = now,
            LastSeenAtUtc = now,
            Status = 1,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
    }

    public void RegisterOccurrence()
    {
        OccurrenceCount += 1;
        LastSeenAtUtc = DateTime.UtcNow;
        if (FirstSeenAtUtc == default)
        {
            FirstSeenAtUtc = LastSeenAtUtc;
        }

        UpdatedAtUtc = DateTime.UtcNow;
    }
}

public sealed class ErrorOccurrence
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ErrorGroupId { get; private set; }
    public string SourceEventId { get; private set; } = string.Empty;
    public string Fingerprint { get; private set; } = string.Empty;
    public string ServiceName { get; private set; } = string.Empty;
    public string EnvironmentName { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public DateTime OccurredAtUtc { get; private set; }
    public int Count { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private ErrorOccurrence()
    {
    }

    public static ErrorOccurrence Create(
        Guid organizationId,
        Guid errorGroupId,
        string sourceEventId,
        Fingerprint fingerprint,
        string serviceName,
        string environmentName,
        string message,
        string payload,
        DateTime occurredAtUtc,
        TenantScope tenantScope)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (string.IsNullOrWhiteSpace(sourceEventId))
        {
            throw new ArgumentException("Source event ID is required.", nameof(sourceEventId));
        }

        if (errorGroupId == Guid.Empty)
        {
            throw new ArgumentException("Error group ID is required.", nameof(errorGroupId));
        }

        if (tenantScope.OrganizationId != organizationId)
        {
            throw new ArgumentException("Tenant scope does not match the organization.", nameof(tenantScope));
        }

        if (string.IsNullOrWhiteSpace(serviceName))
        {
            throw new ArgumentException("Service name is required.", nameof(serviceName));
        }

        if (string.IsNullOrWhiteSpace(environmentName))
        {
            throw new ArgumentException("Environment name is required.", nameof(environmentName));
        }

        return new ErrorOccurrence
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            ErrorGroupId = errorGroupId,
            SourceEventId = sourceEventId.Trim(),
            Fingerprint = fingerprint.Value,
            ServiceName = serviceName.Trim(),
            EnvironmentName = environmentName.Trim(),
            Message = message.Trim(),
            Payload = payload,
            OccurredAtUtc = occurredAtUtc,
            Count = 1,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}

public sealed class TicketLink
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid ErrorGroupId { get; private set; }
    public Guid IntegrationId { get; private set; }
    public string ExternalTicketKey { get; private set; } = string.Empty;
    public string ExternalUrl { get; private set; } = string.Empty;
    public TicketProviderType ProviderType { get; private set; }
    public TicketLinkStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? ResolvedAtUtc { get; private set; }

    private TicketLink()
    {
    }

    public static TicketLink Create(
        Guid organizationId,
        Guid errorGroupId,
        Guid integrationId,
        string externalTicketKey,
        string externalUrl,
        TicketProviderType providerType,
        DateTime createdAtUtc,
        TenantScope tenantScope)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (errorGroupId == Guid.Empty)
        {
            throw new ArgumentException("Error group ID is required.", nameof(errorGroupId));
        }

        if (integrationId == Guid.Empty)
        {
            throw new ArgumentException("Integration ID is required.", nameof(integrationId));
        }

        if (tenantScope.OrganizationId != organizationId)
        {
            throw new ArgumentException("Tenant scope does not match the organization.", nameof(tenantScope));
        }

        if (string.IsNullOrWhiteSpace(externalTicketKey))
        {
            throw new ArgumentException("External ticket key is required.", nameof(externalTicketKey));
        }

        if (string.IsNullOrWhiteSpace(externalUrl))
        {
            throw new ArgumentException("External ticket URL is required.", nameof(externalUrl));
        }

        return new TicketLink
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            ErrorGroupId = errorGroupId,
            IntegrationId = integrationId,
            ExternalTicketKey = externalTicketKey.Trim(),
            ExternalUrl = externalUrl.Trim(),
            ProviderType = providerType,
            Status = TicketLinkStatus.Open,
            CreatedAtUtc = createdAtUtc,
            ResolvedAtUtc = null
        };
    }

    public void MarkResolved(DateTime resolvedAtUtc)
    {
        Status = TicketLinkStatus.Resolved;
        ResolvedAtUtc = resolvedAtUtc;
    }

    public void MarkClosed(DateTime closedAtUtc)
    {
        Status = TicketLinkStatus.Closed;
        ResolvedAtUtc ??= closedAtUtc;
    }

    public void MarkFailed()
    {
        Status = TicketLinkStatus.Failed;
    }
}

public sealed class OwnershipRule
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Predicate { get; private set; } = string.Empty;
    public int Priority { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static OwnershipRule Create(Guid organizationId, string name, string predicate, int priority, bool isActive, TenantScope tenantScope)
    {
        if (organizationId == Guid.Empty)
        {
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Ownership rule name is required.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(predicate))
        {
            throw new ArgumentException("Ownership rule predicate is required.", nameof(predicate));
        }

        if (tenantScope.OrganizationId != organizationId)
        {
            throw new ArgumentException("Tenant scope does not match the organization.", nameof(tenantScope));
        }

        return new OwnershipRule
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = name.Trim(),
            Predicate = predicate.Trim(),
            Priority = priority,
            IsActive = isActive,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
