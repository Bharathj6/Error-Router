# 00 - MVP Overview

## Purpose
Define the greenfield backend architecture, implementation order, boundaries, and decisions for the Universal Production Error to Engineering Automation Platform MVP.

## PRD requirements covered
FR-01 through FR-08; MVP scope: multi-tenancy, secure ingestion, redaction, SHA-256 grouping, hierarchical ownership, Jira and Azure DevOps adapters, deduplicated ticket creation, occurrence counting, rate limiting, retries, dead-lettering, observability, testing, and deployment.

## Prerequisites
The supplied PRD is the only product source. Repository inspection found no existing solution or conventions. Assumptions and unresolved questions are recorded below.

## Scope
Plan the complete backend MVP from an empty repository through a deployable API and worker, including persistence, security, asynchronous routing, provider adapters, operations, tests, and release automation.

## Proposed project and folder locations
Use the solution and folder layout below. Detailed ownership of each location is defined in plans 01-22.

## MVP architecture
Use one .NET 8 ASP.NET Core modular monolith with a Web API process and a Worker process sharing application/domain/infrastructure libraries. PostgreSQL is the source of truth. Redis is an accelerator for rate-limit counters and short-lived cache only. A PostgreSQL outbox/job table provides durable asynchronous processing; a broker is V2 and is not required for MVP.

Suggested solution:
```
src/
  ErrorRouter.Api/             HTTP endpoints, auth, middleware, composition root
  ErrorRouter.Worker/          outbox polling and job handlers
  ErrorRouter.Domain/          entities, value objects, domain rules
  ErrorRouter.Application/     use cases, ports, DTOs, pipeline orchestration
  ErrorRouter.Infrastructure/  EF Core, PostgreSQL, Redis, providers, crypto
  ErrorRouter.Contracts/       public ingestion and provider contracts
tests/
  ErrorRouter.UnitTests/
  ErrorRouter.IntegrationTests/
ops/
  docker-compose.yml
  migrations/
```

## Modular-monolith boundaries
- Tenancy and credentials: organization, application, service, environment, API keys, integrations.
- Ingestion: authenticated intake and contract validation only.
- Sanitization: redaction before persistence, logs, jobs, or provider requests.
- Fingerprinting: deterministic normalization and SHA-256.
- Grouping: idempotent occurrence and error-group transaction.
- Ownership: ordered rule evaluation returning an explainable result.
- Ticketing: provider-neutral port plus Jira/Azure DevOps adapters.
- Routing: most-specific integration binding and ticket-link coordination.
- Processing: durable jobs, leases, retries, and dead-letter records.
- Cross-cutting: tenant context, authorization, rate limiting, auditing, health, telemetry.

## Classes, interfaces, entities, and endpoints
The principal shared contracts are `ITicketingProvider`, `IRedactionPipeline`, `IErrorFingerprinter`, `IOwnershipResolver`, `IRateLimiter`, `IJobHandler`, and tenant-aware repository ports. Public endpoint contracts are defined in plans 04, 05, 09, 15, and 17.

## Database changes and migrations
The initial migration creates the tenant hierarchy, credentials, integrations and bindings, ownership rules, error groups/occurrences, source-event claims, ticket links, jobs, dead letters, and audit events. Later plans add only the tables and indexes explicitly identified in their database sections.

## Configuration requirements
Required runtime settings are PostgreSQL, Redis, API hosting, worker polling, provider HTTP, encryption/key protection, rate limits, telemetry, and migration policy. All settings require environment-specific validation and secrets must be injected externally.

## Security considerations
Authentication, tenant isolation, pre-persistence redaction, encrypted provider credentials, safe outbound HTTP, least-privilege database/Redis access, bounded payloads, auditability, and no sensitive logs are release requirements.

## Complete dependency graph
`01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10 -> (11,12) -> 13 -> 14 -> 15; 16 -> 17; 18 depends on 03,04,05,14; 19 depends on 01-18; 20 depends on 03,16,19; 21 depends on 19,20; 22 depends on 01-21.`

Detailed prerequisites: 04 requires 02/03; 05 requires 01/04; 06 requires 05; 07 requires 06; 08 requires 03/05/07; 09 requires 02/03; 10 requires 02; 11/12 require 10; 13 requires 08/09/11/12; 14 requires 08/13; 15 requires 14; 16 requires 01; 17 requires 04/05/16; 18 requires 03/14/17; 19 requires all executable modules; 20 requires 19; 21 requires 20; 22 requires all.

