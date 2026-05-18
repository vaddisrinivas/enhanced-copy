import {
  renderEnhancedCopy,
  showCopyFallback,
  showToast,
  writeClipboardText,
  type EnhancedCopyAction
} from "@enhanced-copy/core";
import { DEFAULT_EXTENSION_SETTINGS, getSettings, isOverrideMode, type ExtensionSettings } from "./shared";
import type { ClipboardHistorySource } from "./history";

let settings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS;
let badge: HTMLDivElement | null = null;
let bubble: HTMLDivElement | null = null;
let bubbleHideTimer: number | null = null;

void getSettings().then((next) => {
  settings = next;
  renderOverrideBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  settings = {
    ...settings,
    ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
  };
  renderOverrideBadge();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "ENHANCED_COPY_COPY") return false;
  const action = message.action as EnhancedCopyAction;
  const source = (message.source as ClipboardHistorySource | undefined) ?? "popup";
  const nextSettings = { ...settings, ...(message.settings as Partial<ExtensionSettings>) };
  void copyEnhanced(action, nextSettings, source).then((text) => sendResponse({ ok: true, text }));
  return true;
});

document.addEventListener("copy", (event) => {
  const selection = selectedText();
  if (!selection) return;

  if (!isOverrideMode(settings.mode)) {
    if (settings.capturePlainCopies && !isSensitiveEditable(event.target)) {
      void saveHistory(selection, "plain", undefined, "copy-event");
    }
    return;
  }

  if (isSensitiveEditable(event.target)) return;

  const text = renderText(settings.action, settings, selection);
  event.preventDefault();
  event.clipboardData?.setData("text/plain", text);
  void saveHistory(text, "enhanced", settings.action, "override-copy");
  showToast("Enhanced copy ready");
});

document.addEventListener("mouseup", () => queueBubbleUpdate());
document.addEventListener("keyup", () => queueBubbleUpdate());
document.addEventListener("selectionchange", () => queueBubbleUpdate());

async function copyEnhanced(
  action: EnhancedCopyAction,
  nextSettings: ExtensionSettings,
  source: ClipboardHistorySource
): Promise<string> {
  const text = renderText(action, nextSettings, selectedText() || fallbackText());
  try {
    await writeClipboardText(text);
    await saveHistory(text, "enhanced", action, source);
    showToast("Enhanced copy ready");
  } catch {
    showCopyFallback(text);
  }
  return text;
}

function renderText(action: EnhancedCopyAction, nextSettings: ExtensionSettings, selection: string): string {
  return renderEnhancedCopy({
    action,
    customTemplate: nextSettings.customTemplate,
    includeSelection: nextSettings.includeSelection,
    includeSourceUrl: nextSettings.includeSourceUrl,
    includeTitle: nextSettings.includeTitle,
    selection,
    title: document.title,
    url: window.location.href
  });
}

async function saveHistory(
  text: string,
  kind: "plain" | "enhanced",
  action: EnhancedCopyAction | undefined,
  source: ClipboardHistorySource
): Promise<void> {
  if (!text.trim()) return;
  await chrome.runtime
    .sendMessage({
      type: "ENHANCED_COPY_SAVE_HISTORY",
      item: {
        text: text.trim().slice(0, 20_000),
        kind,
        action,
        title: document.title,
        url: window.location.href,
        source
      }
    })
    .catch(() => undefined);
}

function selectedText(): string {
  return window.getSelection()?.toString().trim() ?? "";
}

function fallbackText(): string {
  const target = document.activeElement?.closest?.("[data-enhanced-copy], article, main, section");
  const text = target?.textContent || document.body.innerText || "";
  return text.trim().slice(0, 12_000);
}

function renderOverrideBadge(): void {
  const enabled = isOverrideMode(settings.mode) && settings.showOverrideBadge;
  if (!enabled) {
    badge?.remove();
    badge = null;
    return;
  }

  if (badge) return;
  badge = document.createElement("div");
  badge.textContent = "Enhanced Copy: Cmd/Ctrl+C ON";
  Object.assign(badge.style, {
    position: "fixed",
    left: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    border: "1px solid #b6c7aa",
    borderRadius: "8px",
    background: "#edf7e8",
    color: "#28511f",
    padding: "8px 10px",
    font: "700 12px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    boxShadow: "0 10px 28px rgba(16, 24, 40, 0.18)"
  });
  document.body.append(badge);
}

function queueBubbleUpdate(): void {
  if (!settings.showSelectionBubble) {
    removeBubble();
    return;
  }

  if (bubbleHideTimer) window.clearTimeout(bubbleHideTimer);
  bubbleHideTimer = window.setTimeout(renderSelectionBubble, 80);
}

function renderSelectionBubble(): void {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  if (!selection || !text || text.length < 2 || selection.rangeCount === 0) {
    removeBubble();
    return;
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();
  if (!rect.width && !rect.height) {
    removeBubble();
    return;
  }

  if (!bubble) {
    bubble = document.createElement("div");
    bubble.className = "enhanced-copy-bubble";
    Object.assign(bubble.style, {
      position: "fixed",
      zIndex: "2147483647",
      display: "flex",
      gap: "4px",
      alignItems: "center",
      padding: "6px",
      border: "1px solid #243040",
      borderRadius: "8px",
      background: "#101828",
      color: "#fff",
      boxShadow: "0 14px 34px rgba(16, 24, 40, 0.34)",
      font: "700 12px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    });

    for (const [action, label] of [
      ["explain", "Explain"],
      ["debug", "Debug"],
      ["summarize", "Sum"],
      ["ask", "Ask"],
      ["share", "Share"]
    ] as Array<[EnhancedCopyAction, string]>) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.title = `${label} with Enhanced Copy`;
      Object.assign(button.style, bubbleButtonStyle());
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        void copyEnhanced(action, settings, "selection-bubble").then(removeBubble);
      });
      bubble.append(button);
    }

    document.body.append(bubble);
  }

  const top = Math.max(8, rect.top - bubble.offsetHeight - 10);
  const left = Math.min(window.innerWidth - bubble.offsetWidth - 8, Math.max(8, rect.left));
  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
}

function bubbleButtonStyle(): Partial<CSSStyleDeclaration> {
  return {
    border: "1px solid #475467",
    borderRadius: "6px",
    background: "#1f2937",
    color: "#fff",
    cursor: "pointer",
    padding: "5px 7px",
    font: "700 12px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  };
}

function removeBubble(): void {
  bubble?.remove();
  bubble = null;
}

function isSensitiveEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  const input = target instanceof HTMLInputElement ? target : null;
  return input?.type === "password" || tag === "input" || tag === "textarea" || (target as HTMLElement).isContentEditable;
}
