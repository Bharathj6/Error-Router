# 14 - Background Processing

## Purpose
Execute durable routing work asynchronously using a PostgreSQL outbox/job table and worker leases.

## PRD requirements covered
202 acceptance behavior, asynchronous routing, outbox/job-table MVP requirement, occurrence-to-ticket workflow.

## Prerequisites
08-idempotency-and-error-grouping and 13-routing-and-ticket-deduplication.

## Scope
Worker host, polling loop, `FOR UPDATE SKIP LOCKED`, lease/heartbeat, handler registry, job statuses, bounded concurrency, graceful shutdown, and idempotent completion.

## Proposed project and folder locations
`src/ErrorRouter.Worker`, `Application/Jobs`, `Infrastructure/Persistence/Jobs`; handlers under `Application/Jobs/Handlers`.

## Classes, interfaces, entities, and endpoints
`IJobHandler`, `JobDispatcher`, `JobPoller`, `JobLease`, `RoutingJobHandler`, `JobCompletionService`, `WorkerOptions`; health/readiness endpoint from 01.

## Database changes and migrations
Jobs table: type, payload JSONB, dedupe key, status, attempts, available/leased/completed timestamps, lease owner/expiry, last error; unique dedupe key where required. Dead-letter fields are finalized in 15.

## Configuration requirements
Poll interval, batch size, worker ID, lease duration, max concurrency, shutdown grace period, payload size, and lock timeout.

## Security considerations
Do not deserialize untrusted payloads into executable types; allowlist job types; redact payloads; limit worker DB permissions and provider secret access.

## Detailed implementation steps in exact order
1. Add job mappings and repository.
2. Implement claim query with lease expiry recovery.
3. Implement handler registry and routing handler.
4. Add bounded execution and cancellation.
5. Mark success/failure atomically and release leases.
6. Add graceful shutdown and readiness behavior.
7. Emit metrics for queue depth, age, duration, and failures.

## Unit and integration tests
Claim concurrency, lease expiry, duplicate job, cancellation, shutdown, handler dispatch, poison payload, and end-to-end PostgreSQL worker test.

## Acceptance criteria
Multiple workers do not process the same leased job concurrently; abandoned leases recover; successful jobs are not repeated; failed jobs flow to retry logic.

## Definition of done
A durable worker can process routing jobs without a message broker.

## Dependencies on other plan files
Prerequisites: 08, 13. Enables 15 and 18-22.

## Explicit non-goals
Kafka/RabbitMQ/Azure Service Bus, autoscaling policy, distributed workflow engine, or exactly-once external provider semantics.
