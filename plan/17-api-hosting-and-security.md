# 17 - API Hosting and Security

## Purpose
Harden the HTTP and worker hosts and expose secure operational/admin endpoints.

## PRD requirements covered
FR-02, secure ingestion, tenant isolation, rate limiting, and operational hosting.

## Prerequisites
04-tenancy-and-credentials, 05-ingestion-contracts, 16-rate-limiting-and-redis.

## Scope
Middleware order, API-key auth, authorization policies, HTTPS/proxy handling, request limits, CORS default deny, exception mapping, health/readiness, graceful shutdown, and security headers.

## Proposed project and folder locations
`Api/Program.cs`, `Api/Middleware`, `Api/Authorization`, `Api/Endpoints`, `Worker/Hosting`.

## Classes, interfaces, entities, and endpoints
`TenantAuthorizationHandler`, `ExceptionHandlingMiddleware`, `CorrelationMiddleware`, `SecurityHeadersMiddleware`; endpoints from 04, 05, 09, and 15 plus `/health/live`, `/health/ready`.

## Database changes and migrations
No new schema; ensure audit records for privileged operations.

## Configuration requirements
Forwarded headers allowlist, max body/request timeout, TLS, CORS, auth schemes, health timeouts, and environment-specific error detail.

## Security considerations
Default deny authorization, no stack traces in responses, anti-SSRF provider URL validation, secure cookies only if later used, secrets in external configuration, dependency scanning, and PII-safe logs.

## Detailed implementation steps in exact order
1. Establish middleware order: correlation, forwarded headers, exception mapping, auth, rate limit, endpoint.
2. Add policies for tenant admin/operator/read-only roles.
3. Add request/body limits and content-type validation.
4. Harden provider HTTP clients and outbound network policy.
5. Configure health/readiness dependency checks.
6. Add security headers and safe production error responses.
7. Run threat-model and dependency scan.

## Unit and integration tests
Unauthorized/forbidden cases, tenant boundary, malformed errors, request limits, forwarded-header spoofing, CORS, health degradation, and TLS/config smoke tests.

## Acceptance criteria
Only authorized tenant actors access resources; secrets and internal exception details never leave the service; liveness/readiness accurately reflect dependencies.

## Definition of done
Hosts are secure by default and deployable behind a documented reverse proxy.

## Dependencies on other plan files
Prerequisites: 04, 05, 16. Integrates with 18-22.

## Explicit non-goals
Customer SSO, WAF configuration, Kubernetes admission policy, or full API gateway productization.
