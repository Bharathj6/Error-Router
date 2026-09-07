# 10 - Ticketing Abstraction

## Purpose
Define the provider-neutral contract and canonical ticket model used by Jira and Azure DevOps.

## PRD requirements covered
MVP provider abstraction with two adapters and deduplicated ticket creation.

## Prerequisites
02-domain-model and 04-tenancy-and-credentials.

## Scope
Implement the supplied `ITicketingProvider` contract, request/result/status types, provider factory, error classification, timeout/cancellation, and canonical field mapping.

## Proposed project and folder locations
`Application/Ticketing`: `ITicketingProvider`, `TicketRequest`, `TicketResult`, `TicketUpdate`, `TicketDetails`, `TicketStatus`, `ProviderException`; `Infrastructure/Ticketing` factory and registration.

## Classes, interfaces, entities, and endpoints
Exactly expose `CreateAsync`, `UpdateAsync`, `AssignAsync`, `UpdateStatusAsync`, `GetAsync`; `ITicketingProviderFactory`, `IntegrationCredentialResolver`, `ProviderCapabilities`. No provider-specific endpoint.

## Database changes and migrations
Integration metadata, provider type, encrypted settings, project/team identifiers, and capability flags are already part of 03/04; no additional schema beyond needed fields.

## Configuration requirements
HTTP timeout, retry classification, user-agent, max response size, provider base URLs, and API-version options.

## Security considerations
Decrypt credentials only at call time, never log authorization headers or payload secrets, enforce tenant integration ownership, and validate provider URLs to prevent SSRF.

## Detailed implementation steps in exact order
1. Freeze canonical models and status mapping.
2. Define transient/permanent/auth/rate-limit exception taxonomy.
3. Define factory registration by provider type.
4. Add HTTP client policies with cancellation and bounded response handling.
5. Add contract tests using fake providers.

## Unit and integration tests
Factory resolution, model mapping, cancellation, timeout, exception classification, secret non-logging, and fake-provider contract tests.

## Acceptance criteria
Routing can invoke either adapter through one interface and distinguish retryable from terminal failures without provider leakage.

## Definition of done
Provider contract is stable and consumed only through the abstraction.

## Dependencies on other plan files
Prerequisites: 02, 04. Enables 11-15.

## Explicit non-goals
Supporting more than Jira/Azure DevOps, webhooks, status synchronization, or provider-specific public APIs.
