# 03 - Database and EF Core

## Purpose
Persist the domain in PostgreSQL with tenant-safe EF Core mappings and an initial migration.

## PRD requirements covered
FR-01, FR-05, supplied error-group/occurrence/ticket-link schema, PostgreSQL source-of-truth requirement.

## Prerequisites
01-solution-foundation and 02-domain-model.

## Scope
Npgsql EF Core DbContext, configurations, converters, indexes, constraints, migrations, transaction helper, tenant query filters where safe, and design-time tooling.

## Proposed project and folder locations
`src/ErrorRouter.Infrastructure/Persistence/ErrorRouterDbContext.cs`, `Configurations/`, `Migrations/`, `Repositories/`, `TenantSaveChangesInterceptor.cs`.

## Classes, interfaces, entities, and endpoints
`ErrorRouterDbContext`, `IDbContextFactory`, repository implementations, `ITransactionRunner`, `TenantQueryGuard`; no new public endpoint.

## Database changes and migrations
Create organizations, applications, services, environments, teams, credentials, integrations, bindings, ownership rules, error_groups, error_occurrences, source_event_claims, ticket_links, jobs, dead_letters, audit_events. Use UUID keys, `jsonb` for redacted context, `char(64)` fingerprint, UTC timestamptz, cascades/restricts matching PRD, and named unique constraints.

## Configuration requirements
Postgres connection string, command timeout, retry-on-transient-failure, migration policy, and pool limits. Migrations run explicitly during deployment, never implicitly in production startup.

## Security considerations
Least-privilege DB user, TLS connection option, parameterized EF queries, no sensitive SQL logging, tenant guard in repositories and save interceptor.

## Detailed implementation steps in exact order
1. Add EF/Npgsql packages.
2. Implement DbContext and mappings.
3. Add explicit indexes and unique constraints.
4. Implement tenant-aware repositories and transaction helper.
5. Generate and review initial migration.
6. Add migration command/runbook.
7. Test schema creation and rollback on a disposable PostgreSQL instance.

## Unit and integration tests
Mapping tests, migration smoke test, constraint tests, tenant isolation tests, concurrent insert tests for unique keys, and transaction rollback tests.

## Acceptance criteria
A clean PostgreSQL instance can be migrated; all supplied constraints exist; cross-tenant reads/writes are rejected or return no data; migrations are deterministic.

## Definition of done
Database is the authoritative persistence layer and is ready for intake and worker use.

## Dependencies on other plan files
Prerequisites: 01, 02. Enables 04-22.

## Explicit non-goals
No read replicas, sharding, broker persistence, raw permanent payload archive, or production migration automation beyond documented commands.
