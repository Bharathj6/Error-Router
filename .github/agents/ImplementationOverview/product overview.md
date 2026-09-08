# Product Overview

## Product mission

ErrorRouter is a production-error workflow platform designed to reduce the operational overhead of debugging and routing failures in production environments. Instead of replacing observability tools, it sits between production error sources and engineering systems, turning noisy alert data into structured work that can be assigned, tracked, and resolved.

## Business problem

Engineering teams are flooded with duplicate errors, incomplete context, unclear ownership, and manual ticket creation. Errors often appear in multiple systems with slightly different payloads, making grouping and ownership attribution difficult. Sensitive technical details can leak into external ticket systems without redaction, and production incidents can drift away from the original engineering workflow.

## Product value

The platform provides a workflow that:

- ingests production errors from multiple sources
- normalizes and fingerprints them for de-duplication
- groups recurring exceptions into a single operational problem
- enriches the issue with environment, deployment, and ownership context
- resolves the most likely team or engineer for routing
- opens or updates tickets in provider-neutral ticketing systems
- tracks lifecycle state and retries safely
- enforces redaction and tenancy boundaries before persistence or outbound sending

## MVP architecture

The planned MVP uses a modular monolith built on .NET and ASP.NET Core.

- API layer: handles ingestion, validation, authentication, rate limiting, and request acceptance
- Application layer: orchestrates use cases and domain workflows
- Domain layer: owns business rules, entities, and value objects
- Infrastructure layer: manages EF Core, PostgreSQL, Redis, secrets, providers, and external integrations
- Worker layer: processes jobs, retries, and dead-letter handling
- PostgreSQL: source of truth for all durable operational state
- Redis: rate limiting, short-lived cache, and lightweight operational acceleration

## Implementation plan structure

The repository already defines a staged implementation sequence in the `plan/` folder. The intended dependency order is:

1. 00 - MVP overview
2. 01 - Solution foundation
3. 02 - Domain model
4. 03 - Database and EF Core
5. 04 - Tenancy and credentials
6. 05 - Ingestion contracts
7. 06 - Redaction pipeline
8. 07 - Fingerprinting and normalization
9. 08 - Idempotency and error grouping
10. 09 - Ownership engine
11. 10 - Ticketing abstraction
12. 11 - Jira provider
13. 12 - Azure DevOps provider
14. 13 - Routing and ticket deduplication
15. 14 - Background processing
16. 15 - Retry and dead-lettering
17. 16 - Rate limiting and Redis
18. 17 - API hosting and security
19. 18 - Observability and auditing
20. 19 - Test strategy and Testcontainers
21. 20 - Docker local environment
22. 21 - CI/CD and release
23. 22 - MVP validation checklist

## Plan-by-plan product summary

### 00 - MVP overview
The system-level blueprint defines the architecture, sequencing, transaction boundaries, async decisions, and acceptance criteria for the MVP.

### 01 - Solution foundation
Builds the initial .NET solution structure, package versions, project boundaries, health checks, and startup configuration.

### 02 - Domain model
Introduces the tenant-aware domain model, error entities, ticket concepts, and ownership rules needed for the platform.

### 03 - Database and EF Core
Defines PostgreSQL persistence, migrations, indexes, and data modeling decisions for durable state and concurrency safety.

### 04 - Tenancy and credentials
Implements organization boundaries, application metadata, secrets, API keys, and provider credential storage using secure patterns.

### 05 - Ingestion contracts
Defines the API contracts, validation shape, and accepted intake flow of production error events.

### 06 - Redaction pipeline
Protects sensitive data before persistence, logging, or outbound ticket content by applying recursive redaction rules.

### 07 - Fingerprinting and normalization
Normalizes stack traces and exception details into a deterministic fingerprint that supports grouping and deduplication.

### 08 - Idempotency and error grouping
Ensures duplicate source events do not create repeated state and groups similar issues into a durable error-aggregate record.

