const TRACKING_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]);

export type NormalizedBookmarkUrl = {
  canonicalUrl: string;
  domain: string;
  originalUrl: string;
};

export function normalizeBookmarkUrl(input: string): NormalizedBookmarkUrl {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Bookmarks must use a valid HTTP or HTTPS URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Bookmarks must use an HTTP or HTTPS URL.");
  }

  url.username = "";
  url.password = "";
  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.startsWith("utm_") || TRACKING_KEYS.has(normalizedKey)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  return {
    canonicalUrl: url.toString(),
    domain: url.hostname,
    originalUrl: input,
  };
}
