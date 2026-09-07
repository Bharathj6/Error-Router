# 21 - CI/CD and Release

## Purpose
Automate validation, packaging, migration review, and controlled release of the API and worker.

## PRD requirements covered
MVP release readiness and roadmap CI/CD deliverable.

## Prerequisites
19-test-strategy-and-testcontainers and 20-docker-local-environment.

## Scope
CI restore/build/test/scan, integration services, Docker image build, artifact versioning, migration review, environment promotion, deployment health checks, and rollback runbook.

## Proposed project and folder locations
`.github/workflows/ci.yml`, `release.yml`, `ops/` deployment templates, `docs/release.md`.

## Classes, interfaces, entities, and endpoints
No runtime classes; pipeline stages invoke `dotnet`, test, migration-script, Docker, and deployment tooling. Smoke calls `/health/ready`.

## Database changes and migrations
Generate idempotent migration scripts as artifacts; require approval for production application; back up/verify before destructive changes, though MVP migrations should be additive.

## Configuration requirements
Registry, signing/scanning, environment secret references, artifact retention, deployment parameters, and migration approval settings.

## Security considerations
OIDC/workload identity over long-lived CI secrets, protected branches/environments, dependency/container scanning, SBOM, artifact signing, and no secret echo.

## Detailed implementation steps in exact order
1. Add formatting/analyzer/build workflow.
2. Add unit and container integration test jobs.
3. Add vulnerability/license/SBOM checks.
4. Build and tag API/worker images from immutable commit.
5. Generate/review migration artifact.
6. Deploy non-production, run health and smoke checks.
7. Add gated production promotion and rollback instructions.
8. Verify release audit trail.

## Unit and integration tests
Pipeline validation, image startup, migration script smoke, health checks, and deployment rollback rehearsal.

## Acceptance criteria
A clean commit produces tested, scanned, versioned API/worker artifacts; deployment blocks on failing tests or unsafe migrations and verifies readiness.

## Definition of done
Release process is documented, repeatable, and auditable.

## Dependencies on other plan files
Prerequisites: 19, 20. Enables 22.

## Explicit non-goals
Choosing a cloud vendor, Kubernetes-specific production implementation, blue/green orchestration, or V2 broker deployment.
