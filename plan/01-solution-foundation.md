# 01 - Solution Foundation

## Purpose
Create the compilable .NET solution and dependency rules for the modular monolith.

## PRD requirements covered
Enables all MVP requirements; supports .NET conventions, worker hosting, testing, and deployment.

## Prerequisites
00-mvp-overview; no existing repository code.

## Scope
Create `ErrorRouter.sln`, projects under `src/` and `tests/`, nullable reference types, analyzers, central package management, configuration binding, health-check composition, and dependency direction: Domain <- Application <- Infrastructure/API/Worker.

## Proposed project and folder locations
`src/ErrorRouter.Domain`, `Application`, `Infrastructure`, `Contracts`, `Api`, `Worker`; `tests/ErrorRouter.UnitTests`, `IntegrationTests`; `Directory.Build.props`, `Directory.Packages.props`, `global.json`, `README.md`.

## Classes, interfaces, entities, and endpoints
Define composition roots, `IClock`, `ITenantContext`, `IUnitOfWork`, `IJobDispatcher`, `ISecretProtector`, `IRequestIdAccessor`; no business endpoint beyond health probes. Add `/health/live` and `/health/ready` in API and worker health checks.

## Database changes and migrations
No schema migration. Reserve migration assembly and design-time `DbContextFactory` locations in Infrastructure.

## Configuration requirements
Environment-based `ConnectionStrings:Postgres`, `ConnectionStrings:Redis`, `AspNetCore`, logging, OpenTelemetry, worker polling, and options validation at startup. Pin SDK/package versions.

## Security considerations
Treat configuration and secrets as untrusted; do not commit secrets; enable HTTPS redirection outside local development; use secret scanning in CI.

## Detailed implementation steps in exact order
1. Create solution and projects.
2. Add only allowed project references.
3. Configure nullable, analyzers, warnings-as-errors for production projects.
4. Add options classes and startup validation.
5. Add API/worker composition roots and health checks.
6. Add baseline README and local build commands.
7. Build all projects and run empty test assemblies.

## Unit and integration tests
Verify project dependency direction, options validation, health endpoint status, and clean restore/build.

## Acceptance criteria
`dotnet build` and `dotnet test` pass from repository root; both hosts start with missing optional provider settings but fail clearly for required database settings.

## Definition of done
Solution is compilable, reproducible, and ready for domain/database work.

## Dependencies on other plan files
Prerequisite: 00. Enables 02-22.

## Explicit non-goals
No business logic, migrations, provider implementation, UI, or production cloud manifests.
