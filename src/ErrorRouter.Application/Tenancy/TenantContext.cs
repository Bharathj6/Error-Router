using ErrorRouter.Application.Abstractions;
using ErrorRouter.Domain.ValueObjects;

namespace ErrorRouter.Application.Tenancy;

public sealed class TenantContext : ITenantContext
{
    public TenantScope? Current { get; private set; }

    public void Set(TenantScope tenantScope)
    {
        Current = tenantScope ?? throw new ArgumentNullException(nameof(tenantScope));
    }

    public void Clear()
    {
        Current = null;
    }
}