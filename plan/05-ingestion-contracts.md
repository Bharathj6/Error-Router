# 05 - Ingestion Contracts

## Purpose
Define and implement the authenticated HTTP intake path that validates, redacts later in the pipeline, durably records accepted events, and returns 202 quickly.

## PRD requirements covered
FR-02, FR-03, FR-05; ingestion API and under-50ms target.

## Prerequisites
04-tenancy-and-credentials and 01-solution-foundation.

## Scope
Versioned JSON contract, source event identity, request limits, content-type validation, correlation ID, authentication, rate-limit hook, application service call, and 202/400/401/413/429 responses.

## Proposed project and folder locations
`Contracts/Ingestion`, `Application/Ingestion`, `Api/Endpoints/Ingestion`, validators and JSON options in API.

## Classes, interfaces, entities, and endpoints
`IngestErrorRequest`, `ExceptionPayload`, `RequestContextPayload`, `IngestAcceptedResponse`, `IngestionController` or minimal endpoint `POST /v1/ingest`; `IIngestionService`, `IRequestValidator`, `ISourceEventClaimStore`.

## Database changes and migrations
Use source-event claim table with organization-scoped unique `(organization_id, source_event_id)`; persist only the redacted occurrence through the 08 transaction.

## Configuration requirements
Max body bytes, max nesting/depth, accepted schema versions, timeout, clock skew, and request cancellation settings.

## Security considerations
Require API key over TLS, reject oversized/unknown content where policy requires, do not log request body, propagate safe correlation IDs, and ensure source event IDs cannot cross tenants.

## Detailed implementation steps in exact order
1. Freeze the versioned request/response schema.
2. Add JSON options and validation.
3. Authenticate and create tenant context.
4. Invoke rate limiter before expensive processing.
5. Call redaction/fingerprint/grouping application pipeline.
6. Return 202 only after durable acceptance transaction; map failures consistently.
7. Add endpoint metrics and request timing.

## Unit and integration tests
Contract serialization, invalid payload, authentication, body-limit, cancellation, duplicate source event, 202 timing smoke test, and tenant isolation tests.

## Acceptance criteria
Valid requests receive 202 with an acceptance ID; malformed/unauthenticated/over-limit requests receive documented errors; no raw secret reaches logs or persistence.

## Definition of done
Versioned ingestion endpoint is callable by telemetry sources and has an explicit performance test.

## Dependencies on other plan files
Prerequisites: 01, 04. Depends on 06-08 for complete pipeline; enables 16-18.

## Explicit non-goals
Webhook ingestion, broker-native ingestion, UI, synchronous ticket creation, and support for undocumented vendor-specific schemas.
