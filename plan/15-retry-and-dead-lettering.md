# 15 - Retry and Dead-Lettering

## Purpose
Apply the exact transient-failure schedule and preserve terminal work for operator investigation.

## PRD requirements covered
FR-08: immediate, 10 seconds, 30 seconds, 2 minutes, 10 minutes, then DLQ.

## Prerequisites
14-background-processing and 10-ticketing-abstraction.

## Scope
Failure classification, attempt numbering, next-at calculation, retry scheduling, max-attempt enforcement, dead-letter records, replay/resolution state, and safe error summaries.

## Proposed project and folder locations
`Application/Jobs/RetryPolicy.cs`, `Infrastructure/Persistence/DeadLetters`, worker failure middleware.

## Classes, interfaces, entities, and endpoints
`IRetryPolicy`, `ExactMvpRetryPolicy`, `DeadLetterService`, `JobFailureClassifier`; operator endpoints `GET /v1/dead-letters`, `POST /v1/dead-letters/{id}/replay` with admin authorization.

## Database changes and migrations
Dead-letter table references job, tenant, error code, redacted message, attempt count, payload hash, and timestamps. Preserve original job history; do not store provider secrets.

## Configuration requirements
Schedule is fixed to 0s, 10s, 30s, 120s, 600s; maximum attempts = 5 retries after initial attempt; lease and clock settings.

## Security considerations
Redact exceptions and provider responses, restrict replay to tenant operators, rate-limit replay, and prevent replay loops from bypassing authorization.

## Detailed implementation steps in exact order
1. Define transient/permanent classification.
2. Implement exact schedule with injectable clock.
3. On transient failure increment attempt and set `available_at`.
4. After final failure atomically mark DLQ and job terminal.
5. Persist safe diagnostic metadata and correlation IDs.
6. Implement authorized replay as a new deduplicated job.
7. Add alerts/metrics for DLQ growth.

## Unit and integration tests
Exact delay vector, attempt boundaries, permanent failure, redacted diagnostics, concurrent finalization, replay authorization, and replay idempotency.

## Acceptance criteria
Retry times exactly match the PRD; fifth retry failure creates a DLQ record; no failed job is lost or retried forever.

## Definition of done
Operators can inspect and safely replay dead-lettered work without secret exposure.

## Dependencies on other plan files
Prerequisites: 10, 14. Enables 18-22.

## Explicit non-goals
Exponential backoff beyond the specified schedule, automatic infinite replay, broker DLQs, or user notifications outside metrics/logging.
