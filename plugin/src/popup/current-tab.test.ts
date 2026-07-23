import { describe, expect, it, vi } from "vitest";

import {
  captureCurrentTab,
  isSupportedPageUrl,
} from "./current-tab";

describe("current tab capture", () => {
  it("reads URL, title, and favicon through activeTab", async () => {
    const query = vi.fn().mockResolvedValue([
      {
        url: "https://example.com/article",
        title: "An article",
        favIconUrl: "https://example.com/favicon.ico",
      },
    ]);

    await expect(captureCurrentTab({ query })).resolves.toEqual({
      url: "https://example.com/article",
      title: "An article",
      faviconUrl: "https://example.com/favicon.ico",
      supported: true,
    });
    expect(query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
  });

  it.each([
    "chrome://extensions",
    "chrome-extension://abc/popup.html",
    "edge://settings",
    "file:///tmp/note.md",
    "about:blank",
    "",
  ])("marks %s as unsupported", (url) => {
    expect(isSupportedPageUrl(url)).toBe(false);
  });

  it("handles a restricted tab without leaking an exception", async () => {
    const query = vi.fn().mockRejectedValue(new Error("Permission denied"));

    await expect(captureCurrentTab({ query })).resolves.toEqual({
      supported: false,
      title: "",
      url: "",
    });
  });
});
