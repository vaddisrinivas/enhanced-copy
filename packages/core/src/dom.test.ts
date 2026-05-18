import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractElementContent, mountEnhancedCopy } from "./dom";

describe("mountEnhancedCopy", () => {
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

  it("adds explicit action buttons for data-enhanced-copy blocks", async () => {
    document.body.innerHTML = `<p data-enhanced-copy="debug">const ok = false;</p>`;
    mountEnhancedCopy({ action: "explain" });

    const button = document.querySelector<HTMLButtonElement>(".enhanced-copy-button");
    expect(button?.textContent).toBe("Debug");
    button?.click();

    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("## Task\nDebug this."));
    });
  });

  it("does not intercept normal copy", () => {
    document.body.innerHTML = `<p data-enhanced-copy="explain">Normal copy</p>`;
    mountEnhancedCopy();
    const event = new Event("copy", { bubbles: true, cancelable: true });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("preserves useful markdown from links and code", () => {
    document.body.innerHTML = `<article><h2>Title</h2><p>Read <a href="/docs">docs</a></p><ul><li>One</li></ul></article>`;
    expect(extractElementContent(document.querySelector("article")!)).toContain("[docs](/docs)");
    expect(extractElementContent(document.querySelector("article")!)).toContain("- One");

    document.body.innerHTML = `<pre><code class="language-ts">const x = 1;\nconst y = 2;</code></pre>`;
    expect(extractElementContent(document.querySelector("pre")!)).toBe("const x = 1;\nconst y = 2;");
  });

  it("observes late-added SDK blocks for SPAs", () => {
    mountEnhancedCopy();
    const paragraph = document.createElement("p");
    paragraph.setAttribute("data-enhanced-copy", "summarize");
    paragraph.textContent = "Late content";
    document.body.append(paragraph);

    return vi.waitFor(() => {
      expect(document.querySelector(".enhanced-copy-button")?.textContent).toBe("Summarize");
    });
  });
});
