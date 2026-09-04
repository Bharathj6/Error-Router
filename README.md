# ErrorRouter

> An automated production-error-to-engineering workflow platform that
> detects, groups, enriches, identifies ownership for, and routes
> production failures into an organization’s existing engineering
> workflow.

## Overview

ErrorRouter sits between production observability systems and
engineering workflow/ticketing systems.

It does **not** replace Sentry, Exceptionless, OpenTelemetry, or
application logging platforms. Instead, it automates what happens after
a production error is detected:

``` text
Production Error
      ↓
Detect / Ingest
      ↓
Normalize & Fingerprint
      ↓
Group Duplicate Occurrences
      ↓
Enrich With Context
      ↓
Identify Team / Engineer / Manager
      ↓
Apply Organization Routing Rules
      ↓
Create / Update Ticket
      ↓
Track Ticket Lifecycle
      ↓
Verify Resolution After Deployment
```

The platform is **ticketing-provider agnostic**. Organizations can use
Jira, Azure DevOps, GitHub Issues, Linear, ServiceNow, or an internal
ticketing system without changing the core workflow engine.

------------------------------------------------------------------------

## Problem

Production exceptions create significant operational overhead:

- Thousands of duplicate exceptions may represent one underlying bug.
- Developers manually investigate logs to determine ownership.
- Production errors may have no clear team owner.
- Engineers manually create tickets from monitoring tools.
- Tickets often lack useful debugging context.
- Different teams use different ticketing platforms.
- Ticket status and production error status can become disconnected.
- Sensitive production information can accidentally reach external
  systems.

## Solution

ErrorRouter turns production errors into actionable engineering work.

### Core capabilities

1.  Error ingestion
2.  Error normalization
3.  Fingerprinting
4.  Duplicate grouping
5.  Occurrence aggregation
6.  Production context enrichment
7.  Ownership resolution
8.  Organization-specific routing
9.  Automatic ticket creation
10. Ticket deduplication
11. Ticket lifecycle synchronization
12. Retry and dead-letter handling
13. PII/secret redaction
14. Audit logging
15. Deployment and commit correlation
16. Notifications
17. Optional AI-assisted analysis

------------------------------------------------------------------------

# Architecture

``` text
                         Production Applications
                         / Sentry / Exceptionless /
                         OpenTelemetry / Log Sources
                                    |
                                    v
                              API Gateway
                           Auth / Tenant / Rate Limit
                                    |
                                    v
                              Ingestion API
                                    |
                                    v
                              Message Broker
                                    |
             +----------------------+----------------------+
             |                      |                      |
             v                      v                      v
       Error Processor        Enrichment Worker       Ownership Engine
       Normalize              Deployment Context      Team / Engineer
       Fingerprint            Repository / Commit      Manager
       Group                  Endpoint / Impact        Confidence
             |                      |                      |
             +----------------------+----------------------+
                                    |
                                    v
                              Workflow Engine
                                    |
                                    v
                          Ticketing Abstraction
                                    |
          +-------------+------------+------------+-------------+
          |             |            |            |             |
         Jira          ADO        GitHub       Linear      ServiceNow
```

## Architectural principles

- Provider agnostic
- Multi-tenant
- Event-driven
- Asynchronous processing
- Idempotent
- Horizontally scalable
- Configuration driven
- Secure by default
- Observable
- Failure tolerant

------------------------------------------------------------------------

# Main Components

## 1. API Gateway

Responsibilities:

- Authentication
- Tenant identification
- Authorization
- Rate limiting
- Request validation
- Correlation ID generation
- Routing

## 2. Ingestion API

Receives production error events and should acknowledge quickly after
durable acceptance.

``` http
POST /api/v1/events
```

Example event:

``` json
{
  "source": "sentry",
  "sourceEventId": "evt_12345",
  "service": "order-service",
  "environment": "production",
  "version": "2.4.1",
  "exception": {
    "type": "NullReferenceException",
    "message": "Object reference not set..."
  },
  "stackTrace": "...",
  "route": "POST /api/orders/{id}",
  "timestamp": "2026-09-04T10:15:00Z",
  "correlationId": "abc-123"
}
```

## 3. Error Processor

Responsible for:

