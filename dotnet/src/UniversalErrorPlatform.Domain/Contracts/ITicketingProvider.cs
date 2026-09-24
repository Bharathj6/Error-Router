namespace UniversalErrorPlatform.Domain.Contracts;

using UniversalErrorPlatform.Domain.Models;

/// <summary>
/// Provider Adapter Interface Contract defined in PRD Section 5
/// </summary>
public interface ITicketingProvider
{
    Task<TicketResult> CreateAsync(TicketRequest request, CancellationToken ct);
    Task UpdateAsync(string externalTicketId, TicketUpdate request, CancellationToken ct);
    Task AssignAsync(string externalTicketId, string externalUserId, CancellationToken ct);
    Task UpdateStatusAsync(string externalTicketId, TicketStatus status, CancellationToken ct);
    Task<TicketDetails> GetAsync(string externalTicketId, CancellationToken ct);
}
