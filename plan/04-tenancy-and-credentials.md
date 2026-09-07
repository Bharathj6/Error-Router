# 04 - Tenancy and Credentials

## Purpose
Implement tenant hierarchy, API-key authentication, integration secret protection, and tenant-aware authorization.

## PRD requirements covered
FR-01, FR-02 and secure credential validation.

## Prerequisites
02-domain-model and 03-database-and-ef-core.

## Scope
Provision organization/application/service/environment records, issue and revoke ingestion keys, hash keys with a slow password KDF, encrypt provider tokens at rest, and create tenant context from authenticated requests.

## Proposed project and folder locations
`Application/Tenancy`, `Application/Credentials`; `Infrastructure/Security`; API controllers under `Api/Endpoints/Tenancy` and `Ingestion`.

## Classes, interfaces, entities, and endpoints
`ITenantProvisioningService`, `IApiKeyValidator`, `ISecretProtector`, `TenantContext`, `ApiKeyAuthenticationHandler`; proposed admin endpoints `POST /v1/organizations`, `POST /v1/services`, `POST /v1/environments`, `POST /v1/ingestion-keys`, `POST /v1/integrations`, and revoke endpoints. Return a key once only.

## Database changes and migrations
Use credential hash, prefix, created/revoked/expires timestamps, last-used metadata; encrypted integration secret and key identifier. Unique organization-scoped names and key prefixes.

## Configuration requirements
KDF parameters, data-protection/key-ring location, encryption key reference, key expiry, and provisioning authorization settings.

## Security considerations
Constant-time verification, prefix lookup followed by hash verification, key rotation/revocation, no secret logging, tenant authorization before resource lookup, and encryption-key rotation procedure.

## Detailed implementation steps in exact order
1. Add tenant provisioning use cases and validation.
2. Implement key generation, hashing, lookup, and revocation.
3. Implement encrypted integration credential persistence.
4. Implement authentication handler and tenant context middleware.
5. Add admin endpoint authorization.
6. Add audit events for provisioning and credential lifecycle.
7. Test expiry, revocation, wrong-tenant access, and rotation.

## Unit and integration tests
Authentication handler tests, KDF/secret-protection tests, endpoint authorization tests, tenant isolation tests, and PostgreSQL persistence tests.

## Acceptance criteria
A valid key authenticates only its environment/service scope, revoked/expired keys fail, credentials are never returned after creation, and every command carries tenant scope.

## Definition of done
Credentials and tenant context are safe inputs for ingestion, routing, and provider calls.

## Dependencies on other plan files
Prerequisites: 02, 03. Enables 05, 09, 10-18.

## Explicit non-goals
SSO, OAuth customer login, SCIM, billing, cross-organization sharing, and secret-manager vendor integration beyond an abstraction.