- Normalization
- Stack-trace normalization
- Fingerprint generation
- Error grouping
- Occurrence counting
- Deduplication

Suggested fingerprint:

``` text
SHA256(
    exceptionType
    + normalizedTopStackFrames
    + serviceName
    + routeTemplate
)
```

Do not blindly include raw exception messages because dynamic IDs,
timestamps, or user data can make the same bug appear as different
errors.

## 4. Enrichment Worker

Adds:

- Service
- Application
- Environment
- Version
- Endpoint
- Deployment
- Commit
- Repository
- Recent deployment time
- Affected users/tenants
- Occurrence count
- First/last seen
- Correlation ID

## 5. Ownership Engine

Suggested resolution order:

``` text
1. Exact service + code path rule
2. CODEOWNERS / repository ownership
3. Service → Team mapping
4. Module / path → Team mapping
5. Recent code ownership / commit history
6. Team default engineer
7. Team queue
8. Manager escalation
```

Example result:

``` json
{
  "team": "Payments",
  "primaryEngineer": "alice",
  "manager": "bob",
  "confidence": 0.72,
  "matchedRule": "payments-service-owner"
}
```

The system should prefer confidence-based recommendations over blindly
assigning an issue to the last developer who changed the code.

## 6. Workflow Engine

Controls the lifecycle:

``` text
New
 ↓
Triaged
 ↓
Assigned
 ↓
Ticket Created
 ↓
In Progress
 ↓
Resolved
 ↓
Deployment Detected
 ↓
Verification
 ↓
Closed
```

Possible automated actions:

- Create ticket
- Update existing ticket
- Reopen ticket
- Change priority
- Assign owner
- Escalate
- Notify team
- Verify after deployment

------------------------------------------------------------------------

# Ticketing Provider Abstraction

The core platform must not contain Jira-specific or Azure
DevOps-specific business logic.

``` csharp
public interface ITicketingProvider
{
    Task<TicketResult> CreateTicketAsync(TicketRequest request);

    Task UpdateTicketAsync(
        string ticketId,
        TicketUpdate request);

    Task AssignTicketAsync(
        string ticketId,
        string assignee);

    Task UpdateStatusAsync(
        string ticketId,
        TicketStatus status);

    Task<TicketDetails> GetTicketAsync(
        string ticketId);
}
```

Possible implementations:

``` text
Ticketing.Abstractions
Ticketing.Jira
Ticketing.AzureDevOps
Ticketing.GitHub
Ticketing.Linear
Ticketing.ServiceNow
Ticketing.Custom
```

Example organization configuration:

``` text
Organization A → Jira
Organization B → Azure DevOps
Organization C → GitHub Issues
Organization D → Linear
Organization E → ServiceNow
Organization F → Internal API
```

A single organization may also route different applications to different
providers.

------------------------------------------------------------------------

# Routing

Routing should be configuration driven:

``` text
Organization
    ↓
Application
    ↓
Environment
    ↓
Team
    ↓
Ticketing Integration
    ↓
Project / Repository / Queue
```

The most specific matching rule should win.

------------------------------------------------------------------------

# Error Grouping

Suppose one bug generates 20,000 occurrences.

ErrorRouter should create:

``` text
Error Group #1001
Occurrences: 20,000
```

rather than 20,000 tickets.

Example:

``` text
Error: NullReferenceException
Service: Order Service
Environment: Production

Occurrences: 20,431
Affected Users: 4,821
First Seen: 09:10
Last Seen: 10:15

Owner:
  Team: Orders
  Engineer: Alice
  Confidence: 72%

Ticket:
  PAY-1245
```

------------------------------------------------------------------------

# Idempotency

Duplicate events must not create duplicate tickets.

Suggested ingestion idempotency key:

``` text
organizationId + sourceEventId
```

Database constraint:

``` text
UNIQUE(organization_id, source_event_id)
```

Suggested ticket workflow key:

``` text
organizationId
+ errorGroupId
+ providerIntegrationId
```

This protects against duplicate webhook delivery, worker retries,
network failures, consumer restarts, and concurrent processing.

------------------------------------------------------------------------

# Retry and Dead Letter Queue

Example retry strategy:

