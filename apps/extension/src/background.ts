import {
  renderEnhancedPrompt,
  sendEnhancedPrompt,
  type EnhancedCopyDestination,
  type PromptAction,
  type RenderOptions,
  type SourceContext
} from "@enhanced-copy/core";
import { ACTIONS, getResolvedDestination, getSettings, type ActiveTabMessage, type ExtensionRequest, type ExtensionResponse } from "./shared";

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
  void handleActiveTab(tab.id, { type: "ENHANCED_COPY_ACTIVE_TAB", action, intent: "copy" });
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "enhanced-copy-selection") return;
  void findActiveTab().then(async (tabId) => {
    if (tabId) await handleActiveTab(tabId, { type: "ENHANCED_COPY_ACTIVE_TAB", intent: "copy" });
  });
});

chrome.runtime.onMessage.addListener((message: ExtensionRequest, sender, sendResponse) => {
  if (message?.type === "ENHANCED_COPY_ACTIVE_TAB") {
    void resolveTargetTab(message, sender).then(async (tabId) => {
      if (!tabId) {
        sendResponse({ ok: false, error: "No active tab" });
        return;
      }
      sendResponse(await handleActiveTab(tabId, message));
    });
    return true;
  }

  if (message?.type === "ENHANCED_COPY_TEST_DESTINATION") {
    void testDestination(message.destination).then(sendResponse);
    return true;
  }

  return false;
});

async function handleActiveTab(
  tabId: number,
  message: ActiveTabMessage
): Promise<ExtensionResponse> {
  try {
    const settings = await getSettings();
    const page = await collectSelection(tabId);
    if (!page.content.trim()) return { ok: false, error: "Select text on the page first" };

    const action = message.action || settings.action || "explain";
    const options = renderOptionsFromSettings(settings, action);
    const promptInput = {
      content: page.content,
      source: page.source,
      options
    };

    if (message.intent === "ask") {
      const destination = await getResolvedDestination(message.destinationId || settings.defaultDestinationId);
      if (destination.type === "clipboard") {
        return { ok: false, error: "Choose a model destination first" };
      }

      const result = await sendEnhancedPrompt({
        ...promptInput,
        destination,
        fetch
      });

      if (!result.ok) return { ok: false, text: result.prompt, error: result.error.message, destination: result.destination };
      if (settings.rememberRecentPrompts) await saveRecentPrompt(result.prompt);
      return {
        ok: true,
        text: result.prompt,
        answer: result.responseText,
        destination: result.destination
      };
    }

    const text = renderEnhancedPrompt(promptInput);
    await writeText(tabId, text);
    if (settings.rememberRecentPrompts) await saveRecentPrompt(text);
    return { ok: true, text, destination: "clipboard", copied: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function testDestination(destination: EnhancedCopyDestination): Promise<ExtensionResponse> {
  const result = await sendEnhancedPrompt({
    content: "Enhanced Copy connection test. Reply with a short confirmation.",
    source: { title: "Enhanced Copy", label: "Connection test", contentType: "text" },
    options: { action: "custom", customTask: "Reply with: Enhanced Copy destination is connected." },
    destination,
    fetch
  });

  if (!result.ok) return { ok: false, prompt: result.prompt, error: result.error.message, destination: result.destination };
  return { ok: true, prompt: result.prompt, answer: result.responseText, destination: result.destination };
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

async function resolveTargetTab(message: ActiveTabMessage, sender: chrome.runtime.MessageSender): Promise<number | undefined> {
  if (message.targetTabId) return message.targetTabId;
  if (sender.tab?.id && isNormalPage(sender.tab.url)) return sender.tab.id;
  return findActiveTab();
}

async function findActiveTab(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id && isNormalPage(tab.url) ? tab.id : undefined;
}

function isNormalPage(url?: string): boolean {
  if (!url) return true;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");
}

function renderOptionsFromSettings(settings: RenderOptions, action: RenderOptions["action"]): RenderOptions {
  return {
    action,
    customTask: settings.customTask,
    question: settings.question,
    maxChars: settings.maxChars,
    includeSourceUrl: settings.includeSourceUrl,
    includeTitle: settings.includeTitle,
    includeSafetyNote: settings.includeSafetyNote,
    outputFormat: settings.outputFormat
  };
}
