import { describe, expect, it } from "vitest";

import { normalizeBookmarkUrl } from "../../convex/lib/urls";

describe("normalizeBookmarkUrl", () => {
  it("canonicalizes a public URL and removes tracking data", () => {
    expect(
      normalizeBookmarkUrl(
        "HTTPS://reader:secret@Example.COM:443/articles/one?utm_source=newsletter&b=2&fbclid=abc&a=1#notes",
      ),
    ).toEqual({
      canonicalUrl: "https://example.com/articles/one?a=1&b=2",
      domain: "example.com",
      originalUrl:
        "HTTPS://reader:secret@Example.COM:443/articles/one?utm_source=newsletter&b=2&fbclid=abc&a=1#notes",
    });
  });

  it("removes every specified tracker case-insensitively", () => {
    const normalized = normalizeBookmarkUrl(
      "https://example.com/?UTM_campaign=x&gclid=y&mc_cid=z&mc_eid=a&keep=yes",
    );

    expect(normalized.canonicalUrl).toBe("https://example.com/?keep=yes");
  });

  it("preserves meaningful paths, queries, and non-default ports", () => {
    expect(
      normalizeBookmarkUrl(
        "http://EXAMPLE.com:8080/search?q=second+brain&lang=en",
      ).canonicalUrl,
    ).toBe("http://example.com:8080/search?lang=en&q=second+brain");
  });

  it.each([
    "chrome://extensions",
    "file:///tmp/private.txt",
    "ftp://example.com/file",
    "javascript:alert(1)",
    "not a url",
  ])("rejects unsupported input: %s", (url) => {
    expect(() => normalizeBookmarkUrl(url)).toThrow("HTTP");
  });
});
