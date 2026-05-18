import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEnhancedCopy } from "./dom";

describe("createEnhancedCopy", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.title = "Demo Page";
    window.history.replaceState({}, "", "/docs");
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds action buttons for data-enhanced-copy blocks", async () => {
    document.body.innerHTML = `<p data-enhanced-copy="debug">const ok = false;</p>`;
    createEnhancedCopy({ mode: "button", action: "explain" });

    const button = document.querySelector<HTMLButtonElement>(".enhanced-copy-button");
    expect(button?.textContent).toBe("Debug");
    button?.click();

    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("Task: Debug this. Identify the likely issue")
      );
    });
  });

  it("copies with the shortcut only when shortcut mode is enabled", async () => {
    document.body.innerHTML = `<p data-enhanced-copy="explain">Shortcut content</p>`;
    createEnhancedCopy({ mode: "shortcut", action: "explain" });

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
    );

    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("Shortcut content"));
    });
  });

  it("does not override normal copy when override mode is disabled", () => {
    document.body.innerHTML = `<p data-enhanced-copy="explain">Normal copy</p>`;
    createEnhancedCopy({ mode: "shortcut", action: "explain" });
    const event = new Event("copy", { bubbles: true, cancelable: true });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("overrides normal copy when override mode is enabled", () => {
    document.body.innerHTML = `<p data-enhanced-copy="explain">Override copy</p>`;
    createEnhancedCopy({ mode: "override-copy", action: "explain" });
    const clipboardData = { setData: vi.fn() };
    const event = new Event("copy", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", { value: clipboardData });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(clipboardData.setData).toHaveBeenCalledWith("text/plain", expect.stringContaining("Override copy"));
  });
});
