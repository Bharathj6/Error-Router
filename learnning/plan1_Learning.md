# Plan 1 Learning Notes: Solution Foundation

## Why this plan matters

The first implementation step is not business logic; it is the foundation that makes the entire platform buildable, testable, and maintainable. Without a clean solution structure and correct dependency boundaries, the rest of the repository becomes difficult to scale or verify.

## Main objective

Create the .NET solution skeleton for the ErrorRouter MVP so the team can build domain logic, persistence, API hosting, background workers, and test projects without coding chaos.

## What the plan establishes

This plan defines:

- the solution and project layout
- the dependency direction between projects
- startup and configuration conventions
- .NET quality standards
- health check endpoints
- developer build/test expectations

## Recommended project structure

The plan suggests a modular monolith layout with clear responsibilities:

- `src/ErrorRouter.Api` — API endpoints and composition root
- `src/ErrorRouter.Worker` — background job execution
- `src/ErrorRouter.Domain` — entities, rules, and value objects
- `src/ErrorRouter.Application` — orchestration and business use cases
- `src/ErrorRouter.Infrastructure` — EF Core, Redis, secrets, providers, and integrations
- `src/ErrorRouter.Contracts` — public interfaces and DTO contracts
- `tests/ErrorRouter.UnitTests` — isolated unit verification
- `tests/ErrorRouter.IntegrationTests` — end-to-end integration coverage

## Why the dependency direction matters

A clean dependency model keeps the system honest:

- Domain should not depend on infrastructure or API concerns.
- Application can use domain and infrastructure abstractions but should not depend on the concrete web host.
- Infrastructure can implement interfaces defined by the application or domain.
- API and Worker should stay thin and orchestrate behavior rather than contain business logic.

This not only makes the code more maintainable, but it also makes testing easier and helps enforce architecture boundaries.

## Startup and configuration lessons

This plan enforces environment-based configuration and validation. That matters because production systems fail in subtle ways when they run with missing or malformed settings.

Typical configuration concerns include:

- PostgreSQL connection strings
- Redis connection strings
- host and API settings
- OpenTelemetry or observability settings
- worker polling intervals
- validation of required service configuration

The key principle is: validate early and fail clearly.

## Health checks and observability readiness

The plan calls for `/health/live` and `/health/ready`, which are important because they allow infrastructure systems, orchestrators, and operators to detect service health. This is basic but critical for production readiness.

## Quality gate for the plan

The solution is considered successful only when:

- the solution builds cleanly
- test projects run without errors
- configuration validation fails clearly when required settings are missing
- the architecture remains clean and easy to extend

## Interview-level explanation

When speaking about this plan in an interview, explain it like this:

> I start with the project structure and dependency rules because the architecture must be sound before features are implemented. A modular monolith with clean layering lets the system scale in complexity without forcing early distributed-system overhead. I also validate configuration and health at the beginning so the team catches operational issues early rather than after a production deployment.

## What to emphasize in a technical discussion

- strong boundaries between layers
- simple but scalable architecture decisions
- startup validation rather than silent misconfiguration
- health and readiness as operational essentials
- readiness for later feature work without changing the foundational structure

## Suggested follow-up learning path

After this plan, the next critical concepts are:

1. domain modeling and tenant-aware entities
2. PostgreSQL persistence and EF Core design
3. secure credential and tenancy handling
4. error normalization and fingerprinting
5. idempotent grouping and dup suppression
6. ownership and ticketing adapters
7. asynchronous job processing and retries
8. security, observability, and deployment automation

## Summary

Plan 01 is the foundation for the entire system. It turns a conceptual platform into a structured, buildable .NET solution and establishes the engineering standards the rest of the implementation will rely on.
