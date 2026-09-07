# 19 - Test Strategy and Testcontainers

## Purpose
Validate behavior, concurrency, security boundaries, provider contracts, and production-like dependencies.

## PRD requirements covered
MVP quality gate; xUnit and Testcontainers roadmap deliverable.

## Prerequisites
01-18, with executable slices available before full integration coverage.

## Scope
Test pyramid, unit tests, API contract tests, PostgreSQL/Redis Testcontainers fixtures, fake provider HTTP tests, concurrency tests, performance smoke tests, and security regression tests.

## Proposed project and folder locations
`tests/ErrorRouter.UnitTests`, `tests/ErrorRouter.IntegrationTests/Fixtures`, `Contracts`, `Api`, `Worker`, `Persistence`, `Providers` test folders.

## Classes, interfaces, entities, and endpoints
`PostgresFixture`, `RedisFixture`, `ApiFactory`, `FakeTicketingProvider`, `FakeClock`, test data builders, and tenant isolation assertions.

## Database changes and migrations
Run real migrations against disposable PostgreSQL; verify indexes/constraints and rollback behavior. No test-only production migrations.

## Configuration requirements
Test connection overrides, container startup timeout, deterministic clock, parallelization rules, and test data cleanup.

## Security considerations
Use generated test secrets, ensure test logs are safe, run dependency/vulnerability scans, and include negative authorization/redaction cases.

## Detailed implementation steps in exact order
1. Establish unit test conventions and builders.
2. Add provider contract and HTTP handler tests.
3. Add PostgreSQL migration and repository fixtures.
4. Add Redis rate-limit fixture.
5. Add API end-to-end ingestion/grouping tests.
6. Add worker/retry/DLQ integration tests.
7. Add concurrent duplicate and ticket tests.
8. Add performance smoke test for 202 path and CI test categorization.

## Unit and integration tests
The plan itself is the test inventory: all FR-01..08, exact retry vector, tenant isolation, redaction, known fingerprint vectors, adapter contracts, 202 timing, and deploy smoke tests must be automated.

## Acceptance criteria
CI can run unit tests without containers and integration tests with containers; critical concurrency/security cases are covered and failures produce diagnostics.

## Definition of done
Tests are deterministic, tagged, runnable locally/CI, and block release on critical failures.

## Dependencies on other plan files
Prerequisites: 01-18. Enables 20-22.

## Explicit non-goals
Full load testing, chaos engineering, browser/UI testing, or testing V2 integrations.
