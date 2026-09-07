# 02 - Domain Model

## Purpose
Define tenant, error, routing, ticket, job, and audit aggregates with invariants independent of infrastructure.

## PRD requirements covered
FR-01, FR-04, FR-05, FR-06, FR-07, FR-08 and the supplied core schema.

## Prerequisites
01-solution-foundation.

## Scope
Model Organization, Application, Service, Environment, Team, ApiCredential, TicketingIntegration, IntegrationBinding, ErrorGroup, ErrorOccurrence, TicketLink, OwnershipRule, OutboxJob, DeadLetter, AuditEvent, and source-event identity. Use strongly typed IDs/value objects where practical.

## Proposed project and folder locations
`src/ErrorRouter.Domain/Entities`, `ValueObjects`, `Enums`, `Events`, `Repositories`; `src/ErrorRouter.Application/Abstractions`.

## Classes, interfaces, entities, and endpoints
Entities expose invariant-preserving methods, not public mutable setters. Define `TenantScope`, `Fingerprint`, `SourceEventKey`, `OwnershipDecision`, `RoutingDecision`, `JobType`, `JobStatus`, `TicketStatus`, repository ports, and `IErrorIngestionService`; HTTP endpoints are deferred to 05/17.

## Database changes and migrations
Specify keys, tenant foreign keys, UTC timestamps, concurrency token, status enums as strings, and uniqueness: `(organization_id, fingerprint)`, `(organization_id, source_event_id)`, `(error_group_id, integration_id)`. Include indexes on tenant/service, job status/next-at, and audit time.

## Configuration requirements
Maximum occurrence context size, allowed status values, clock, and tenant validation options.

## Security considerations
Every aggregate operation accepts tenant scope; no repository method may query by ID without organization scope. Avoid storing raw credentials or unredacted payloads.

## Detailed implementation steps in exact order
1. Define IDs and enums.
2. Define tenant hierarchy and integration entities.
3. Define error group/occurrence/link entities matching PRD schema.
4. Define ownership and routing entities.
5. Define job, DLQ, and audit entities.
6. Add domain methods for count, status transitions, lease, retry, and ticket-link claims.
7. Add repository and unit-of-work ports.
8. Add invariant-focused tests.

## Unit and integration tests
Test fingerprint length, tenant ownership, valid state transitions, occurrence count, retry-at calculation inputs, and duplicate link prevention at domain level.

## Acceptance criteria
The model captures every PRD schema field plus required operational state and makes invalid transitions impossible through public APIs.

## Definition of done
Domain project has no EF, ASP.NET, Redis, or provider dependency and tests pass.

## Dependencies on other plan files
Prerequisite: 01. Enables 03-19.

## Explicit non-goals
No EF mappings, HTTP DTOs, provider SDKs, migrations, or business rule persistence implementation.
