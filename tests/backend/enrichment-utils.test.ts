import { describe, expect, it } from "vitest";

import {
  buildConnectionReasons,
  classifyProviderFailure,
  getRetryDelayMs,
  selectStrongestConnections,
  truncateUtf8,
  validateInsight,
} from "../../convex/lib/enrichment";

describe("enrichment utilities", () => {
  it("caps stored text by UTF-8 bytes without splitting a character", () => {
    const result = truncateUtf8("river 🌊 knowledge", 10);

    expect(new TextEncoder().encode(result.value).byteLength).toBeLessThanOrEqual(
      10,
    );
    expect(result).toEqual({ value: "river 🌊", truncated: true });
  });

  it("validates and normalizes strict semantic output", () => {
    expect(
      validateInsight({
        summary: "  A concise river of ideas.  ",
        topics: [
          " Knowledge Graphs ",
          "AI",
          "knowledge graphs",
          "Research",
        ],
        entities: [" Obsidian ", "OpenAI", "Obsidian"],
        language: " EN ",
      }),
    ).toEqual({
      summary: "A concise river of ideas.",
      topics: ["knowledge graphs", "ai", "research"],
      entities: ["Obsidian", "OpenAI"],
      language: "en",
    });
  });

  it("rejects invalid model responses", () => {
    expect(() =>
      validateInsight({
        summary: "x".repeat(601),
        topics: ["one", "two", "three"],
        entities: [],
        language: "en",
      }),
    ).toThrow("summary");

    expect(() =>
      validateInsight({
        summary: "Valid",
        topics: ["only", "two"],
        entities: [],
        language: "en",
      }),
    ).toThrow("topics");
  });

  it("retries only transient provider failures", () => {
    expect(classifyProviderFailure({ status: 429 })).toBe("retryable");
    expect(classifyProviderFailure({ status: 503 })).toBe("retryable");
    expect(classifyProviderFailure({ name: "AbortError" })).toBe("retryable");
    expect(classifyProviderFailure({ name: "TimeoutError" })).toBe("retryable");
    expect(classifyProviderFailure({ status: 401 })).toBe("terminal");
    expect(classifyProviderFailure({ status: 451 })).toBe("terminal");
    expect(classifyProviderFailure({ invalidResponse: true })).toBe("terminal");
  });

  it("uses the explicit three-step retry schedule", () => {
    expect([1, 2, 3, 4].map(getRetryDelayMs)).toEqual([
      30_000,
      120_000,
      600_000,
      null,
    ]);
  });

  it("builds explainable reasons and keeps six qualifying edges", () => {
    expect(
      buildConnectionReasons(
        {
          domain: "example.com",
          topics: ["ai", "design"],
          entities: ["OpenAI"],
        },
        {
          domain: "example.com",
          topics: ["ai", "research"],
          entities: ["OpenAI", "Convex"],
        },
      ),
    ).toEqual(["topic:ai", "entity:OpenAI", "domain:example.com"]);

    const matches = Array.from({ length: 9 }, (_, index) => ({
      bookmarkId: `bookmark-${index}`,
      score: 0.9 - index * 0.025,
    }));

    expect(selectStrongestConnections(matches)).toEqual(matches.slice(0, 6));
    expect(
      selectStrongestConnections([
        { bookmarkId: "low", score: 0.7199 },
        { bookmarkId: "boundary", score: 0.72 },
      ]),
    ).toEqual([{ bookmarkId: "boundary", score: 0.72 }]);
  });
});
