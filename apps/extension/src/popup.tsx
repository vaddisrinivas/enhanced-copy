import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PromptAction } from "@enhanced-copy/core";
import { ACTIONS, DEFAULT_EXTENSION_SETTINGS, getSettings, saveSettings, type ExtensionSettings } from "./shared";
import "./popup.css";

type CopyResponse = {
  ok: boolean;
  text?: string;
  error?: string;
};

function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_EXTENSION_SETTINGS);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [status, setStatus] = useState("Select text, then copy an AI-ready prompt.");

  useEffect(() => {
    void getSettings().then(setSettings);
    void refreshRecentPrompts();
  }, []);

  async function update(next: Partial<ExtensionSettings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    await saveSettings(next);
    setStatus("Saved");
  }

  async function refreshRecentPrompts() {
    const stored = await chrome.storage.local.get({ recentPrompts: [] });
    setRecentPrompts(stored.recentPrompts as string[]);
  }

  async function copySelection(action = settings.action || "explain") {
    const response = (await chrome.runtime
      .sendMessage({ type: "ENHANCED_COPY_ACTIVE_TAB", action })
      .catch((error) => ({ ok: false, error: error.message }))) as CopyResponse;

    if (response.ok) {
      if (response.text) {
        await navigator.clipboard.writeText(response.text).catch(() => {
          // Background writes the clipboard for real active-tab flows. Popup write is a best-effort mirror.
        });
      }
      setStatus("Enhanced prompt copied");
      await refreshRecentPrompts();
    } else {
      setStatus(response.error || "Copy failed");
    }
  }

  async function copyRecent(text: string) {
    await navigator.clipboard.writeText(text);
    setStatus("Recent prompt copied");
  }

  return (
    <main>
      <header>
        <h1>Enhanced Copy</h1>
        <p>SDK dogfood extension. Explicit selection only. No background clipboard capture.</p>
      </header>

      <section className="actions" aria-label="Prompt actions">
        {ACTIONS.map((item) => (
          <button key={item.action} type="button" onClick={() => void copySelection(item.action)}>
            {item.label}
          </button>
        ))}
      </section>

      <details>
        <summary>Settings</summary>
        <label>
          Default action
          <select
            value={settings.action}
            onChange={(event) => void update({ action: event.currentTarget.value as PromptAction })}
          >
            {ACTIONS.map((item) => (
              <option key={item.action} value={item.action}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Max copied content chars
          <input
            type="number"
            min="1000"
            max="50000"
            value={settings.maxChars || 12_000}
            onChange={(event) => void update({ maxChars: Number(event.currentTarget.value) })}
          />
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.includeTitle ?? true}
            onChange={(event) => void update({ includeTitle: event.currentTarget.checked })}
          />
          Include page title
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.includeSourceUrl ?? true}
            onChange={(event) => void update({ includeSourceUrl: event.currentTarget.checked })}
          />
          Include URL
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.includeSafetyNote ?? true}
            onChange={(event) => void update({ includeSafetyNote: event.currentTarget.checked })}
          />
          Include prompt-injection note
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.rememberRecentPrompts}
            onChange={(event) => void update({ rememberRecentPrompts: event.currentTarget.checked })}
          />
          Remember explicit enhanced prompts
        </label>
      </details>

      {recentPrompts.length > 0 ? (
        <section className="recent" aria-label="Recent explicit prompts">
          <h2>Recent explicit prompts</h2>
          {recentPrompts.map((text) => (
            <article key={text}>
              <p>{text}</p>
              <button type="button" onClick={() => void copyRecent(text)}>
                Copy
              </button>
            </article>
          ))}
        </section>
      ) : null}

      <footer>{status}</footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
