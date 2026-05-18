import { describe, expect, it } from "vitest";
import {
  createHistoryItem,
  deleteHistoryItem,
  redactSecrets,
  searchHistory,
  togglePinned,
  upsertHistory
} from "./history";

describe("clipboard history", () => {
  it("dedupes repeated copies and increments count", () => {
    const first = createHistoryItem({
      text: "same clip",
      kind: "plain",
      title: "Docs",
      url: "https://example.com",
      source: "copy-event"
    });
    const second = { ...first, id: "different", updatedAt: first.updatedAt + 1 };

    const history = upsertHistory(upsertHistory([], first), second);

    expect(history).toHaveLength(1);
    expect(history[0].count).toBe(2);
  });

  it("keeps pinned items above recent items", () => {
    const oldPinned = {
      ...createHistoryItem({ text: "old", kind: "plain", source: "copy-event" }),
      id: "old",
      updatedAt: 1,
      pinned: true
    };
    const fresh = {
      ...createHistoryItem({ text: "fresh", kind: "plain", source: "copy-event" }),
      id: "fresh",
      updatedAt: 2
    };

    expect(upsertHistory([oldPinned], fresh)[0].id).toBe("old");
  });

  it("searches text, source, title, and action", () => {
    const item = createHistoryItem({
      text: "React hydration warning",
      kind: "enhanced",
      action: "debug",
      title: "GitHub issue",
      url: "https://github.com/example/repo/issues/1",
      source: "selection-bubble"
    });

    expect(searchHistory([item], "hydration")).toHaveLength(1);
    expect(searchHistory([item], "github")).toHaveLength(1);
    expect(searchHistory([item], "debug")).toHaveLength(1);
    expect(searchHistory([item], "linkedin")).toHaveLength(0);
  });

  it("pins and deletes items", () => {
    const item = createHistoryItem({ text: "clip", kind: "plain", source: "copy-event" });
    expect(togglePinned([item], item.id)[0].pinned).toBe(true);
    expect(deleteHistoryItem([item], item.id)).toEqual([]);
  });

  it("redacts likely secrets by default", () => {
    expect(redactSecrets("OPENAI_API_KEY=sk-1234567890abcdefghi")).toBe("OPENAI_API_KEY=[redacted-secret]");
    expect(
      createHistoryItem({
        text: "password=super-secret-value",
        kind: "plain",
        source: "copy-event"
      }).text
    ).toBe("[redacted-secret]");
  });
});