``` text
Attempt 1 → Immediate
Attempt 2 → 10 seconds
Attempt 3 → 30 seconds
Attempt 4 → 2 minutes
Attempt 5 → 10 minutes
                  ↓
                 DLQ
```

Use exponential backoff and jitter.

Do not blindly retry permanent failures such as invalid authentication
or malformed requests.

DLQ records should include:

- Event ID
- Organization
- Error group
- Provider
- Failure reason
- Retry count
- Last attempted time
- Correlation ID

Administrators should be able to inspect and reprocess failed events.

------------------------------------------------------------------------

# Security

Production errors can contain sensitive information.

The platform should support:

- PII redaction
- Secret/token detection
- Password masking
- Authorization header removal
- Configurable sensitive-field rules
- Encryption at rest
- Encryption in transit
- Tenant isolation
- RBAC
- Audit logs
- Secure credential storage

Example:

``` text
Authorization: Bearer eyJ...
```

becomes:

``` text
Authorization: [REDACTED]
```

before data is stored or sent to an external ticketing system.

------------------------------------------------------------------------

# Multi-Tenancy

Every business-level entity should be associated with an
organization/tenant.

``` text
Organization
 ├── Users
 ├── Teams
 ├── Applications
 ├── Services
 ├── Ownership Rules
 ├── Routing Rules
 ├── Ticket Integrations
 └── Error Groups
```

Tenant isolation should be enforced at:

- API layer
- Service layer
- Database queries
- Background workers
- Cache keys
- Authorization checks

------------------------------------------------------------------------

# Database Model

Suggested PostgreSQL tables:

``` text
organizations
users
teams
team_members
applications
services
environments
ownership_rules
ticketing_integrations
routing_bindings
error_groups
error_occurrences
ownership_decisions
ticket_links
deployments
audit_logs
```

------------------------------------------------------------------------

# API Design

### Event ingestion

``` http
POST /api/v1/events
```

### Error groups

``` http
GET /api/v1/errors
GET /api/v1/errors/{id}
POST /api/v1/errors/{id}/reprocess
```

### Ownership

``` http
GET /api/v1/errors/{id}/ownership
POST /api/v1/ownership/rules
```

### Integrations

``` http
GET /api/v1/integrations
POST /api/v1/integrations
POST /api/v1/integrations/{id}/test
```

### Tickets

``` http
GET /api/v1/tickets/{errorGroupId}
POST /api/v1/tickets/{errorGroupId}/retry
```

### Provider webhooks

``` http
POST /api/v1/webhooks/{provider}
```

------------------------------------------------------------------------

# Example Generated Ticket

``` text
Title:
[Production] NullReferenceException in OrderService.CreateOrder

Priority:
High

Service:
OrderService

Environment:
Production

Version:
2.4.1

Endpoint:
POST /api/orders/{id}

Occurrences:
20,431

Affected Users:
4,821

First Seen:
2026-09-04 09:10 UTC

Last Seen:
2026-09-04 10:15 UTC

Owner:
Orders Team

Recommended Engineer:
Alice

Confidence:
72%

Related Deployment:
order-service 2.4.1

Possible Commit:
8f31a2c

Correlation ID:
abc-123

Stack Trace:
...

Suggested Action:
Investigate null order customer mapping introduced in the latest deployment.
```

------------------------------------------------------------------------

# End-to-End Flow

``` text
1. Application throws exception
        ↓
2. Sentry / OpenTelemetry / SDK captures event
        ↓
3. Event sent to ErrorRouter
        ↓
4. Ingestion API validates request
        ↓
5. Event becomes durable message
        ↓
6. Error Processor normalizes event
        ↓
7. Fingerprint generated
        ↓
8. Existing error group searched
        ↓
9. New group created OR occurrence incremented
        ↓
10. Context enrichment performed
        ↓
11. Ownership Engine determines team/engineer
        ↓
12. Routing Engine determines ticket provider
        ↓
13. Workflow checks for existing ticket
        ↓
14. Ticket created or updated
        ↓
15. Notification sent
        ↓
16. Ticket status synchronized
        ↓
17. Deployment detected
        ↓
18. Error occurrence monitored after deployment
        ↓
19. Issue verified and closed
```

------------------------------------------------------------------------

