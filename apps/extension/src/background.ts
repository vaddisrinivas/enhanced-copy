import { ACTIONS, getSettings } from "./shared";
import type { EnhancedCopyAction } from "@enhanced-copy/core";
import {
  createHistoryItem,
  deleteHistoryItem,
  HISTORY_KEY,
  togglePinned,
  upsertHistory,
  type ClipboardHistoryInput,
  type ClipboardHistoryItem
} from "./history";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "enhanced-copy-root",
      title: "Enhanced Copy",
      contexts: ["selection", "page"]
    });

    for (const item of ACTIONS) {
      chrome.contextMenus.create({
        id: `enhanced-copy-${item.action}`,
        parentId: "enhanced-copy-root",
        title: item.label,
        contexts: ["selection", "page"]
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.menuItemId.toString().startsWith("enhanced-copy-")) return;
  const action = info.menuItemId.toString().replace("enhanced-copy-", "") as EnhancedCopyAction;
  if (!ACTIONS.some((item) => item.action === action)) return;
  void copyFromTab(tab.id, action);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "enhanced-copy-selection") return;
  void chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
    if (!tab?.id) return;
    const settings = await getSettings();
    await copyFromTab(tab.id, settings.action);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "ENHANCED_COPY_SAVE_HISTORY") {
    void saveHistory(message.item as ClipboardHistoryInput).then((history) => sendResponse({ ok: true, history }));
    return true;
  }

  if (message?.type === "ENHANCED_COPY_GET_HISTORY") {
    void getHistory().then((history) => sendResponse({ ok: true, history }));
    return true;
  }

  if (message?.type === "ENHANCED_COPY_CLEAR_HISTORY") {
    void chrome.storage.local.set({ [HISTORY_KEY]: [] }).then(() => sendResponse({ ok: true, history: [] }));
    return true;
  }

  if (message?.type === "ENHANCED_COPY_DELETE_HISTORY") {
    void mutateHistory((history) => deleteHistoryItem(history, message.id as string)).then((history) =>
      sendResponse({ ok: true, history })
    );
    return true;
  }

  if (message?.type === "ENHANCED_COPY_TOGGLE_PIN") {
    void mutateHistory((history) => togglePinned(history, message.id as string)).then((history) =>
      sendResponse({ ok: true, history })
    );
    return true;
  }

  return false;
});

async function copyFromTab(tabId: number, action: EnhancedCopyAction): Promise<void> {
  const settings = await getSettings();
  await chrome.tabs
    .sendMessage(tabId, {
      type: "ENHANCED_COPY_COPY",
      action,
      source: "context-menu",
      settings
    })
    .catch(() => undefined);
}

async function saveHistory(input: ClipboardHistoryInput): Promise<ClipboardHistoryItem[]> {
  const settings = await getSettings();
  const item = createHistoryItem(input, settings.redactLikelySecrets);
  return mutateHistory((history) => upsertHistory(history, item, settings.historyLimit));
}

async function getHistory(): Promise<ClipboardHistoryItem[]> {
  const stored = await chrome.storage.local.get({ [HISTORY_KEY]: [] });
  return (stored[HISTORY_KEY] as ClipboardHistoryItem[]) || [];
}

async function mutateHistory(
  mutate: (history: ClipboardHistoryItem[]) => ClipboardHistoryItem[]
): Promise<ClipboardHistoryItem[]> {
  const history = mutate(await getHistory());
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
  return history;
}
