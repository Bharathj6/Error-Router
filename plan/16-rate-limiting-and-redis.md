# 16 - Rate Limiting and Redis

## Purpose
Protect ingestion with tenant-aware distributed rate limits while keeping PostgreSQL authoritative.

## PRD requirements covered
Secure ingestion rate limits; Redis stack requirement.

## Prerequisites
01-solution-foundation and 04-tenancy-and-credentials.

## Scope
Atomic Redis fixed/sliding window counters keyed by organization/service/environment, response headers, limits, TTLs, optional short-lived configuration cache, and failure policy.

## Proposed project and folder locations
`Infrastructure/Redis`, `Application/RateLimiting`, API middleware/filter before ingestion processing.

## Classes, interfaces, entities, and endpoints
`IRateLimiter`, `RedisRateLimiter`, `RateLimitDecision`, `RateLimitOptions`, `RedisConnectionHealthCheck`; no new endpoint.

## Database changes and migrations
No authoritative schema change. Optional persisted limit configuration belongs to tenant settings; Redis keys are disposable.

## Configuration requirements
Redis connection/TLS, window size, default and tenant limits, key prefix, timeout, and fail-open/closed policy. Default MVP policy: fail closed for ingestion when abuse protection cannot be evaluated, with a narrowly bounded emergency fallback only if approved.

## Security considerations
Never use raw API keys in Redis keys; use tenant IDs and hashed scope; ACL Redis; avoid sensitive values in headers/logs.

## Detailed implementation steps in exact order
1. Define rate-limit contract and headers.
2. Implement atomic Lua/script or server-side primitive.
3. Add tenant/scope key construction.
4. Wire middleware after authentication and before payload work.
5. Add cache invalidation/versioning if limits are configurable.
6. Add health and metrics.

## Unit and integration tests
Window boundary, concurrent increments, tenant isolation, TTL, Redis outage policy, header correctness, and Testcontainers Redis test.

## Acceptance criteria
A tenant exceeding its limit receives 429 with safe retry metadata; one tenant cannot consume another’s quota; Redis is not the source of truth.

## Definition of done
Distributed rate limiting is enforced and observable in API and worker tests.

## Dependencies on other plan files
Prerequisites: 01, 04. Integrates with 05, 17, 19, 20.

## Explicit non-goals
Redis persistence as business data, distributed locks for ticket creation, session storage, or broker queues.
