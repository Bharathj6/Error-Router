# 20 - Docker Local Environment

## Purpose
Provide a reproducible local stack for API, worker, PostgreSQL, and Redis.

## PRD requirements covered
Local infrastructure for PostgreSQL, Redis, workers, and implementation roadmap deployment support.

## Prerequisites
03-database-and-ef-core, 16-rate-limiting-and-redis, 19-test-strategy-and-testcontainers.

## Scope
Dockerfiles, `docker-compose.yml`, health checks, networks, volumes, environment template, migration command, seed data, and local runbook.

## Proposed project and folder locations
`ops/docker-compose.yml`, `ops/.env.example`, `src/*/Dockerfile` or repository Dockerfiles, `scripts/` for migration/seed commands.

## Classes, interfaces, entities, and endpoints
No production classes; compose services are `api`, `worker`, `postgres`, `redis`. Health probes use `/health/live` and `/health/ready`.

## Database changes and migrations
Run the reviewed EF migration as an explicit one-shot migration service/command; persistent local Postgres volume; no automatic destructive reset.

## Configuration requirements
Non-secret defaults, required secret placeholders, ports, database/Redis URLs, OTLP optional endpoint, and worker settings.

## Security considerations
No default production credentials, bind databases to local interfaces only, avoid privileged containers, pin image versions, and document local-only secrets.

## Detailed implementation steps in exact order
1. Add minimal runtime Dockerfiles.
2. Add compose services and dependency health checks.
3. Add migration command and seed command.
4. Add `.env.example` and runbook.
5. Verify fresh start, restart, migration, ingestion, worker processing, and cleanup.
6. Scan images and pin versions.

## Unit and integration tests
Compose smoke test, migration test, health dependency test, and end-to-end event-to-ticket fake-provider test.

## Acceptance criteria
A new developer can start the local stack, migrate it, create a tenant/key, ingest an event, and observe worker processing with documented commands.

## Definition of done
Local environment is reproducible and does not require a broker.

## Dependencies on other plan files
Prerequisites: 03, 16, 19. Enables 21-22.

## Explicit non-goals
Production Kubernetes manifests, managed-service provisioning, or permanent local raw payload retention.
