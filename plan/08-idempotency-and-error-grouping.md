# 08 - Idempotency and Error Grouping

## Purpose
Atomically claim source events, create or update error groups, count occurrences, and enqueue routing work without duplicate effects.

## PRD requirements covered
FR-05, occurrence counting, error-group schema, and durable outbox/job requirement.

## Prerequisites
03-database-and-ef-core, 05-ingestion-contracts, 07-fingerprinting-and-normalization.

## Scope
Organization-scoped source-event idempotency, group upsert, occurrence append, count/last-seen update, concurrency handling, and job creation in one PostgreSQL transaction.

## Proposed project and folder locations
`Application/Grouping`, `Infrastructure/Persistence/GroupingRepository`; command `AcceptIngestedEvent` and handler.

## Classes, interfaces, entities, and endpoints
`IErrorGroupingService`, `IErrorGroupRepository`, `AcceptIngestedEventCommand`, `GroupingResult`, `SourceEventClaim`, `RoutingJobPayload`; endpoint is 05’s `/v1/ingest`.

## Database changes and migrations
Enforce unique `(organization_id, source_event_id)` and `(organization_id, fingerprint)`. Add indexes for service/last-seen. Use serializable or carefully locked upsert strategy and optimistic/concurrency recovery.

## Configuration requirements
Transaction isolation, occurrence context retention/size, job payload schema version, and duplicate response policy.

## Security considerations
Redaction must precede transaction; all queries include organization scope; job payload contains only redacted, minimum necessary data.

## Detailed implementation steps in exact order
1. Begin tenant-scoped transaction.
2. Insert source-event claim; on conflict return idempotent result without a second occurrence.
3. Upsert group by tenant/fingerprint.
4. Append redacted occurrence and increment count/update last seen.
5. Insert one routing job using a stable deduplication key.
6. Commit and return accepted result.
7. Add concurrency retry only for known serialization/unique conflicts.

## Unit and integration tests
Duplicate requests, concurrent same fingerprint, concurrent different source IDs, rollback proving no partial group, job uniqueness, count accuracy, and cross-tenant collision tests.

## Acceptance criteria
Retries of the same source event create one occurrence; distinct events share one group and increment count; every accepted event has durable processing work; failed transactions leave no partial state.

## Definition of done
Grouping is idempotent under concurrency and is the durable handoff from intake to processing.

## Dependencies on other plan files
Prerequisites: 03, 05, 07. Enables 13-15 and 18.

## Explicit non-goals
Eventual cross-region deduplication, distributed transactions, broker semantics, or raw event retention without policy.
