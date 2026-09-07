# 12 - Azure DevOps Provider

## Purpose
Implement the Azure DevOps adapter behind `ITicketingProvider`.

## PRD requirements covered
MVP adapter two and canonical ticket dispatch.

## Prerequisites
10-ticketing-abstraction.

## Scope
Azure DevOps Work Item REST client for create, update, assign, status update, and get; map canonical fields and configured organization/project/work-item type.

## Proposed project and folder locations
`Infrastructure/Ticketing/AzureDevOps`: provider, typed client, JSON Patch mapper, DTOs, options, registration.

## Classes, interfaces, entities, and endpoints
`AzureDevOpsTicketingProvider : ITicketingProvider`; typed `HttpClient`; no public provider proxy endpoint.

## Database changes and migrations
No new tables; encrypted integration settings and `ticket_links.external_ticket_id` store provider reference.

## Configuration requirements
Organization URL, project, work-item type, API version, credential reference, timeout, and field mappings.

## Security considerations
HTTPS-only endpoint validation, protect PAT/token, redact JSON Patch diagnostics, tenant ownership checks, and no credential-bearing URLs.

## Detailed implementation steps in exact order
1. Define and validate provider options.
2. Implement typed client and authentication.
3. Implement JSON Patch create/update mapping.
4. Implement assignment, status, and get operations.
5. Classify API failures and rate limits.
6. Register factory and metrics.
7. Add fake handler and sandbox contract tests.

## Unit and integration tests
Patch correctness, response mapping, auth protection, status mapping, 401/404/429/5xx behavior, timeout, and cancellation.

## Acceptance criteria
Configured Azure DevOps integration performs all interface operations and returns the shared failure taxonomy.

## Definition of done
Adapter is isolated, tested, and interchangeable with Jira from routing code.

## Dependencies on other plan files
Prerequisite: 10. Enables 13-15 and 19.

## Explicit non-goals
Webhooks, bidirectional status sync, pull-request creation, commit correlation, or additional Azure DevOps resource types.
