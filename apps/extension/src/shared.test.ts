import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_SETTINGS, isOverrideMode } from "./shared";

describe("extension settings", () => {
  it("defaults to shortcut mode so normal copy stays normal", () => {
    expect(DEFAULT_EXTENSION_SETTINGS.mode).toBe("shortcut");
    expect(isOverrideMode(DEFAULT_EXTENSION_SETTINGS.mode)).toBe(false);
  });

  it("identifies opt-in override modes", () => {
    expect(isOverrideMode("override-copy")).toBe(true);
    expect(isOverrideMode("all")).toBe(true);
  });
});