## Exact execution sequence
1. Create solution, projects, package versions, analyzers, and dependency direction.
2. Define domain entities/value objects and tenant-aware interfaces.
3. Configure EF Core PostgreSQL and create the initial migration.
4. Implement tenant hierarchy, API-key hashing/rotation, and integration credential storage.
5. Define ingestion DTOs, authentication flow, validation, and `202 Accepted` endpoint.
6. Implement recursive payload/header redaction with bounded payloads.
7. Normalize stack frames and compute the specified SHA-256 fingerprint.
8. Atomically claim source-event idempotency, upsert group, append occurrence, and enqueue routing.
9. Implement ordered ownership rules and explainable match results.
10. Define `ITicketingProvider`, canonical ticket models, and provider error taxonomy.
11. Implement Jira adapter.
12. Implement Azure DevOps adapter.
13. Resolve integration binding and atomically deduplicate ticket links.
14. Implement PostgreSQL job polling, leases, and worker handlers.
15. Add exact retry schedule and DLQ behavior.
16. Add Redis rate limiting and cache invalidation rules.
17. Harden hosting, authentication, authorization, TLS, and request limits.
18. Add structured logs, metrics, traces, and audit events.
19. Add unit, contract, concurrency, and Testcontainers integration tests.
20. Add Docker Compose and local operational scripts.
21. Add CI/CD build, test, migration, image, and deployment workflow.
22. Execute the final validation checklist and record residual risks.

## Detailed implementation steps in exact order
Follow the 22-step execution sequence above. Each numbered plan contains the detailed implementation steps for that stage; do not begin a later stage until its acceptance criteria and definition of done pass.

## Critical transaction boundaries
- Ingestion transaction: source-event claim, redacted occurrence, group upsert/count, and routing-job insert. Commit before returning 202; duplicate source events become a no-op success.
- Ticket transaction: lock or unique-claim `(error_group_id, integration_id)`, create external ticket outside the DB transaction, then persist the link with conflict recovery. A provider call must never hold a DB transaction open.
- Job transaction: lease one job, commit lease, execute handler, then atomically mark succeeded or schedule retry/DLQ.
- Credential writes: hash API keys; encrypt provider secrets; never return secret material.

## Synchronous versus asynchronous processing
The intake path performs authentication, rate-limit check, schema validation, redaction, fingerprinting, and the durable grouping/outbox transaction. It returns 202 only after the durable transaction commits, targeting under 50 ms in normal local conditions. Ownership evaluation and ticket provider calls are asynchronous worker actions. Provider calls, retries, and DLQ handling never block ingestion.

## PostgreSQL, Redis, and worker responsibilities
PostgreSQL stores all tenant, event, group, occurrence, routing, credential metadata, job, ticket-link, and audit state. Redis stores atomic rate-limit windows and optional short-lived configuration cache; Redis loss must fail closed for abuse protection or use a documented bounded fallback. Workers poll jobs with `FOR UPDATE SKIP LOCKED`, lease timeouts, idempotent handlers, and bounded concurrency.

## Unit and integration tests
Every module includes focused unit tests. Plan 19 provides PostgreSQL/Redis Testcontainers, provider contract tests, concurrency coverage, security regression tests, and the final 202 timing smoke test.

## Risks, assumptions, unresolved questions
- Assumes .NET 8, PostgreSQL 16, Redis 7, xUnit, and Testcontainers.
- PRD names a distributed broker in the stack but explicitly places queues in V2; MVP uses a PostgreSQL job table.
- PRD does not define the ingestion JSON shape, tenant provisioning API, API-key format, ownership-rule authoring API, retention period, payload maximum, or provider field mappings; these are proposed in module plans and require confirmation.
- The 50 ms target is measured at the API boundary under normal load, not a hard guarantee during database failure.
- Recent-author data source and CODEOWNERS synchronization are unspecified; MVP accepts managed rules/configuration rather than repository crawling.
- Provider idempotency is not guaranteed externally; unique ticket links plus reconciliation jobs limit duplicates but cannot undo a provider-side duplicate.

## Acceptance criteria
The sequence is executable by another developer, every MVP requirement maps to a module, tenant and persistence boundaries are explicit, and no V2 feature is required for MVP completion.

## Definition of done
Architecture, dependency graph, transaction model, assumptions, and implementation order are approved and linked to plans 01-22.

## Dependencies on other plan files
None; this is the index and architecture contract.

## Explicit non-goals
No UI replacement, AI RCA, irreversible developer assignment, third-party broker, webhook status sync, extra providers, commit/deployment correlation, automated patching, or permanent raw-payload retention.
