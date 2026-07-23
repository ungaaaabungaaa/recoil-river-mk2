export const MAX_MARKDOWN_BYTES = 500_000;
export const GRAPH_SCORE_THRESHOLD = 0.72;
export const MAX_EDGES_PER_NODE = 6;

const RETRY_DELAYS_MS = [30_000, 120_000, 600_000] as const;

export type Insight = {
  summary: string;
  topics: string[];
  entities: string[];
  language: string;
};

export type ConnectionInput = {
  domain: string;
  topics: string[];
  entities: string[];
};

export type VectorMatch<TBookmarkId = string> = {
  bookmarkId: TBookmarkId;
  score: number;
};

type ProviderFailure = {
  invalidResponse?: boolean;
  name?: string;
  status?: number;
};

export function truncateUtf8(
  value: string,
  maximumBytes = MAX_MARKDOWN_BYTES,
): { value: string; truncated: boolean } {
  const encoder = new TextEncoder();
  if (encoder.encode(value).byteLength <= maximumBytes) {
    return { value, truncated: false };
  }

  let result = "";
  let byteLength = 0;
  for (const character of value) {
    const characterBytes = encoder.encode(character).byteLength;
    if (byteLength + characterBytes > maximumBytes) {
      break;
    }
    result += character;
    byteLength += characterBytes;
  }

  return { value: result.trimEnd(), truncated: true };
}

function normalizedStrings(
  value: unknown,
  transform: (item: string) => string,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected a list of strings.");
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      throw new Error("Expected a list of strings.");
    }
    const normalized = transform(item.replace(/\s+/g, " ").trim());
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }
  return result;
}

export function validateInsight(value: unknown): Insight {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The provider returned an invalid insight.");
  }

  const record = value as Record<string, unknown>;
  const summary =
    typeof record.summary === "string"
      ? record.summary.replace(/\s+/g, " ").trim()
      : "";
  if (!summary || summary.length > 600) {
    throw new Error("Insight summary must contain 1 to 600 characters.");
  }

  const topics = normalizedStrings(record.topics, (item) =>
    item.toLowerCase(),
  );
  if (topics.length < 3 || topics.length > 8) {
    throw new Error("Insight topics must contain 3 to 8 unique values.");
  }

  const entities = normalizedStrings(record.entities, (item) => item);
  if (entities.length > 12) {
    throw new Error("Insight entities cannot contain more than 12 values.");
  }

  const language =
    typeof record.language === "string"
      ? record.language.trim().toLowerCase()
      : "";
  if (!language) {
    throw new Error("Insight language is required.");
  }

  return { summary, topics, entities, language };
}

export function classifyProviderFailure(
  failure: ProviderFailure,
): "retryable" | "terminal" {
  if (failure.invalidResponse) {
    return "terminal";
  }
  if (
    failure.name === "AbortError" ||
    failure.name === "TimeoutError" ||
    failure.status === 408 ||
    failure.status === 429 ||
    (typeof failure.status === "number" && failure.status >= 500)
  ) {
    return "retryable";
  }
  return "terminal";
}

export function getRetryDelayMs(attempt: number): number | null {
  return RETRY_DELAYS_MS[attempt - 1] ?? null;
}

export function buildConnectionReasons(
  left: ConnectionInput,
  right: ConnectionInput,
): string[] {
  const rightTopics = new Set(right.topics.map((item) => item.toLowerCase()));
  const rightEntities = new Set(
    right.entities.map((item) => item.toLowerCase()),
  );

  const reasons: string[] = [];
  for (const topic of left.topics) {
    if (rightTopics.has(topic.toLowerCase())) {
      reasons.push(`topic:${topic}`);
    }
  }
  for (const entity of left.entities) {
    if (rightEntities.has(entity.toLowerCase())) {
      reasons.push(`entity:${entity}`);
    }
  }
  if (left.domain === right.domain) {
    reasons.push(`domain:${left.domain}`);
  }
  return reasons;
}

export function selectStrongestConnections<
  TMatch extends VectorMatch<unknown>,
>(matches: TMatch[]): TMatch[] {
  return matches
    .filter((match) => match.score >= GRAPH_SCORE_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_EDGES_PER_NODE);
}
