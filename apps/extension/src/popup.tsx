import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PromptAction } from "@enhanced-copy/core";
import {
  ACTIONS,
  BUILT_IN_DESTINATIONS,
  CLIPBOARD_DESTINATION_ID,
  DEFAULT_EXTENSION_SETTINGS,
  DESTINATION_KINDS,
  clearRecentPrompts,
  deleteDestination,
  destinationPermissionPattern,
  destinationFromForm,
  destinationLabel,
  getAllDestinations,
  getSettings,
  kindLabel,
  saveDestination,
  saveSettings,
  validateDestinationNetwork,
  type DestinationKind,
  type ExtensionRequest,
  type ExtensionResponse,
  type ExtensionDestination,
  type ExtensionSettings
} from "./shared";
import "./popup.css";

type Intent = "copy" | "ask";

function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_EXTENSION_SETTINGS);
  const [destinations, setDestinations] = useState<ExtensionDestination[]>(BUILT_IN_DESTINATIONS);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [status, setStatus] = useState("Select text, then run Enhanced Copy or ask your model.");
  const [answer, setAnswer] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [busy, setBusy] = useState<"copy" | "ask" | "test" | "save" | "">("");
  const [form, setForm] = useState({
    name: "",
    type: "webhook" as DestinationKind,
    apiUrl: "",
    apiKey: "",
    model: ""
  });

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.id === settings.defaultDestinationId) || destinations[0],
    [destinations, settings.defaultDestinationId]
  );

  useEffect(() => {
    void refreshAll();
  }, []);

  async function refreshAll() {
    const nextSettings = await getSettings();
    setSettings(nextSettings);
    setDestinations(await getAllDestinations());
    await refreshRecentPrompts();
  }

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

  async function runSelection(intent: Intent, action = settings.action || "explain") {
    setAnswer("");
    setLastPrompt("");

    if (intent === "ask" && selectedDestination.id === CLIPBOARD_DESTINATION_ID) {
      setStatus("Choose a model destination first");
      return;
    }

    setBusy(intent);
    try {
      if (intent === "ask" && selectedDestination.id !== CLIPBOARD_DESTINATION_ID) {
        const allowed = await ensurePermission(selectedDestination);
        if (!allowed) return;
      }

      const targetTabId = await getActiveTabId();
      const message: ExtensionRequest = {
        type: "ENHANCED_COPY_ACTIVE_TAB",
        intent,
        action,
        destinationId: selectedDestination.id,
        targetTabId
      };
      const response = (await chrome.runtime
        .sendMessage(message)
        .catch((error) => ({ ok: false, error: error.message }))) as ExtensionResponse;

      if (!response.ok) {
        setStatus(response.error || "Request failed");
        if (response.text || response.prompt) setLastPrompt(response.text || response.prompt || "");
        return;
      }

      if (intent === "copy") {
        setLastPrompt(response.text || response.prompt || "");
        setStatus(response.copied ? "Enhanced copy ready" : "Enhanced copy ready");
      } else if (response.answer) {
        setAnswer(response.answer);
        setLastPrompt(response.text || response.prompt || "");
        setStatus(`Answer ready from ${response.destination || selectedDestination.type}`);
      } else {
        setLastPrompt(response.text || response.prompt || "");
        setStatus("No answer returned");
      }

      await refreshRecentPrompts();
    } finally {
      setBusy("");
    }
  }

  async function saveFormDestination() {
    const destination = destinationFromForm(form);
    const valid = validateDestination(destination);
    if (valid) {
      setStatus(valid);
      return;
    }

    setBusy("save");
    try {
      const allowed = await ensurePermission(destination);
      if (!allowed) return;

      const saved = await saveDestination(destination);
      await saveSettings({ defaultDestinationId: saved.id });
      setSettings((current) => ({ ...current, defaultDestinationId: saved.id }));
      setForm({ ...form, name: "", apiKey: "" });
      await refreshAll();
      setStatus("Destination saved. API key kept for this browser session only.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy("");
    }
  }

  async function testFormDestination() {
    const destination = destinationFromForm(form);
    const valid = validateDestination(destination);
    if (valid) {
      setStatus(valid);
      return;
    }

    setBusy("test");
    try {
      const allowed = await ensurePermission(destination);
      if (!allowed) return;

      const response = (await chrome.runtime
        .sendMessage({ type: "ENHANCED_COPY_TEST_DESTINATION", destination })
        .catch((error) => ({ ok: false, error: error.message }))) as ExtensionResponse;

      if (response.ok) {
        setAnswer(response.answer || "Destination returned success.");
        setLastPrompt(response.prompt || "");
        setStatus("Destination test passed");
      } else {
        setLastPrompt(response.prompt || "");
        setStatus(response.error || "Destination test failed");
      }
    } finally {
      setBusy("");
    }
  }

  async function removeDestination(id: string) {
    await deleteDestination(id);
    await refreshAll();
    setStatus("Destination removed");
  }

  async function copyRecent(text: string) {
    await navigator.clipboard.writeText(text);
    setStatus("Recent enhanced copy restored");
  }

  async function copyAnswer() {
    await navigator.clipboard.writeText(answer);
    setStatus("Answer copied");
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(lastPrompt);
    setStatus("Enhanced copy restored");
  }

  async function clearRecent() {
    await clearRecentPrompts();
    setRecentPrompts([]);
    setStatus("Recent Enhanced Copy items cleared");
  }

  async function ensurePermission(destination: ExtensionDestination): Promise<boolean> {
    const networkError = validateDestinationNetwork(destination);
    if (networkError) {
      setStatus(networkError);
      return false;
    }

    const origin = destinationPermissionPattern(destination);
    if (!origin) return true;

    const granted = await chrome.permissions.contains({ origins: [origin] });
    if (granted) return true;

    const allowed = await chrome.permissions.request({ origins: [origin] });
    if (!allowed) {
      setStatus(`Permission denied for ${origin}`);
      return false;
    }

    return true;
  }

  function validateDestination(destination: ExtensionDestination): string {
    const kind = DESTINATION_KINDS.find((item) => item.type === destination.type);
    if (
      (destination.type === "webhook" && !destination.url.trim()) ||
      ((destination.type === "ollama" || destination.type === "openai-compatible") && !destination.baseUrl.trim())
    ) {
      return "API URL required";
    }
    if (kind?.needsModel && "model" in destination && !destination.model.trim()) return "Model required";
    if (
      (destination.type === "openai-compatible" || destination.type === "anthropic" || destination.type === "gemini") &&
      !destination.apiKey.trim()
    ) {
      return "API key required";
    }
    return validateDestinationNetwork(destination);
  }

  const currentKind = DESTINATION_KINDS.find((item) => item.type === form.type);

  return (
    <main>
      <header>
        <h1>Enhanced Copy</h1>
        <p>Run Enhanced Copy, ask Chrome AI, or send to your own API URL.</p>
      </header>

      <section className="panel">
        <label>
          Action
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
          Destination
          <select
            value={selectedDestination.id}
            onChange={(event) => void update({ defaultDestinationId: event.currentTarget.value })}
          >
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destinationLabel(destination)}
              </option>
            ))}
          </select>
        </label>

        <div className="cta-row">
          <button type="button" disabled={Boolean(busy)} className="primary" onClick={() => void runSelection("copy")}>
            {busy === "copy" ? "Copying..." : "Enhanced Copy"}
          </button>
          <button
            type="button"
            className="electric"
            disabled={selectedDestination.id === CLIPBOARD_DESTINATION_ID || Boolean(busy)}
            onClick={() => void runSelection("ask")}
          >
            {selectedDestination.id === CLIPBOARD_DESTINATION_ID ? "Pick Model First" : busy === "ask" ? "Asking..." : "Ask Model"}
          </button>
        </div>

        <div className="quick" aria-label="Quick copy actions">
          {ACTIONS.map((item) => (
            <button key={item.action} type="button" onClick={() => void runSelection("copy", item.action)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <p className="status" role="status">{status}</p>

      <details>
        <summary>Add API destination</summary>
        <label>
          Provider shape
          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.currentTarget.value as DestinationKind })}
          >
            {DESTINATION_KINDS.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input value={form.name} placeholder={`${kindLabel(form.type)} dev key`} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} />
        </label>
        {currentKind?.needsApiUrl ? (
          <label>
            {form.type === "webhook" ? "Webhook URL" : "Base URL"}
            <input
              value={form.apiUrl}
              placeholder={placeholderUrl(form.type)}
              onChange={(event) => setForm({ ...form, apiUrl: event.currentTarget.value })}
            />
          </label>
        ) : null}
        {(currentKind?.needsApiKey || form.type === "webhook" || form.type === "ollama") ? (
          <label>
            API key
            <input
              value={form.apiKey}
              type="password"
              placeholder={currentKind?.needsApiKey ? "Required for this session" : "Optional, session only"}
              onChange={(event) => setForm({ ...form, apiKey: event.currentTarget.value })}
            />
          </label>
        ) : null}
        {currentKind?.needsModel ? (
          <label>
            Model
            <input
              value={form.model}
              placeholder={placeholderModel(form.type)}
              onChange={(event) => setForm({ ...form, model: event.currentTarget.value })}
            />
          </label>
        ) : null}
        <p className="warning">Tests and model asks can spend tokens. API keys are session-only; re-enter after browser restart.</p>
        <div className="cta-row">
          <button type="button" disabled={Boolean(busy)} onClick={() => void testFormDestination()}>
            {busy === "test" ? "Testing..." : "Send test"}
          </button>
          <button type="button" disabled={Boolean(busy)} className="primary" onClick={() => void saveFormDestination()}>
            {busy === "save" ? "Saving..." : "Save destination"}
          </button>
        </div>
      </details>

      {settings.destinations.length > 0 ? (
        <section className="destinations" aria-label="Saved destinations">
          <h2>Saved destinations</h2>
          {settings.destinations.map((destination) => (
            <article key={destination.id}>
              <strong>{destination.name}</strong>
              <span>{kindLabel(destination.type as DestinationKind)} · session key</span>
              <button type="button" onClick={() => void removeDestination(destination.id)}>
                Delete
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {answer || lastPrompt ? (
        <section className="result" aria-label="Latest result">
          {answer ? (
            <>
              <h2>Answer</h2>
              <pre>{answer}</pre>
              <button type="button" onClick={() => void copyAnswer()}>
                Copy answer
              </button>
            </>
          ) : null}
          {lastPrompt ? (
            <>
              <h2>Enhanced text</h2>
              <pre>{lastPrompt}</pre>
              <button type="button" onClick={() => void copyPrompt()}>
                Copy enhanced text
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      <details>
        <summary>Settings</summary>
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
          Remember explicit Enhanced Copy items
        </label>
      </details>

      {recentPrompts.length > 0 ? (
        <section className="recent" aria-label="Recent explicit Enhanced Copy items">
          <div className="section-head">
            <h2>Recent Enhanced Copy</h2>
            <button type="button" onClick={() => void clearRecent()}>
              Clear
            </button>
          </div>
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

    </main>
  );
}

function placeholderUrl(type: DestinationKind): string {
  if (type === "webhook") return "https://your-api.com/enhanced-copy";
  if (type === "ollama") return "http://127.0.0.1:11434";
  if (type === "openai-compatible") return "https://api.openai.com/v1";
  if (type === "anthropic") return "https://api.anthropic.com";
  return "https://generativelanguage.googleapis.com/v1beta";
}

function placeholderModel(type: DestinationKind): string {
  if (type === "ollama") return "gemma3";
  if (type === "openai-compatible") return "gpt-4o-mini";
  if (type === "anthropic") return "claude-3-5-sonnet-latest";
  if (type === "gemini") return "gemini-2.5-flash";
  return "optional";
}

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

createRoot(document.getElementById("root")!).render(<Popup />);
