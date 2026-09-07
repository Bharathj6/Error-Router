# 11 - Jira Provider

## Purpose
Implement the Jira adapter behind `ITicketingProvider`.

## PRD requirements covered
MVP adapter one and canonical ticket dispatch.

## Prerequisites
10-ticketing-abstraction.

## Scope
Jira REST client for create, update, assign, status update, and get; map canonical fields; classify HTTP failures; support configured project/issue type and external IDs.

## Proposed project and folder locations
`Infrastructure/Ticketing/Jira`: `JiraTicketingProvider`, `JiraHttpClient`, DTOs, mapper, options, registration.

## Classes, interfaces, entities, and endpoints
`JiraTicketingProvider : ITicketingProvider`; typed `HttpClient`; no public Jira proxy endpoint.

## Database changes and migrations
No new tables. Store Jira integration configuration in encrypted integration settings and ticket external ID in `ticket_links`.

## Configuration requirements
Base URL, API version, project key, issue type, timeout, credential reference, field mapping, and optional label/component settings.

## Security considerations
Allow only HTTPS configured URLs, protect API tokens, redact request/response diagnostics, validate external IDs, and avoid SSRF through tenant-controlled URLs unless explicitly allowed.

## Detailed implementation steps in exact order
1. Define options and validate required fields.
2. Implement typed HTTP client and auth injection.
3. Implement canonical-to-Jira create mapping.
4. Implement update/assign/status/get mappings.
5. Classify 2xx, 4xx, 429, 5xx and malformed responses.
6. Register provider factory and metrics.
7. Add fake HTTP handler contract tests and sandbox test.

## Unit and integration tests
Request mapping, auth header non-leakage, response mapping, 404/401/429/5xx classification, timeout, cancellation, and provider contract tests.

## Acceptance criteria
Configured Jira integration creates and retrieves tickets through the interface; transient responses are retryable; credentials never appear in logs.

## Definition of done
Jira adapter is production-shaped, tested, and does not leak Jira types beyond Infrastructure.

## Dependencies on other plan files
Prerequisite: 10. Enables 13-15 and 19.

## Explicit non-goals
Jira webhooks, two-way synchronization, bulk backfill, custom workflow authoring, or Jira UI.
