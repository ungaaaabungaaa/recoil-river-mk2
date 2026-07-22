# Data model

The later Convex schema will separate a user-owned bookmark from the work that enriches it. That split protects a completed save from provider failures.

## Core records

| Record | Ownership | Purpose | Key fields |
| --- | --- | --- | --- |
| Bookmark | One authenticated user | A manual save of a source page | URL, canonical URL, title snapshot, source metadata, created time, visibility |
| Enrichment job | One bookmark and user | Durable processing state | status, attempt count, provider route, error summary, scheduled time |
| Extracted document | One bookmark and user | Normalized public-page content | text, content hash, extraction source, fetched time |
| Derived insight | One bookmark and user | Structured summary and embedding output | summary fields, embedding reference, model route, generated time |
| Graph edge | One user | A relationship between two user-visible nodes | source bookmark, target bookmark, relationship type, confidence source |
| Suggestion | One user | A related or unseen page candidate | URL, rationale, source, status |
| Activity event | One user | Append-only account history | event type, bookmark reference, occurred time, payload summary |

## Constraints

Bookmark records store the user identifier and every derived record carries a path back to that bookmark or user. Queries must reject records outside the current user scope. A deletion flow must remove or disconnect derived records according to the finalized retention policy.

The initial visibility model is private. No shared-library record belongs in the MVP schema without a separate product decision.

## State relationships

A bookmark begins in a saved state. Its enrichment job may move through queued, running, succeeded, failed, or retryable states. The bookmark remains readable in each job state. Derived records appear only after their producing step succeeds.

This document names future records and constraints. It does not define a Convex schema or retention implementation.
