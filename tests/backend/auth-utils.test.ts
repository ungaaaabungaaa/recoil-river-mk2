import { describe, expect, it } from "vitest";

import {
  normalizeEmail,
  validatePassword,
} from "../../convex/lib/auth";

describe("authentication input rules", () => {
  it("normalizes email addresses before account lookup", () => {
    expect(normalizeEmail("  River.User@Example.COM ")).toBe(
      "river.user@example.com",
    );
  });

  it("rejects malformed email addresses", () => {
    expect(() => normalizeEmail("not-an-email")).toThrow("valid email");
  });

  it("requires passwords to contain at least eight characters", () => {
    expect(() => validatePassword("short7")).toThrow("at least 8");
    expect(validatePassword("river-88")).toBe("river-88");
  });
});
