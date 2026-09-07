# 18 - Observability and Auditing

## Purpose
Make intake, grouping, routing, provider calls, retries, and privileged changes measurable and traceable without leaking sensitive data.

## PRD requirements covered
Operational support for all MVP requirements; auditability of security and routing decisions.

## Prerequisites
03-database-and-ef-core, 04-tenancy-and-credentials, 05-ingestion-contracts, 14-background-processing, 17-api-hosting-and-security.

## Scope
Structured logs, OpenTelemetry traces/metrics, correlation IDs, audit events, dashboards/alerts, provider/job metrics, and redaction enforcement.

## Proposed project and folder locations
`Infrastructure/Observability`, `Api/Middleware/Correlation`, `Application/Auditing`, `Persistence/Configurations/AuditEventConfiguration`.

## Classes, interfaces, entities, and endpoints
`IAuditWriter`, `AuditWriter`, `TelemetryEnricher`, `MetricsCatalog`; optional tenant-scoped `GET /v1/audit-events` for authorized operators.

## Database changes and migrations
Audit table with tenant, actor type/id, action, resource type/id, outcome, correlation ID, timestamp, and redacted metadata JSONB. Index tenant/time/action.

## Configuration requirements
OTLP exporter, sampling, log level, metric retention/export, audit retention, health thresholds, and alert destinations.

## Security considerations
Allowlist fields, hash or omit identifiers where appropriate, never record credentials/raw payloads, protect audit reads, and treat telemetry exporters as data processors.

## Detailed implementation steps in exact order
1. Define safe event schema and field allowlist.
2. Implement correlation propagation.
3. Add intake latency, accepted/rejected, grouping, queue, provider, retry, DLQ, and rate-limit metrics.
4. Add traces across API transaction and worker/provider calls.
5. Persist security/routing/configuration audit events.
6. Add dashboards and actionable alerts.
7. Test redaction and cardinality limits.

## Unit and integration tests
Audit persistence, tenant filtering, trace propagation, metric dimensions, sensitive-field rejection, and exporter outage behavior.

## Acceptance criteria
Operators can identify an event’s lifecycle by correlation ID and monitor target latency, queue age, provider failures, retries, DLQ, and rate limits without sensitive data exposure.

## Definition of done
Observability is present in API, worker, database, Redis, and provider paths with runbook references.

## Dependencies on other plan files
Prerequisites: 03, 04, 05, 14, 17. Enables 19-22.

## Explicit non-goals
Building an APM replacement UI, permanent raw telemetry archive, or analytics warehouse.
