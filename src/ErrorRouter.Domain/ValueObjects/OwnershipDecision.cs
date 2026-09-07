namespace ErrorRouter.Domain.ValueObjects;

public sealed record OwnershipDecision
{
    public Guid? TeamId { get; }
    public Guid? RuleId { get; }
    public string Reason { get; }

    private OwnershipDecision(Guid? teamId, Guid? ruleId, string reason)
    {
        TeamId = teamId;
        RuleId = ruleId;
        Reason = reason;
    }

    public static OwnershipDecision Unassigned(string reason) => Create(null, null, reason);

    public static OwnershipDecision Assigned(Guid teamId, Guid ruleId, string reason)
    {
        DomainValidation.RequireId(teamId, nameof(teamId), "Team ID");
        DomainValidation.RequireId(ruleId, nameof(ruleId), "Ownership rule ID");
        return Create(teamId, ruleId, reason);
    }

    private static OwnershipDecision Create(Guid? teamId, Guid? ruleId, string reason)
    {
        DomainValidation.RequireText(reason, nameof(reason), "Ownership decision reason");
        return new OwnershipDecision(teamId, ruleId, reason.Trim());
    }
}