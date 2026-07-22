# Privacy expectations

Recoil River will treat saved material as private by default. A user must choose to save a page before the product stores it or starts enrichment. The Chrome extension must not observe browsing history.

Convex will scope bookmarks, extracted content, derived insights, graph edges, suggestions, and activity events to the authenticated user. Website and extension clients must not receive Firecrawl, OpenRouter, Exa, or Convex deployment credentials. Convex environment variables will hold those secrets.

The product will need a documented export path and deletion behavior for user data. A deletion design must specify the fate of bookmarks, extracted documents, summaries, embeddings, graph edges, suggestions, and activity events. This foundation records those expectations; it does not provide export or deletion controls.

The product will disclose third-party processing before users submit a page. Firecrawl will extract eligible public pages, OpenRouter will produce structured summaries and embeddings, and Exa may find related or unseen pages after enough user history exists. The implementation must honor source exclusions, access restrictions, and provider terms. It must not claim permission to process content that the source or user has excluded.

The product must publish retention, deletion timing, and support-contact details before a public launch. Those policies need legal and operational review.
