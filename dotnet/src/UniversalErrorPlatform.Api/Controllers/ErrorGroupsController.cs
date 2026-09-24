namespace UniversalErrorPlatform.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniversalErrorPlatform.Domain.Contracts;
using UniversalErrorPlatform.Domain.Models;
using UniversalErrorPlatform.Infrastructure.Integrations;
using UniversalErrorPlatform.Infrastructure.Persistence;

[ApiController]
[Route("api/v1/error-groups")]
public class ErrorGroupsController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ErrorGroupsController> _logger;

    public ErrorGroupsController(ApplicationDbContext dbContext, ILogger<ErrorGroupsController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetErrorGroupsAsync(
        [FromQuery] Guid? organizationId,
        [FromQuery] string? service,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = _dbContext.ErrorGroups
            .Include(g => g.Service)
            .Include(g => g.TicketLinks)
            .AsNoTracking();

        if (organizationId.HasValue)
        {
            query = query.Where(g => g.OrganizationId == organizationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(service))
        {
            query = query.Where(g => g.Service.Name.ToLower() == service.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(g => g.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(g => g.Fingerprint.Contains(s) || g.ExceptionType.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(g => g.LastSeen)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new
            {
                g.Id,
                g.Fingerprint,
                g.ExceptionType,
                g.Status,
                g.OccurrenceCount,
                g.FirstSeen,
                g.LastSeen,
                ServiceName = g.Service.Name,
                Environment = g.Service.Environment,
                g.AssignedTeam,
                g.AssignedOwner,
                g.OwnershipMatchRule,
                TicketLinks = g.TicketLinks.Select(t => new
                {
                    t.Id,
                    t.ExternalTicketId,
                    t.ExternalTicketUrl,
                    t.Status,
                    t.LastSyncedAt
                })
            })
            .ToListAsync(ct);

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetErrorGroupByIdAsync(Guid id, CancellationToken ct)
    {
        var group = await _dbContext.ErrorGroups
            .Include(g => g.Service)
            .Include(g => g.TicketLinks)
            .Include(g => g.Occurrences.OrderByDescending(o => o.Timestamp).Take(10))
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id, ct);

        if (group == null)
            return NotFound(new { error = $"ErrorGroup {id} not found" });

        return Ok(group);
    }

    public record StatusUpdateRequest(string Status);

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatusAsync(
        Guid id,
        [FromBody] StatusUpdateRequest request,
        [FromServices] JiraTicketingProvider jiraProvider,
        [FromServices] AzureDevOpsTicketingProvider adoProvider,
        CancellationToken ct)
    {
        var group = await _dbContext.ErrorGroups
            .Include(g => g.TicketLinks)
                .ThenInclude(tl => tl.Integration)
            .FirstOrDefaultAsync(g => g.Id == id, ct);

        if (group == null)
            return NotFound(new { error = $"ErrorGroup {id} not found" });

        group.Status = request.Status;
        await _dbContext.SaveChangesAsync(ct);

        // Sync status to external tickets if present
        foreach (var ticketLink in group.TicketLinks)
        {
            try
            {
                var targetStatus = request.Status switch
                {
                    "Resolved" => TicketStatus.Resolved,
                    "Investigating" => TicketStatus.InProgress,
                    "Ignored" => TicketStatus.Closed,
                    _ => TicketStatus.Open
                };

                ITicketingProvider provider = ticketLink.Integration.ProviderType == "AzureDevOps"
                    ? adoProvider
                    : jiraProvider;

                await provider.UpdateStatusAsync(ticketLink.ExternalTicketId, targetStatus, ct);
                ticketLink.Status = request.Status;
                ticketLink.LastSyncedAt = DateTimeOffset.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync status update to external ticket {TicketId}", ticketLink.ExternalTicketId);
            }
        }

        await _dbContext.SaveChangesAsync(ct);
        return Ok(new { success = true, status = group.Status });
    }
}
