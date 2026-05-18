import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { EnhancedCopyAction, EnhancedCopyMode } from "@enhanced-copy/core";
import { ACTIONS, DEFAULT_EXTENSION_SETTINGS, getSettings, saveSettings, type ExtensionSettings } from "./shared";
import { searchHistory, type ClipboardHistoryItem } from "./history";
import "./popup.css";

function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_EXTENSION_SETTINGS);
  const [history, setHistory] = useState<ClipboardHistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void getSettings().then(setSettings);
    void refreshHistory();
  }, []);

  async function update(next: Partial<ExtensionSettings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    await saveSettings(next);
    setStatus("Saved");
    window.setTimeout(() => setStatus(""), 1200);
  }

  async function refreshHistory() {
    const response = await chrome.runtime.sendMessage({ type: "ENHANCED_COPY_GET_HISTORY" }).catch(() => undefined);
    if (response?.history) setHistory(response.history);
  }

  async function copyNow(action = settings.action) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    const response = await chrome.tabs
      .sendMessage(tab.id, {
        type: "ENHANCED_COPY_COPY",
        action,
        settings
      })
      .catch(() => undefined);
    setStatus(response?.ok ? "Enhanced copy ready" : "Open a normal webpage first");
    await refreshHistory();
  }

  async function copyHistoryItem(item: ClipboardHistoryItem) {
    await navigator.clipboard.writeText(item.text);
    setStatus("History item copied");
  }

  async function togglePinned(id: string) {
    const response = await chrome.runtime.sendMessage({ type: "ENHANCED_COPY_TOGGLE_PIN", id });
    setHistory(response.history);
  }

  async function deleteItem(id: string) {
    const response = await chrome.runtime.sendMessage({ type: "ENHANCED_COPY_DELETE_HISTORY", id });
    setHistory(response.history);
  }

  async function clearHistory() {
    const response = await chrome.runtime.sendMessage({ type: "ENHANCED_COPY_CLEAR_HISTORY" });
    setHistory(response.history);
  }

  const filteredHistory = searchHistory(history, query);

  function modeLabel(mode: EnhancedCopyMode) {
    if (mode === "override-copy") return "Override Cmd/Ctrl+C";
    if (mode === "all") return "Shortcut + override";
    if (mode === "button") return "Button";
    return "Shortcut only";
  }

  return (
    <main>
      <header>
        <div>
          <h1>Enhanced Copy</h1>
          <p>AI copy layer + local clipboard manager.</p>
        </div>
        <strong>{history.length}/{settings.historyLimit}</strong>
      </header>

      <section className="quick">
        <div className="quick-title">
          <span>Current selection</span>
          <small>{modeLabel(settings.mode)}</small>
        </div>
        <div className="actions">
          {ACTIONS.map((item) => (
            <button key={item.action} type="button" onClick={() => void copyNow(item.action)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <details>
        <summary>Settings</summary>
        <label>
          Default action
          <select
            value={settings.action}
            onChange={(event) => void update({ action: event.currentTarget.value as EnhancedCopyAction })}
          >
            {ACTIONS.map((item) => (
              <option key={item.action} value={item.action}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Copy mode
          <select
            value={settings.mode}
            onChange={(event) => void update({ mode: event.currentTarget.value as EnhancedCopyMode })}
          >
            <option value="shortcut">Shortcut only</option>
            <option value="override-copy">Override Cmd/Ctrl+C</option>
            <option value="all">Shortcut + override</option>
          </select>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.capturePlainCopies}
            onChange={(event) => void update({ capturePlainCopies: event.currentTarget.checked })}
          />
          Save normal copies
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.showSelectionBubble}
            onChange={(event) => void update({ showSelectionBubble: event.currentTarget.checked })}
          />
          Show selection bubble
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.redactLikelySecrets}
            onChange={(event) => void update({ redactLikelySecrets: event.currentTarget.checked })}
          />
          Redact likely secrets
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.includeTitle}
            onChange={(event) => void update({ includeTitle: event.currentTarget.checked })}
          />
          Include title
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.includeSourceUrl}
            onChange={(event) => void update({ includeSourceUrl: event.currentTarget.checked })}
          />
          Include URL
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.showOverrideBadge}
            onChange={(event) => void update({ showOverrideBadge: event.currentTarget.checked })}
          />
          Show override badge
        </label>
      </details>

      <section className="history-head">
        <input
          aria-label="Search clipboard history"
          placeholder="Search local history"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <button type="button" onClick={() => void clearHistory()} disabled={!history.length}>
          Clear
        </button>
      </section>

      <section className="history" aria-label="Clipboard history">
        {filteredHistory.length === 0 ? (
          <p className="empty">Copy text on any normal webpage. It lands here locally.</p>
        ) : (
          filteredHistory.map((item) => (
            <article key={item.id}>
              <div className="item-meta">
                <span className={`kind ${item.kind}`}>{item.action || item.kind}</span>
                <span title={item.url}>{hostFor(item.url) || item.title}</span>
              </div>
              <p>{item.text}</p>
              <div className="item-actions">
                <button type="button" onClick={() => void copyHistoryItem(item)}>
                  Copy
                </button>
                <button type="button" onClick={() => void togglePinned(item.id)}>
                  {item.pinned ? "Unpin" : "Pin"}
                </button>
                <button type="button" onClick={() => void deleteItem(item.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <footer>{status || "Shortcut: Cmd/Ctrl+Shift+C"}</footer>
    </main>
  );
}

function hostFor(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

createRoot(document.getElementById("root")!).render(<Popup />);
