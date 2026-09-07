# 22 - MVP Validation Checklist

## Purpose
Provide the final, executable gate for MVP completeness and dependency validation.

## PRD requirements covered
All MVP scope, FR-01 through FR-08, supplied schema/provider contract, security, observability, testing, Docker, and CI/CD.

## Prerequisites
01-21 complete; all unresolved product decisions either confirmed or explicitly accepted as assumptions.

## Scope
Final functional, security, data, concurrency, performance, operations, and release checks; evidence links and sign-off.

## Proposed project and folder locations
`docs/mvp-validation.md`, release checklist in `ops/`, automated checks in integration tests and CI.

## Classes, interfaces, entities, and endpoints
Validate `POST /v1/ingest`, tenant/admin provisioning endpoints, ownership/rule endpoints, DLQ replay/list endpoints, health endpoints, `ITicketingProvider`, and worker handlers.

## Database changes and migrations
Verify clean migration, required tables/indexes/unique constraints, tenant foreign keys, UTC timestamps, and additive release safety.

## Configuration requirements
Production-like non-secret configuration, secret references, limits, retry schedule, Redis/Postgres endpoints, OTLP, and provider sandbox credentials supplied only by deployment environment.

## Security considerations
Confirm secret/PII redaction at persistence/log/job/provider boundaries, key revocation, tenant isolation, authorization, TLS, SSRF protections, dependency scans, and safe error responses.

## Detailed implementation steps in exact order
1. Run clean build and all unit tests.
2. Run migrations on disposable PostgreSQL and verify schema constraints.
3. Run Redis and API contract tests.
4. Ingest valid, invalid, duplicate, oversized, and rate-limited events.
5. Verify fingerprint/group/count behavior under concurrency.
6. Verify all ownership fallback levels and binding precedence.
7. Verify Jira/Azure fake-provider success and failures.
8. Verify exact retry schedule and DLQ/replay.
9. Inspect traces, metrics, logs, and audits for sensitive data.
10. Build/start Docker stack and run smoke test.
11. Run CI/CD pipeline and release/rollback rehearsal.
12. Record decisions, gaps, and approval.

## Unit and integration tests
All tests listed in 19 must pass; add a final acceptance suite mapping each FR to a test/evidence artifact. Performance smoke must demonstrate the 202 path target in the agreed environment.

## Acceptance criteria
No unchecked MVP requirement; all PRD constraints and exact retry delays are verified; tenant isolation and no-secret leakage are demonstrated; release artifact is deployable.

## Definition of done
Product, engineering, security, and operations sign-off is recorded, with explicit residual risks and confirmed ambiguities.

## Dependencies on other plan files
Prerequisites: 01-21; terminal plan.

## Explicit non-goals
Any V2 feature, UI replacement, AI RCA, extra provider, webhook sync, deployment correlation, automated patching, or permanent raw-payload storage.