# Repository Structure

``` text
error-router/
├── src/
│   ├── Gateway/
│   ├── Ingestion.Api/
│   ├── ErrorProcessor/
│   ├── Enrichment.Worker/
│   ├── Ownership.Engine/
│   ├── Workflow.Engine/
│   ├── Ticketing.Abstractions/
│   ├── Ticketing.Jira/
│   ├── Ticketing.AzureDevOps/
│   ├── Ticketing.GitHub/
│   ├── Ticketing.Linear/
│   ├── Notifications/
│   ├── Admin.Api/
│   └── Dashboard/
│
├── tests/
│   ├── Unit/
│   ├── Integration/
│   └── Contract/
│
├── deploy/
│   ├── docker/
│   └── kubernetes/
│
├── docs/
│   ├── HLD.md
│   ├── LLD.md
│   └── ADR/
│
└── README.md
```

------------------------------------------------------------------------

# Technology Stack

| Area              | Technology                           |
|-------------------|--------------------------------------|
| Backend           | ASP.NET Core / .NET                  |
| Database          | PostgreSQL                           |
| Cache             | Redis                                |
| Messaging         | Kafka / RabbitMQ / Azure Service Bus |
| Frontend          | React + TypeScript                   |
| Authentication    | OAuth 2.0 / OIDC / JWT               |
| Observability     | OpenTelemetry                        |
| Containers        | Docker                               |
| Orchestration     | Kubernetes                           |
| CI/CD             | GitHub Actions / Azure DevOps        |
| Testing           | xUnit + Testcontainers               |
| API Documentation | OpenAPI / Swagger                    |

Start simple with PostgreSQL and background processing, then introduce a
broker and Redis as the system evolves.

------------------------------------------------------------------------

# Development Roadmap

## Phase 1 — Foundation

- Solution structure
- Domain models
- PostgreSQL schema
- Ingestion API
- Event contract
- Authentication
- Correlation IDs

## Phase 2 — Error Intelligence

- Normalization
- Fingerprinting
- Error grouping
- Occurrence aggregation
- Deduplication
- Dashboard

## Phase 3 — Ownership

- Teams
- Team members
- Ownership rules
- Service ownership
- Repository ownership
- Confidence scoring

## Phase 4 — Ticket Automation

- Ticket abstraction
- First provider integration
- Ticket creation/update
- Ticket assignment
- Ticket deduplication

## Phase 5 — Multi-Provider

- Second provider
- Dynamic routing
- Provider configuration
- Provider health checks

## Phase 6 — Distributed Processing

- Message broker
- Background workers
- Retry
- DLQ
- Idempotency
- Redis

## Phase 7 — Production Features

- Ticket synchronization
- Notifications
- Deployment correlation
- Commit correlation
- RBAC
- Audit logs
- PII/secret redaction

## Phase 8 — Advanced Features

- Owner recommendation
- Root-cause assistance
- Blast-radius analysis
- Anomaly detection
- AI-generated summaries

------------------------------------------------------------------------

# MVP

The first usable version:

``` text
.NET SDK / Test Producer
        ↓
Ingestion API
        ↓
PostgreSQL
        ↓
Fingerprinting
        ↓
Error Grouping
        ↓
Ownership Rules
        ↓
Ticketing Abstraction
        ↓
Provider #1
        ↓
Provider #2
        ↓
Dashboard
```

### MVP acceptance criteria

- Receive production error events.
- Generate stable fingerprints.
- Group duplicate exceptions.
- Track occurrence counts.
- Configure teams and ownership rules.
- Resolve a responsible team/engineer.
- Configure at least two ticketing providers.
- Create a ticket automatically.
- Prevent duplicate tickets.
- Show useful error context.
- Handle provider failures safely.
- Keep organization data isolated.

------------------------------------------------------------------------

# Future Differentiators

## Deployment correlation

``` text
Error spike
    ↓
Recent deployment
    ↓
Version comparison
    ↓
Related service
    ↓
Potential responsible change
```

## Blast-radius analysis

``` text
Affected:
4,821 users
17 tenants
3 API endpoints
2 regions
```

## Owner recommendation

``` text
Recommended owner: Alice

Confidence: 82%

Reasons:
- Owns OrderService
- Recent changes to affected module
- Primary team member
```

