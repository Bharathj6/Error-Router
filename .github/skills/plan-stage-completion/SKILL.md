---
name: plan-stage-completion
description: 'Complete one approved ErrorRouter plan stage from implementation through validation and documentation. Use when an implementation agent has finished a specific plan, when resuming the next staged MVP module, or when recording plan completion and remaining risks.'
argument-hint: 'Specify the plan number or file to implement and validate.'
user-invocable: true
---

# ErrorRouter Plan Stage Completion

## Purpose

Turn one approved file from `plan/` into a verified repository milestone without drifting into later stages. Keep the implementation, product overview, tests, and handoff evidence aligned.

## When to Use

- An implementation agent is asked to complete a specific plan stage.
- A completed stage needs validation and documentation.
- Work is resuming at the next plan in the dependency sequence.
- The repository needs a concise record of what is implemented and what remains.

## Procedure

1. **Resolve the stage**
   - Identify the requested plan file and read `plan/00-mvp-overview.md` plus the target plan.
   - Confirm prerequisites are complete before changing code.
   - If no specific stage is named, ask which plan should be implemented rather than choosing a scope silently.

2. **Inspect the local implementation**
   - Read the nearest existing projects, interfaces, tests, and documentation related to the target plan.
   - Check the dependency direction and existing conventions before adding abstractions.
   - State one falsifiable implementation hypothesis and one focused check that could disprove it.

3. **Implement only the approved stage**
   - Follow the target plan's scope, sequence, acceptance criteria, and explicit non-goals.
   - Preserve tenant isolation, redaction boundaries, PostgreSQL durability, Redis limits, provider abstraction, and durable job patterns whenever they apply.
   - Add or update focused tests for the stage's contracts and security or concurrency risks.
   - Record assumptions when the plan leaves a detail unspecified.

4. **Validate narrowly, then broadly**
   - After each meaningful edit, run the cheapest relevant build, test, lint, or endpoint check.
   - Run the target project tests first, then the solution-level build/test when the stage is complete.
   - Fix failures in the touched slice before expanding validation; do not mask unrelated failures.

5. **Update repository documentation**
   - Update `.github/agents/ImplementationOverview/product overview.md` with the stage's implemented behavior, architecture impact, and validation status.
   - Keep the plan sequence and next-stage dependency accurate.
   - Add or update learning notes only when they explain a material design decision or tradeoff.

6. **Produce the handoff**
   - State the plan implemented and its status.
   - List changed files and the focused validation commands with results.
   - Call out open risks, assumptions, skipped integrations, and the next eligible plan.

## Completion Criteria

A stage is complete only when:

- Its prerequisites and scope are explicit.
- The implementation matches the approved plan and its non-goals.
- Relevant tests pass and the solution remains buildable.
- Security, tenancy, redaction, durability, and provider boundaries are preserved where applicable.
- The product overview reflects the implementation instead of describing planned work as complete.
- Remaining risks and the next dependency-ordered stage are documented.

## Example Prompts

- `Complete plan 02 domain model and validate the affected projects.`
- `Resume the next ErrorRouter plan stage after the foundation milestone.`
- `Record plan 05 ingestion contracts as implemented and update the product overview.`
