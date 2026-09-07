namespace ErrorRouter.Domain.ValueObjects;

public sealed record RoutingDecision
{
    public Guid? IntegrationId { get; }
    public string Reason { get; }

    private RoutingDecision(Guid? integrationId, string reason)
    {
        IntegrationId = integrationId;
        Reason = reason;
    }

    public static RoutingDecision Unrouted(string reason)
    {
        DomainValidation.RequireText(reason, nameof(reason), "Routing decision reason");
        return new RoutingDecision(null, reason.Trim());
    }

    public static RoutingDecision Routed(Guid integrationId, string reason)
    {
        DomainValidation.RequireId(integrationId, nameof(integrationId), "Integration ID");
        DomainValidation.RequireText(reason, nameof(reason), "Routing decision reason");
        return new RoutingDecision(integrationId, reason.Trim());
    }
}