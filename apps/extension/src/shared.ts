import type { PromptAction, RenderOptions } from "@enhanced-copy/core";

export type ExtensionSettings = RenderOptions & {
  rememberRecentPrompts: boolean;
};

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  action: "explain",
  includeSourceUrl: true,
  includeTitle: true,
  includeSafetyNote: true,
  maxChars: 12_000,
  rememberRecentPrompts: false
};

export const ACTIONS: Array<{ action: PromptAction; label: string }> = [
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
