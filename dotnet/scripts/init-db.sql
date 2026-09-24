-- Universal Production Error Platform - PostgreSQL 16 Initial Schema
-- PRD Section 4 Core Schema Specifications

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'production',
    repository_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_service_org_env_name UNIQUE(organization_id, name, environment)
);

-- Ticketing Integrations
CREATE TABLE IF NOT EXISTS ticketing_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL, -- 'Jira', 'AzureDevOps'
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Error Groups (PRD Section 4)
CREATE TABLE IF NOT EXISTS error_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    fingerprint CHAR(64) NOT NULL,
    exception_type VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    occurrence_count INT NOT NULL DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_fingerprint UNIQUE(organization_id, fingerprint)
);

-- Error Occurrences (PRD Section 4)
CREATE TABLE IF NOT EXISTS error_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_group_id UUID NOT NULL REFERENCES error_groups(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stack_trace TEXT NOT NULL,
    request_context JSONB,
    version VARCHAR(100),
    correlation_id VARCHAR(255)
);

-- Ticket Links (PRD Section 4)
CREATE TABLE IF NOT EXISTS ticket_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_group_id UUID NOT NULL REFERENCES error_groups(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES ticketing_integrations(id) ON DELETE RESTRICT,
    external_ticket_id VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_error_group_integration UNIQUE(error_group_id, integration_id)
);

-- Dead Letter Queue for failed dispatches (FR-08)
CREATE TABLE IF NOT EXISTS dead_letter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_group_id UUID REFERENCES error_groups(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES ticketing_integrations(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indices (Section 4 & FR-05)
CREATE INDEX IF NOT EXISTS idx_error_groups_org_fingerprint ON error_groups(organization_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_groups_status ON error_groups(status);
CREATE INDEX IF NOT EXISTS idx_error_groups_last_seen ON error_groups(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_error_occurrences_group_time ON error_occurrences(error_group_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_links_group ON ticket_links(error_group_id);
