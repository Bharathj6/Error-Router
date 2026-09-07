# 07 - Fingerprinting and Normalization

## Purpose
Produce deterministic SHA-256 fingerprints from the exact PRD input components while excluding timestamps and GUIDs.

## PRD requirements covered
FR-04 and repeated-exception grouping.

## Prerequisites
06-redaction-pipeline.

## Scope
Normalize exception type, stack frames, service name, and route template; remove timestamps/GUIDs from frame text; preserve frame order; canonicalize separators and casing according to documented rules; hash UTF-8 canonical input with SHA-256.

## Proposed project and folder locations
`Application/Fingerprinting`: `IErrorFingerprinter`, `IStackFrameNormalizer`, `CanonicalFingerprintInput`; pure implementation may live in Domain/Application.

## Classes, interfaces, entities, and endpoints
`Sha256ErrorFingerprinter`, `StackFrameNormalizer`, `GuidAndTimestampNormalizer`; no endpoint. Expose canonical material only in tests, never production logs.

## Database changes and migrations
No new tables. Store lowercase 64-character hex fingerprint in `error_groups.fingerprint`.

## Configuration requirements
Normalization version, timestamp/GUID patterns, Unicode normalization, and route-template policy. Persist algorithm/version if future changes could split groups.

## Security considerations
Hashing is not redaction; sanitize first. Avoid logging canonical input because it may contain sensitive code/context.

## Detailed implementation steps in exact order
1. Define canonical field order exactly as `exceptionType + normalizedStackFrames + serviceName + routeTemplate`.
2. Specify separators and null/empty handling.
3. Normalize stack frames and dynamic values.
4. Normalize service and route values.
5. Hash UTF-8 canonical bytes.
6. Add known-vector tests and a normalization version.

## Unit and integration tests
Known SHA-256 vector, timestamp/GUID exclusion, whitespace/casing rules, frame ordering, route-template distinction, Unicode, empty fields, and redaction-before-hash tests.

## Acceptance criteria
Equivalent events produce the same 64-character SHA-256 fingerprint; meaningful service/route/type/frame changes produce different fingerprints; timestamps and GUIDs do not change it.

## Definition of done
Fingerprint behavior is deterministic, versioned, documented, and consumed by grouping.

## Dependencies on other plan files
Prerequisite: 06. Enables 08.

## Explicit non-goals
Probabilistic similarity, machine learning, source-code indexing, root-cause analysis, or cross-service grouping beyond the specified input.
