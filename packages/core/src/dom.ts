import { writeClipboardText } from "./clipboard";
import { normalizeConfig, renderEnhancedCopy } from "./templates";
import type { EnhancedCopyAction, EnhancedCopyConfig, EnhancedCopyController } from "./types";
import { showCopyFallback, showToast } from "./ui";

const ACTIONS = new Set<EnhancedCopyAction>(["explain", "debug", "summarize", "ask", "share", "custom"]);

export function createEnhancedCopy(config: Partial<EnhancedCopyConfig> = {}): EnhancedCopyController {
  const resolved = normalizeConfig(config);
  const disposers: Array<() => void> = [];
  const buttons: HTMLElement[] = [];
  const enhancedElements = new WeakSet<Element>();

  if (resolved.mode === "button" || resolved.mode === "all") {
    scanForEnhancedCopyBlocks(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scanForEnhancedCopyBlocks(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    disposers.push(() => observer.disconnect());
  }

  if (resolved.mode === "shortcut" || resolved.mode === "all") {
    const onKeyDown = (event: KeyboardEvent) => {
      const copyKey = event.key.toLowerCase() === "c" && (event.metaKey || event.ctrlKey) && event.shiftKey;
      if (!copyKey || isEditable(event.target)) return;
      event.preventDefault();
      const element = activeElement();
      void copyFromElement(element, element ? actionForElement(element, resolved) : resolved.action);
    };
    document.addEventListener("keydown", onKeyDown);
    disposers.push(() => document.removeEventListener("keydown", onKeyDown));
  }

  if (resolved.mode === "override-copy" || resolved.mode === "all") {
    document.documentElement.setAttribute("data-enhanced-copy-override", "enabled");
    const onCopy = (event: ClipboardEvent) => {
      if (isEditable(event.target)) return;
      const selection = selectedText();
      const element = activeElement();
      if (!selection && !element) return;

      const text = renderFromElement(element, element ? actionForElement(element, resolved) : resolved.action);
      event.preventDefault();
      event.clipboardData?.setData("text/plain", text);
      showToast("Enhanced copy ready");
    };
    document.addEventListener("copy", onCopy);
    disposers.push(() => {
      document.removeEventListener("copy", onCopy);
      document.documentElement.removeAttribute("data-enhanced-copy-override");
    });
  }

  async function copyFromElement(element: Element | null, action: EnhancedCopyAction = resolved.action): Promise<string> {
    const text = renderFromElement(element, action);
    try {
      await writeClipboardText(text);
      showToast("Enhanced copy ready");
    } catch {
      showCopyFallback(text);
    }
    return text;
  }

  return {
    copyFromElement,
    destroy() {
      buttons.forEach((button) => button.remove());
      disposers.forEach((dispose) => dispose());
    }
  };

  function renderFromElement(element: Element | null, action: EnhancedCopyAction): string {
    return renderEnhancedCopy({
      action,
      customTemplate: resolved.customTemplate,
      includeSelection: resolved.includeSelection,
      includeSourceUrl: resolved.includeSourceUrl,
      includeTitle: resolved.includeTitle,
      selection: selectedText() || elementText(element),
      title: document.title,
      url: window.location.href
    });
  }

  function scanForEnhancedCopyBlocks(root: ParentNode | Element): void {
    if (root instanceof Element && root.matches("[data-enhanced-copy]")) {
      enhanceElement(root);
    }

    root.querySelectorAll("[data-enhanced-copy]").forEach(enhanceElement);
  }

  function enhanceElement(element: Element): void {
    if (enhancedElements.has(element)) return;
    enhancedElements.add(element);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "enhanced-copy-button";
    button.title = "Copy enhanced text for AI or sharing";
    button.textContent = buttonLabelFor(element, resolved);
    button.addEventListener("click", () => {
      void copyFromElement(element, actionForElement(element, resolved));
    });
    element.before(button);
    buttons.push(button);
  }
}

function activeElement(): Element | null {
  const selected = window.getSelection();
  const anchor = selected?.anchorNode;
  const element = anchor instanceof Element ? anchor : anchor?.parentElement;
  return element?.closest("[data-enhanced-copy]") ?? document.querySelector("[data-enhanced-copy]");
}

function actionForElement(element: Element, config: EnhancedCopyConfig): EnhancedCopyAction {
  const value = element.getAttribute("data-enhanced-copy")?.trim() as EnhancedCopyAction | undefined;
  return value && ACTIONS.has(value) ? value : config.action;
}

function buttonLabelFor(element: Element, config: EnhancedCopyConfig): string {
  const action = actionForElement(element, config);
  if (config.buttonLabel && action === config.action) return config.buttonLabel;
  if (action === "explain") return "Explain";
  if (action === "debug") return "Debug";
  if (action === "summarize") return "Summarize";
  if (action === "ask") return "Ask AI";
  if (action === "share") return "Share";
  return config.buttonLabel || "Enhanced Copy";
}

function selectedText(): string {
  return window.getSelection()?.toString().trim() ?? "";
}

function elementText(element: Element | null): string {
  if (!element) return "";
  return ((element as HTMLElement).innerText || element.textContent || "").trim();
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || (target as HTMLElement).isContentEditable;
}
