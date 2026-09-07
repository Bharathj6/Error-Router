namespace ErrorRouter.Domain.ValueObjects;

internal static class DomainValidation
{
    public static void RequireId(Guid value, string parameterName, string displayName)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException($"{displayName} is required.", parameterName);
        }
    }

    public static void RequireOrganization(Guid organizationId, TenantScope tenantScope)
    {
        RequireId(organizationId, nameof(organizationId), "Organization ID");

        if (tenantScope is null || tenantScope.OrganizationId != organizationId)
        {
            throw new ArgumentException("Tenant scope does not match the organization.", nameof(tenantScope));
        }
    }

    public static void RequireText(string? value, string parameterName, string displayName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{displayName} is required.", parameterName);
        }
    }
}