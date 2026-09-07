# 13 - Routing and Ticket Deduplication

## Purpose
Select the most-specific integration and create at most one linked ticket per error group/integration pair.

## PRD requirements covered
FR-07, FR-05, provider routing, deduplicated ticket creation.

## Prerequisites
08-idempotency-and-error-grouping, 09-ownership-engine, 11-jira-provider, 12-azure-devops-provider.

## Scope
Binding precedence Environment -> Service -> App -> Team -> Organization default, ownership decision use, canonical ticket construction, unique link claim, provider call, link persistence, and reconciliation after partial failure.

## Proposed project and folder locations
`Application/Routing`, `Infrastructure/Persistence/Routing`; worker handler in `Application/Jobs/Handlers`.

## Classes, interfaces, entities, and endpoints
`IRoutingResolver`, `IntegrationBindingResolver`, `ITicketDispatchService`, `TicketRequestFactory`, `TicketLinkRepository`; optional `GET /v1/error-groups/{id}` scoped endpoint.

## Database changes and migrations
Integration bindings with scope type/scope ID/priority; unique `(error_group_id, integration_id)` ticket link; index binding lookup. Add provider idempotency key metadata if provider supports it.

## Configuration requirements
Binding precedence, default ticket title/body templates, assignment policy, provider timeout, and reconciliation window.

## Security considerations
Tenant-scoped binding resolution, minimum data in ticket body, redaction defense-in-depth, encrypted credential retrieval, and authorization for group inspection.

## Detailed implementation steps in exact order
1. Load group, service hierarchy, and ownership decision.
2. Resolve most-specific enabled binding deterministically.
3. Build canonical redacted ticket request and stable idempotency key.
4. Atomically claim link using unique constraint/lock.
5. Call provider outside DB transaction.
6. Persist external ID and status; on conflict reconcile existing link.
7. Mark job complete or raise classified failure.

## Unit and integration tests
Precedence, tie-breaking, no binding, duplicate concurrent dispatch, provider success/failure, crash between provider and persistence, and tenant isolation.

## Acceptance criteria
The selected binding follows exact precedence; repeated jobs do not create a second link; partial failures are retryable/reconcilable and never silently discarded.

## Definition of done
Routing produces one canonical ticket per group/integration under concurrency.

## Dependencies on other plan files
Prerequisites: 08, 09, 11, 12. Enables 14, 15, 18, 19.

## Explicit non-goals
Multiple tickets for arbitrary custom rules, user-facing ticket editing, webhooks, or provider fan-out beyond configured bindings.
