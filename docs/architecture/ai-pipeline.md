# AI pipeline

## Route selection

After Convex stores a manual bookmark, it schedules a durable enrichment job. The job selects Firecrawl as the primary extractor for eligible public pages. It stores the extracted result and content identity before it asks OpenRouter for a structured summary and embedding.

The system must select one extractor route for a URL by default. It must not send the same page to two scraping providers without an explicit recovery policy and a recorded reason.

Exa is a later discovery provider. Once a user has enough saved history, Convex can use saved-page signals to ask Exa for related or unseen pages. Exa suggestions remain separate from bookmarks until the user saves one.

## Durable states

```text
saved -> queued -> extracting -> summarizing -> indexed
                   |              |
                   v              v
             retryable or failed  retryable or failed
```

The bookmark exists before `queued`. A failed state keeps the bookmark available. A retry increments job metadata and reuses the correct user scope. The system records provider and error context that operators need to diagnose the failed step without putting secrets in client responses.

## Structured output

OpenRouter should return fields that the library and graph can use: concise summary, topical labels, entities when present, source-language metadata, and an embedding or embedding reference. Future implementation must validate the response shape before storing it.

## Credentials and disclosure

Convex environment variables hold provider keys. Website and extension clients never receive those keys or Convex deployment credentials. Product copy and privacy material must identify the providers used for extraction, summarization, embeddings, and discovery before users submit content.

This document defines the intended pipeline. It does not activate provider calls or claim extraction quality.
