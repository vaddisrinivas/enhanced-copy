import type { EnhancedCopyAction } from "@enhanced-copy/core";

export const HISTORY_KEY = "enhancedCopyHistory";

export type ClipboardHistoryKind = "plain" | "enhanced";

export type ClipboardHistorySource =
  | "copy-event"
  | "override-copy"
  | "shortcut"
  | "context-menu"
  | "popup"
  | "selection-bubble";

export type ClipboardHistoryItem = {
  id: string;
  text: string;
  kind: ClipboardHistoryKind;
  action?: EnhancedCopyAction;
  title: string;
  url: string;
  source: ClipboardHistorySource;
  createdAt: number;
  updatedAt: number;
  count: number;
  pinned: boolean;
};

export type ClipboardHistoryInput = {
  text: string;
  kind: ClipboardHistoryKind;
  action?: EnhancedCopyAction;
  title?: string;
  url?: string;
  source: ClipboardHistorySource;
};

const SECRET_PATTERNS = [
  /\b(sk-[A-Za-z0-9_-]{16,})\b/g,
  /\b(ghp_[A-Za-z0-9_]{20,})\b/g,
  /\b(api[_-]?key|token|password|secret)\s*[:=]\s*['"]?[^'"\s]{8,}/gi
];

export function createHistoryItem(input: ClipboardHistoryInput, redactLikelySecrets = true): ClipboardHistoryItem {
  const now = Date.now();
  const text = redactLikelySecrets ? redactSecrets(input.text) : input.text;

  return {
    id: `${now}-${Math.random().toString(36).slice(2, 10)}`,
    text,
    kind: input.kind,
    action: input.action,
    title: input.title || "Untitled page",
    url: input.url || "",
    source: input.source,
    createdAt: now,
    updatedAt: now,
    count: 1,
    pinned: false
  };
}

export function upsertHistory(
  history: ClipboardHistoryItem[],
  item: ClipboardHistoryItem,
  limit = 100
): ClipboardHistoryItem[] {
  const existing = history.find((candidate) => candidate.text === item.text && candidate.url === item.url);
  const next = existing
    ? [
        {
          ...existing,
          action: item.action ?? existing.action,
          kind: item.kind,
          source: item.source,
          updatedAt: item.updatedAt,
          count: existing.count + 1
        },
        ...history.filter((candidate) => candidate.id !== existing.id)
      ]
    : [item, ...history];

  return sortAndLimit(next, limit);
}

export function togglePinned(history: ClipboardHistoryItem[], id: string): ClipboardHistoryItem[] {
  return sortAndLimit(
    history.map((item) => (item.id === id ? { ...item, pinned: !item.pinned, updatedAt: Date.now() } : item)),
    history.length
  );
}

export function deleteHistoryItem(history: ClipboardHistoryItem[], id: string): ClipboardHistoryItem[] {
  return history.filter((item) => item.id !== id);
}

export function searchHistory(history: ClipboardHistoryItem[], query: string): ClipboardHistoryItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return sortAndLimit(history, history.length);

  return sortAndLimit(
    history.filter((item) =>
      [item.text, item.title, item.url, item.action, item.kind, item.source]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    ),
    history.length
  );
}

export function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((current, pattern) => current.replace(pattern, "[redacted-secret]"), text);
}

function sortAndLimit(history: ClipboardHistoryItem[], limit: number): ClipboardHistoryItem[] {
  return [...history]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
    .slice(0, Math.max(1, limit));
}
