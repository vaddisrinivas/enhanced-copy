import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_SETTINGS } from "./shared";

describe("extension settings", () => {
  it("defaults to explicit prompt copy only", () => {
    expect(DEFAULT_EXTENSION_SETTINGS.action).toBe("explain");
    expect(DEFAULT_EXTENSION_SETTINGS.rememberRecentPrompts).toBe(false);
    expect(DEFAULT_EXTENSION_SETTINGS.includeSafetyNote).toBe(true);
  });
});
