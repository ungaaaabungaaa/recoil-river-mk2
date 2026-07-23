import { describe, expect, it, vi } from "vitest";

import {
  createEmbedding,
  scrapeDocument,
  summarizeDocument,
} from "../../convex/lib/providers";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("provider adapters", () => {
  it("uses privacy-preserving Firecrawl v2 scrape options", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          markdown: "# A useful page",
          metadata: {
            title: "Useful",
            description: "A description",
            sourceURL: "https://example.com/useful",
          },
        },
      }),
    );

    const result = await scrapeDocument({
      apiKey: "firecrawl-test-key",
      fetcher,
      url: "https://example.com/useful",
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const [endpoint, init] = fetcher.mock.calls[0]!;
    expect(endpoint).toBe("https://api.firecrawl.dev/v2/scrape");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer firecrawl-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      url: "https://example.com/useful",
      formats: ["markdown"],
      onlyMainContent: true,
      maxAge: 0,
      storeInCache: false,
      zeroDataRetention: true,
      removeBase64Images: true,
      blockAds: true,
      timeout: 60_000,
    });
    expect(result.markdown).toBe("# A useful page");
  });

  it("requests strict private structured output through OpenRouter", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "A useful summary.",
                topics: ["knowledge", "research", "design"],
                entities: ["Convex"],
                language: "en",
              }),
            },
          },
        ],
      }),
    );

    const insight = await summarizeDocument({
      apiKey: "openrouter-test-key",
      content: "# Useful\nA source sample.",
      fetcher,
      metadata: { description: "Description" },
      model: "openai/gpt-5-mini",
      title: "Useful",
    });

    const [, init] = fetcher.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "openai/gpt-5-mini",
      provider: { zdr: true, data_collection: "deny" },
      response_format: {
        type: "json_schema",
        json_schema: { name: "bookmark_insight", strict: true },
      },
    });
    expect(
      body.response_format.json_schema.schema.additionalProperties,
    ).toBe(false);
    expect(insight.topics).toEqual(["knowledge", "research", "design"]);
  });

  it("validates a private 1536-dimension OpenRouter embedding", async () => {
    const vector = Array.from({ length: 1536 }, (_, index) => index / 1536);
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: [{ embedding: vector }] }));

    expect(
      await createEmbedding({
        apiKey: "openrouter-test-key",
        fetcher,
        input: "A useful summary.",
        model: "openai/text-embedding-3-small",
      }),
    ).toEqual(vector);

    const [, init] = fetcher.mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "openai/text-embedding-3-small",
      provider: { zdr: true, data_collection: "deny" },
    });
  });

  it("fails closed on invalid provider responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: [{ embedding: [1, 2, 3] }] }));

    await expect(
      createEmbedding({
        apiKey: "test",
        fetcher,
        input: "text",
        model: "embedding-model",
      }),
    ).rejects.toMatchObject({ invalidResponse: true });
  });

  it("preserves timeout failures for retry classification", async () => {
    const timeout = new DOMException(
      "The operation was aborted due to timeout",
      "TimeoutError",
    );
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(timeout);

    await expect(
      scrapeDocument({
        apiKey: "test",
        fetcher,
        url: "https://example.com/slow",
      }),
    ).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
