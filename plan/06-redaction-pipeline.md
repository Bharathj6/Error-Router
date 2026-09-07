# 06 - Redaction Pipeline

## Purpose
Remove credentials, secrets, and configured PII before data is persisted, logged, queued, or sent to providers.

## PRD requirements covered
FR-03 and the security-leakage MVP requirement.

## Prerequisites
05-ingestion-contracts; 02-domain-model.

## Scope
Header denylist (`Authorization`, `Cookie`, proxy auth), case-insensitive password/token/secret field redaction, recursive JSON traversal, stack-trace pattern masking, configured custom rules, bounded output, and redaction telemetry without values.

## Proposed project and folder locations
`Application/Sanitization`: `IRedactionPipeline`, `RedactionResult`, `RedactionRule`; `Infrastructure/Sanitization` for regex/rule implementations.

## Classes, interfaces, entities, and endpoints
`PayloadRedactor`, `HeaderRedactor`, `StackTraceRedactor`, `JsonRedactor`, `RedactionOptions`; no direct endpoint. Integrate at the first application boundary after authentication.

## Database changes and migrations
No new tables; optional versioned redaction-rule records belong to tenant configuration if configurable rules are required. Default rules must be code-reviewed.

## Configuration requirements
Sensitive field names, regexes, replacement marker, maximum input/output size, recursion depth, and timeout-safe regex options.

## Security considerations
Fail closed on redaction errors; never include matched values in diagnostics; avoid catastrophic regex; redact before exception logging and job serialization.

## Detailed implementation steps in exact order
1. Define immutable redaction input/output contracts.
2. Implement header redaction.
3. Implement bounded recursive JSON redaction.
4. Implement stack-trace and key-value pattern masking.
5. Add custom rule validation and deterministic rule ordering.
6. Wire redaction before fingerprinting and persistence.
7. Add a test corpus of representative secrets and false positives.

## Unit and integration tests
Nested JSON, case variants, arrays, headers, stack traces, PII patterns, malformed input, depth/size limits, regex timeout, and proof that logs/jobs receive redacted data.

## Acceptance criteria
Known secrets and configured PII are replaced before any durable or observable side effect; redaction is deterministic and bounded.

## Definition of done
Redaction is a mandatory application pipeline stage with tests guarding regressions.

## Dependencies on other plan files
Prerequisite: 05. Enables 07, 08, 14, 18.

## Explicit non-goals
Perfect semantic PII discovery, reversible masking, raw payload archival, or AI-based classification.
