import { describe, expect, it } from "vitest";
import { renderEnhancedCopy } from "./templates";

const base = {
  title: "Fetch API Docs",
  url: "https://example.com/fetch",
  selection: "fetch('/api/users').then((r) => r.json())"
};

describe("renderEnhancedCopy", () => {
  it("renders the default explain output", () => {
    expect(renderEnhancedCopy({ ...base, action: "explain" })).toBe(
      "I copied this from Fetch API Docs at https://example.com/fetch.\n\nTask: Explain this clearly and help me use it.\n\nContent:\nfetch('/api/users').then((r) => r.json())"
    );
  });

  it("renders each built-in action", () => {
    expect(renderEnhancedCopy({ ...base, action: "debug" })).toContain("Task: Debug this.");
    expect(renderEnhancedCopy({ ...base, action: "summarize" })).toContain("Task: Summarize");
    expect(renderEnhancedCopy({ ...base, action: "ask" })).toContain("Task: Answer my question");
    expect(renderEnhancedCopy({ ...base, action: "share" })).toContain("Task: Rewrite this");
  });

  it("supports custom templates", () => {
    expect(
      renderEnhancedCopy({
        ...base,
        action: "custom",
        customTemplate: "Use {title} / {url}: {selection}"
      })
    ).toBe("Use Fetch API Docs / https://example.com/fetch: fetch('/api/users').then((r) => r.json())");
  });

  it("can omit source URL and title", () => {
    expect(
      renderEnhancedCopy({
        ...base,
        includeSourceUrl: false,
        includeTitle: false
      })
    ).toBe("Task: Explain this clearly and help me use it.\n\nContent:\nfetch('/api/users').then((r) => r.json())");
  });

  it("handles empty selected content", () => {
    expect(renderEnhancedCopy({ title: "Empty", url: "https://example.com", selection: "" })).toContain("Content:");
  });
});