### 09 - Ownership engine
Resolves which team, engineer, or manager is responsible for the issue using explainable, ordered rules.

### 10 - Ticketing abstraction
Introduces a provider-agnostic ticketing contract and canonical models so providers can be swapped without rewriting the engine.

### 11 - Jira provider
Implements the Jira adapter, mapping, and outbound integration behavior for one of the core ticketing systems.

### 12 - Azure DevOps provider
Provides the Azure DevOps adapter and integration mapping to support a second provider in the MVP.

### 13 - Routing and ticket deduplication
Combines ownership and integration rules to decide where a ticket is sent and prevents duplicate ticket creation.

### 14 - Background processing
Adds the durable worker pipeline and job model used to process asynchronous actions without blocking ingestion.

### 15 - Retry and dead-lettering
Defines the retry schedule, failure classification, and dead-letter handling necessary for resilient job execution.

### 16 - Rate limiting and Redis
Adds Redis-backed rate limiting and short-lived caching while preserving the API’s abuse controls.

### 17 - API hosting and security
Hardens hosting, authentication, authorization, TLS, headers, and operational limits for a secure production entry point.

### 18 - Observability and auditing
Adds structured logs, metrics, traces, and auditable event capture for the operational life cycle.

### 19 - Test strategy and Testcontainers
Creates the verification strategy with unit tests, integration tests, concurrency validation, and PostgreSQL/Redis test containers.

### 20 - Docker local environment
Defines the local runtime environment for development and verification with Docker Compose.

### 21 - CI/CD and release
Establishes the automation pipeline for build, migration, testing, image packaging, and deployment quality gates.

### 22 - MVP validation checklist
Confirms the full delivery is production-grade enough to ship the MVP and captures residual risks.

## Current implementation status

### Implemented: 01 - Solution foundation

The foundation milestone is now present in the repository. It includes the `ErrorRouter.sln` solution, the Domain, Application, Infrastructure, Contracts, API, and Worker projects, the UnitTests and IntegrationTests projects, central package management, SDK configuration, and the initial API health endpoints. The project references preserve the intended modular-monolith dependency direction.

The foundation structure is covered by `FoundationStructureTests`, which verifies the core repository files, project layout, application references from the API and Worker, and the `/health/live` and `/health/ready` API routes. The current solution test run has one known failure in the project-reference assertion because the test compares project names with relative XML include paths; the integration-test assembly passes. No domain behavior, database schema, provider integration, or production deployment work is included in this milestone.

### Implemented: 02 - Domain model

The domain milestone now defines tenant-scoped organization hierarchy entities, teams, API credential metadata, ticketing integrations and bindings, source-event claims, error groups and occurrences, ticket links, ownership rules, durable jobs, dead letters, and audit events. Domain value objects include `TenantScope`, `Fingerprint`, `SourceEventKey`, `OwnershipDecision`, and `RoutingDecision`. Aggregate factories use private setters and validate organization scope; job and ticket-link lifecycle methods guard invalid state transitions. Repository ports are tenant-aware and the Application project exposes the `IErrorIngestionService` boundary without introducing infrastructure dependencies.

Focused domain tests cover fingerprint and source-event validation, explicit error-group association, tenant isolation, explainable ownership and routing decisions, ticket-link state, and job leasing and transitions. The focused suite has 11 passing tests plus the known plan-01 project-reference assertion failure. The domain and application builds pass with zero warnings or errors. A solution build remains blocked by the existing Worker `Host` resolution error in `src/ErrorRouter.Worker/Program.cs`; no database, HTTP, provider, or migration behavior was added in this stage.

### Implemented: 03 - Database and EF Core

Infrastructure now contains `ErrorRouterDbContext`, a design-time factory, explicit PostgreSQL mappings, tenant query guards, a save interceptor, tenant-aware repository implementations, and a transaction runner. The initial migration creates the full tenant, credential, integration, ownership, error, source-event, ticket, job, dead-letter, and audit schema. Tables and columns use snake_case names; redacted payload/predicate/job fields use `jsonb`, fingerprints use `char(64)`, timestamps use `timestamp with time zone`, and named unique constraints enforce tenant-scoped grouping, source-event idempotency, and ticket-link deduplication.

