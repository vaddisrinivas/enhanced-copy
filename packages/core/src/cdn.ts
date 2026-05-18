import { copyEnhancedPrompt } from "./clipboard";
import { mountEnhancedCopy, createEnhancedCopy } from "./dom";
import { ENHANCED_COPY_ICON_SVG } from "./icon";
import { sendEnhancedPrompt } from "./destinations";
import { renderEnhancedPrompt, renderEnhancedCopy } from "./templates";
import type { MountEnhancedCopyOptions, PromptAction } from "./types";

const api = {
  copyEnhancedPrompt,
  createEnhancedCopy,
  icon: ENHANCED_COPY_ICON_SVG,
  mountEnhancedCopy,
  renderEnhancedCopy,
  renderEnhancedPrompt,
  sendEnhancedPrompt
};

declare global {
  interface Window {
    EnhancedCopy?: typeof api;
  }
}

window.EnhancedCopy = api;

const script = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null;

if (script?.dataset.enhancedCopyAuto !== "false") {
  injectCdnStyles();
  const mount = () => mountEnhancedCopy(optionsFromScript(script));
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
}

function optionsFromScript(scriptElement: HTMLScriptElement | null): MountEnhancedCopyOptions {
  const data = scriptElement?.dataset || {};
  return {
    action: actionFrom(data.enhancedCopyAction),
    buttonLabel: data.enhancedCopyButtonLabel || undefined,
    includeSafetyNote: booleanFrom(data.enhancedCopyIncludeSafetyNote),
    includeSourceUrl: booleanFrom(data.enhancedCopyIncludeSourceUrl),
    includeTitle: booleanFrom(data.enhancedCopyIncludeTitle),
    selector: data.enhancedCopySelector || undefined
  };
}

function actionFrom(value?: string): PromptAction | undefined {
  if (value === "explain" || value === "debug" || value === "summarize" || value === "ask" || value === "share") {
    return value;
  }
  return undefined;
}

function booleanFrom(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function injectCdnStyles(): void {
  if (document.getElementById("enhanced-copy-cdn-style")) return;
  const style = document.createElement("style");
  style.id = "enhanced-copy-cdn-style";
  style.textContent = `
    .enhanced-copy-button {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 34px;
      border: 1px solid #00a991;
      border-radius: 8px;
      background: #00a991;
      color: #04100e;
      cursor: pointer;
      font: 800 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0 0 8px;
      padding: 8px 11px;
    }
    .enhanced-copy-button:hover {
      border-color: #007d6d;
      background: #00bda3;
    }
    .enhanced-copy-icon,
    .enhanced-copy-icon svg {
      display: inline-block;
      width: 16px;
      height: 16px;
      flex: 0 0 auto;
    }
  `;
  document.head.append(style);
}