## AI-assisted analysis

Potential capabilities:

- Generate incident summaries.
- Explain stack traces.
- Suggest likely root causes.
- Identify related deployments.
- Recommend owners.
- Suggest remediation steps.

AI should enhance the platform rather than become its foundation.

------------------------------------------------------------------------

# What This Project Is Not

ErrorRouter is not:

- A Sentry replacement
- A general-purpose logging platform
- A complete APM platform
- A Jira clone
- An AI-first debugging platform
- A replacement for an organization’s ticketing system

Its primary responsibility is:

> **Production error → Engineering ownership → Workflow automation**

------------------------------------------------------------------------

# Design Decisions

## Why not integrate only with Jira?

Organizations use different engineering workflow systems.

Therefore:

``` text
Core Workflow
      ↓
ITicketingProvider
      ↓
Provider Adapter
```

Provider-specific code stays isolated.

## Why asynchronous processing?

Production incidents can create extreme error bursts:

``` text
Normal:
100 events/minute

Incident:
100,000 events/minute
```

A message broker allows ingestion to remain responsive while workers
process the backlog.

## Why fingerprint errors?

Without grouping, one production bug can create thousands of tickets.

Fingerprinting converts:

``` text
20,000 occurrences
```

into:

``` text
1 actionable error group
```

## Why idempotency?

Distributed systems can process the same message more than once.

Idempotency ensures:

``` text
Same event
    ↓
Same logical result
```

instead of:

``` text
Same event
    ↓
Multiple tickets
```

------------------------------------------------------------------------

# Observability

Track metrics such as:

``` text
events_received_total
events_processed_total
events_failed_total
error_groups_created_total
duplicate_occurrences_total
tickets_created_total
tickets_updated_total
ticket_creation_failures_total
ownership_resolution_failures_total
processing_latency_ms
queue_depth
retry_count
dlq_count
```

Use:

- Structured logging
- Metrics
- Distributed tracing
- Correlation IDs
- OpenTelemetry

------------------------------------------------------------------------

# Testing Strategy

## Unit Tests

Test:

- Fingerprinting
- Normalization
- Ownership rules
- Routing resolution
- Retry policies
- Ticket mapping
- Redaction

## Integration Tests

Test:

``` text
API
 ↓
Database
 ↓
Message Broker
 ↓
Worker
 ↓
Ticket Provider
```

Use Testcontainers where appropriate.

## Contract Tests

Each ticket provider adapter should validate that the canonical ticket
model maps correctly to the provider API.

## Load Tests

Important scenarios:

- Large error bursts
- Duplicate event storms
- Provider outage
- Worker restart
- Broker backlog
- Concurrent ticket creation

------------------------------------------------------------------------

# Interview Value

This project demonstrates practical understanding of:

- Microservices
- Event-driven architecture
- Distributed systems
- Multi-tenancy
- PostgreSQL
- Redis
- Message brokers
- Idempotency
- Retry and DLQ
- API design
- Authentication and authorization
- Provider abstraction
- Design patterns
- Fault tolerance
- Observability
- Kubernetes
- CI/CD
- Security
- Production debugging workflows

The strongest architectural explanation is:

> “I designed a provider-agnostic workflow engine that converts
> production failures into deduplicated, enriched, ownership-aware
> engineering work while remaining resilient to duplicate events,
> provider failures, and traffic spikes.”

------------------------------------------------------------------------

# Long-Term Vision

``` text
             Production Systems
                    |
                    v
              Error Detection
                    |
                    v
              ErrorRouter
                    |
       +------------+------------+
       |            |            |
       v            v            v
   Ownership    Enrichment    Correlation
       |            |            |
       +------------+------------+
                    |
                    v
              Workflow Engine
                    |
       +------------+------------+
       |            |            |
       v            v            v
    Ticket       Notify       Escalate
       |
       v
   Resolution
       |
       v
 Deployment Verification
```

The long-term goal is to make the journey from **production failure to
engineering action** as automated and reliable as possible.

------------------------------------------------------------------------

## License

Choose an appropriate open-source or personal-project license before
publishing the repository.

## Status

🚧 **Active Development**