The persistence model tests verify PostgreSQL types, named uniqueness indexes, and context tenant isolation. Ten selected domain and persistence tests pass, and the Infrastructure project builds with zero warnings or errors. A live PostgreSQL migration, rollback, and concurrent constraint smoke test is intentionally deferred to plan 19, which introduces Testcontainers. The full solution still carries the known plan-01 Worker host compile error and project-reference assertion failure.

### Next implementation stage

The next eligible stage is 04 - Tenancy and credentials. It should provide the runtime tenant context, API-key hashing and rotation, encrypted provider credential storage, and DI wiring over the persistence boundary without weakening the fail-closed query and save guards.

### Implemented: 04 - Tenancy and credentials

The credential boundary now issues `er_live_` keys, stores only PBKDF2-SHA256 hashes with per-key salts and a high work factor, validates keys with constant-time comparison, tracks expiry and last use, and supports revocation. Credentials retain organization, application, service, and environment scope so successful authentication can establish an exact `TenantScope`. `ApiKeyValidator` performs prefix lookup followed by hash and lifecycle validation before returning scope. Provider credentials can be protected with AES-GCM using an externally supplied key and explicit key identifier; plaintext is never persisted or returned by the protection service. `TenantContext` provides the request-scoped application boundary. Development configuration now exposes local PostgreSQL and Redis connection-string slots plus credential settings; production settings remain empty and are intended to be injected through environment variables or user secrets.

The `CredentialScope` and `CredentialScopeRelationships` migrations add lifecycle and tenant-scope columns plus foreign keys. Focused security tests cover wrong, expired, and revoked keys, hash non-disclosure, tenant scope preservation, usage tracking, encrypted round trips, and key-identifier rejection. Infrastructure builds cleanly with zero warnings or errors. Live authentication-handler and PostgreSQL endpoint tests remain deferred until the API hosting and Testcontainers stages; the known plan-01 project-reference assertion and Worker host compile issue remain outside this stage.

### Next implementation stage

The next eligible stage is 05 - Ingestion contracts. It should define the public event DTOs, validation, authentication flow integration, and `202 Accepted` intake endpoint over the tenant and credential boundaries implemented here.

## Core engineering decisions

The MVP is intentionally built as a modular monolith rather than a distributed system. This choice reduces operational complexity while still separating the business concerns of ingestion, ownership, routing, and worker processing. The architecture keeps a clear dependency direction and supports later extraction if the platform outgrows the initial footprint.

## Why this design matters in interviews

This product demonstrates several strong engineering patterns:

- domain-driven modeling
- multi-tenancy design
- secure, tenant-aware API patterns
- event-driven processing with durable job handling
- provider abstraction and dependency inversion
- idempotency and deduplication at the persistence boundary
- production-readiness through observability, retries, and security controls

## Interview talking points

When explaining this project in an interview, focus on:

- how the platform acts as a workflow orchestrator rather than a replacement for observability tools
- why the architecture chooses a modular monolith as an MVP
- how tenant boundaries and redaction are protected across ingestion and ticketing
- how idempotency and deduplication reduce duplicate operational noise
- how provider abstraction allows the platform to support multiple ticket systems
- how the system remains resilient by writing durable work to the database and processing it asynchronously

## Expected technical outcomes

The MVP should produce a demonstrable end-to-end workflow that takes product error events, normalizes them, groups repeated errors, identifies ownership, and routes the issue into a ticketing system with minimal manual intervention.

## Remaining implementation note

Plans 02 through 22 remain to be implemented and validated in dependency order. The implementation agent and the `plan-stage-completion` skill are intended to keep each milestone scoped to its plan, run focused build and test checks, and update this overview as the product becomes executable.
