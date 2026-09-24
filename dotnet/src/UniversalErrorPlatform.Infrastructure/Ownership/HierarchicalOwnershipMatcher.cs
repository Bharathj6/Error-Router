namespace UniversalErrorPlatform.Infrastructure.Ownership;

public record OwnershipResolution(
    string Team,
    string? PrimaryOwner,
    string MatchRule,
    string EscalationPath
);

public interface IOwnershipMatcher
{
    OwnershipResolution ResolveOwnership(
        string serviceName,
        string environment,
        string rawStackTrace,
        string? routeTemplate,
        string? authorCommitEmail = null);
}

/// <summary>
/// Implements FR-06 Hierarchical Ownership Matcher and FR-07 Adapter Routing.
/// Fallback Hierarchy:
/// Path rules -> CODEOWNERS -> Service mapping -> Module mapping -> Recent author -> Team default -> Team queue -> Manager escalation
/// </summary>
public class HierarchicalOwnershipMatcher : IOwnershipMatcher
{
    // Path rules configuration (e.g. regex -> team/owner)
    private readonly List<(string PathPattern, string Team, string Owner)> _pathRules = new()
    {
        ("/checkout|/payment|PaymentsController|BillingService", "Payments Engineering", "sarah.connor@corp.internal"),
        ("/auth|/login|/oauth|TokenValidator|JwtService", "Security & Identity", "alex.mercer@corp.internal"),
        ("/inventory|/catalog|ProductRepository", "Catalog Platform", "david.kim@corp.internal"),
        ("/orders|OrderProcessingWorker|ShippingClient", "Fulfillment Ops", "elena.rostova@corp.internal"),
        ("/telemetry|/metrics|/health", "Observability Core", "marcus.vance@corp.internal")
    };

    // CODEOWNERS simulated table
    private readonly Dictionary<string, (string Team, string Owner)> _codeowners = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Services/PaymentService.cs", ("Payments Engineering", "sarah.connor@corp.internal") },
        { "Security/TokenValidator.cs", ("Security & Identity", "alex.mercer@corp.internal") },
        { "Data/DatabaseConnection.cs", ("Data Infrastructure", "rachel.green@corp.internal") },
        { "Controllers/OrdersController.cs", ("Fulfillment Ops", "elena.rostova@corp.internal") }
    };

    // Service mapping
    private readonly Dictionary<string, (string Team, string Owner)> _serviceMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        { "payment-service", ("Payments Engineering", "payments-lead@corp.internal") },
        { "auth-gateway", ("Security & Identity", "sec-lead@corp.internal") },
        { "order-service", ("Fulfillment Ops", "fulfillment-lead@corp.internal") },
        { "inventory-api", ("Catalog Platform", "catalog-lead@corp.internal") },
        { "billing-worker", ("Billing Core", "billing-lead@corp.internal") }
    };

    public OwnershipResolution ResolveOwnership(
        string serviceName,
        string environment,
        string rawStackTrace,
        string? routeTemplate,
        string? authorCommitEmail = null)
    {
        var targetText = $"{rawStackTrace} {routeTemplate ?? ""}";

        // Step 1: Evaluate Path Rules (Specific route / file path matches)
        foreach (var (pattern, team, owner) in _pathRules)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(targetText, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                return new OwnershipResolution(
                    Team: team,
                    PrimaryOwner: owner,
                    MatchRule: $"PathRule: /{pattern}/",
                    EscalationPath: "PathRule -> Direct Assignment"
                );
            }
        }

        // Step 2: Evaluate CODEOWNERS
        foreach (var (codePath, (team, owner)) in _codeowners)
        {
            if (targetText.Contains(codePath, StringComparison.OrdinalIgnoreCase))
            {
                return new OwnershipResolution(
                    Team: team,
                    PrimaryOwner: owner,
                    MatchRule: $"CODEOWNERS: {codePath}",
                    EscalationPath: "CODEOWNERS -> Direct Owner"
                );
            }
        }

        // Step 3: Evaluate Service Mapping
        if (!string.IsNullOrWhiteSpace(serviceName) && _serviceMappings.TryGetValue(serviceName.Trim(), out var serviceOwner))
        {
            return new OwnershipResolution(
                Team: serviceOwner.Team,
                PrimaryOwner: serviceOwner.Owner,
                MatchRule: $"ServiceMapping: {serviceName}",
                EscalationPath: "ServiceMapping -> Service Lead"
            );
        }

        // Step 4: Evaluate Module Mapping
        if (targetText.Contains("Database") || targetText.Contains("Npgsql") || targetText.Contains("Postgres"))
        {
            return new OwnershipResolution(
                Team: "Data Infrastructure",
                PrimaryOwner: "db-sre@corp.internal",
                MatchRule: "ModuleMapping: Database/Npgsql",
                EscalationPath: "ModuleMapping -> SRE On-Call"
            );
        }

        // Step 5: Recent Author fallback (if available)
        if (!string.IsNullOrWhiteSpace(authorCommitEmail))
        {
            return new OwnershipResolution(
                Team: "Feature Development",
                PrimaryOwner: authorCommitEmail,
                MatchRule: "RecentGitAuthor",
                EscalationPath: "GitCommit -> Recent Author"
            );
        }

        // Step 6: Team Default
        if (environment.Equals("production", StringComparison.OrdinalIgnoreCase))
        {
            return new OwnershipResolution(
                Team: "Tier-1 Production SRE",
                PrimaryOwner: "sre-triage@corp.internal",
                MatchRule: "EnvironmentBinding: Production",
                EscalationPath: "Team Default -> SRE Triage Queue"
            );
        }

        // Step 7: Team Queue / Manager Escalation
        return new OwnershipResolution(
            Team: "Platform Engineering",
            PrimaryOwner: "platform-duty-mgr@corp.internal",
            MatchRule: "Fallback: Manager Escalation",
            EscalationPath: "Team Queue -> Manager Escalation"
        );
    }
}
