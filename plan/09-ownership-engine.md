# 09 - Ownership Engine

## Purpose
Resolve an explainable owner using the PRD’s deterministic fallback hierarchy.

## PRD requirements covered
FR-06: path rules -> CODEOWNERS -> service mapping -> module mapping -> recent author -> team default -> team queue -> manager escalation.

## Prerequisites
02-domain-model and 03-database-and-ef-core.

## Scope
Tenant-scoped ownership rules, ordered matching, specificity, disabled rules, fallback decisions, and audit/explanation output. MVP rule data is managed configuration; repository synchronization is not assumed.

## Proposed project and folder locations
`Application/Ownership`, `Domain/Ownership`, `Infrastructure/Persistence/Ownership`; optional admin endpoints under `Api/Endpoints/Ownership`.

## Classes, interfaces, entities, and endpoints
`IOwnershipResolver`, `OwnershipResolver`, `OwnershipContext`, `OwnershipDecision`, `OwnershipMatch`, `IOwnershipRuleRepository`; `GET/PUT /v1/services/{id}/ownership-rules` for authorized configuration.

## Database changes and migrations
Ownership rules with organization/service scope, kind, pattern, team/user/queue targets, priority, enabled flag, timestamps, and unique rule identity. Index by tenant/service/kind/enabled.

## Configuration requirements
Case sensitivity, path normalization, maximum rule count, manager escalation policy, and behavior when no owner exists.

## Security considerations
Only authorized tenant administrators edit rules; never infer or expose users across organizations; audit every change; prevent regex/path traversal abuse.

## Detailed implementation steps in exact order
1. Define ownership input fields and decision schema.
2. Implement each matcher as a pure strategy.
3. Enforce the exact fallback order and deterministic tie-breaker.
4. Persist and load tenant-scoped rules.
5. Return match explanation and unresolved-owner state.
6. Integrate resolver into routing job handler.
7. Add configuration endpoint if MVP provisioning requires it.

## Unit and integration tests
One test per hierarchy level, precedence/tie cases, no-match escalation, disabled rules, tenant isolation, malformed pattern, and deterministic output tests.

## Acceptance criteria
The first matching rule in the required hierarchy wins; fallback is deterministic and explainable; no owner is silently invented.

## Definition of done
Ownership decisions can be persisted with routing/audit context and are safe under concurrent rule updates.

## Dependencies on other plan files
Prerequisites: 02, 03. Enables 13 and 18.

## Explicit non-goals
AI ownership, irreversible auto-assignment, live Git hosting synchronization, or ownership UI.
