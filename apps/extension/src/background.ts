import { renderEnhancedPrompt, type PromptAction, type SourceContext } from "@enhanced-copy/core";
import { ACTIONS, getSettings } from "./shared";

type PageSelection = {
  content: string;
  source: SourceContext;
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "enhanced-copy-root",
      title: "Enhanced Copy",
      contexts: ["selection"]
    });

    for (const item of ACTIONS) {
      chrome.contextMenus.create({
        id: `enhanced-copy-${item.action}`,
        parentId: "enhanced-copy-root",
        title: item.label,
        contexts: ["selection"]
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.menuItemId.toString().startsWith("enhanced-copy-")) return;
  const action = info.menuItemId.toString().replace("enhanced-copy-", "") as PromptAction;
  if (!ACTIONS.some((item) => item.action === action)) return;
  void copyFromActiveTab(tab.id, action);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "enhanced-copy-selection") return;
  void findCopyTargetTab().then(async (tabId) => {
    if (tabId) await copyFromActiveTab(tabId);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "ENHANCED_COPY_ACTIVE_TAB") return false;
  void findCopyTargetTab().then(async (tabId) => {
    if (!tabId) {
      sendResponse({ ok: false, error: "No active tab" });
      return;
    }
    const result = await copyFromActiveTab(tabId, message.action as PromptAction | undefined);
    sendResponse(result);
  });
  return true;
});

async function copyFromActiveTab(tabId: number, action?: PromptAction): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    const settings = await getSettings();
    const page = await collectSelection(tabId);
    if (!page.content.trim()) return { ok: false, error: "Select text on the page first" };

    const text = renderEnhancedPrompt({
      content: page.content,
      source: page.source,
      options: { ...settings, action: action || settings.action }
    });

    await writeText(tabId, text);
    if (settings.rememberRecentPrompts) await saveRecentPrompt(text);
    return { ok: true, text };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function collectSelection(tabId: number): Promise<PageSelection> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      content: window.getSelection()?.toString() || "",
      source: {
        title: document.title,
        url: window.location.href,
        contentType: "text" as const
      }
    })
  });
  return result.result as PageSelection;
}

async function writeText(tabId: number, text: string): Promise<void> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    args: [text],
    func: async (value: string) => {
      await navigator.clipboard.writeText(value);
      return true;
    }
  });

  if (!result.result) throw new Error("Clipboard write failed");
}

async function saveRecentPrompt(text: string): Promise<void> {
  const stored = await chrome.storage.local.get({ recentPrompts: [] });
  const recentPrompts = [text, ...(stored.recentPrompts as string[]).filter((item) => item !== text)].slice(0, 10);
  await chrome.storage.local.set({ recentPrompts });
}

async function findCopyTargetTab(): Promise<number | undefined> {
  const tabs = await chrome.tabs.query({});
  const activeNormal = tabs.find((tab) => tab.active && tab.id && isNormalPage(tab.url));
  if (activeNormal?.id) return activeNormal.id;

  return [...tabs].reverse().find((tab) => tab.id && isNormalPage(tab.url))?.id;
}

function isNormalPage(url?: string): boolean {
  if (!url) return true;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");
}
