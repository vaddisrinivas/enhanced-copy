import type { EnhancedCopyAction, EnhancedCopyConfig } from "@enhanced-copy/core";

export type ExtensionSettings = EnhancedCopyConfig & {
  capturePlainCopies: boolean;
  historyLimit: number;
  redactLikelySecrets: boolean;
  showSelectionBubble: boolean;
  showOverrideBadge: boolean;
};

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  mode: "shortcut",
  action: "explain",
  includeSourceUrl: true,
  includeTitle: true,
  includeSelection: true,
  buttonLabel: "Enhanced Copy",
  capturePlainCopies: true,
  historyLimit: 100,
  redactLikelySecrets: true,
  showSelectionBubble: true,
  showOverrideBadge: true
};

export const ACTIONS: Array<{ action: EnhancedCopyAction; label: string }> = [
  { action: "explain", label: "Explain" },
  { action: "debug", label: "Debug" },
  { action: "summarize", label: "Summarize" },
  { action: "ask", label: "Ask AI" },
  { action: "share", label: "Share" }
];

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get(DEFAULT_EXTENSION_SETTINGS);
  return { ...DEFAULT_EXTENSION_SETTINGS, ...stored };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  await chrome.storage.local.set(settings);
}

export function isOverrideMode(mode: ExtensionSettings["mode"]): boolean {
  return mode === "override-copy" || mode === "all";
}
