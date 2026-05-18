import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PromptAction } from "@enhanced-copy/core";
import {
  ACTIONS,
  BUILT_IN_DESTINATIONS,
  CLIPBOARD_DESTINATION_ID,
  DEFAULT_EXTENSION_SETTINGS,
  DESTINATION_KINDS,
  deleteDestination,
  destinationFromForm,
  destinationLabel,
  destinationPermissionPattern,
  getAllDestinations,
  getSettings,
  kindLabel,
  saveDestination,
  saveSettings,
  type DestinationKind,
  type ExtensionDestination,
  type ExtensionSettings
} from "./shared";
import "./popup.css";

type ExtensionResponse = {
  ok: boolean;
  text?: string;
  answer?: string;
  prompt?: string;
  destination?: string;
  error?: string;
};

type Intent = "copy" | "ask";

function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_EXTENSION_SETTINGS);
  const [destinations, setDestinations] = useState<ExtensionDestination[]>(BUILT_IN_DESTINATIONS);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [status, setStatus] = useState("Select text, then copy or ask your model.");
  const [answer, setAnswer] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "webhook" as DestinationKind,
    apiUrl: "",
    apiKey: "",
    model: "",
    sessionOnly: true
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

    if (intent === "ask" && selectedDestination.id !== CLIPBOARD_DESTINATION_ID) {
      const allowed = await ensurePermission(selectedDestination);
      if (!allowed) return;
    }

    const response = (await chrome.runtime
      .sendMessage({
        type: "ENHANCED_COPY_ACTIVE_TAB",
        intent,
        action,
        destinationId: selectedDestination.id
      })
      .catch((error) => ({ ok: false, error: error.message }))) as ExtensionResponse;

    if (!response.ok) {
      setStatus(response.error || "Request failed");
      if (response.text || response.prompt) setLastPrompt(response.text || response.prompt || "");
      return;
    }

    if (intent === "copy") {
      if (response.text) await writeClipboardBestEffort(response.text);
      setStatus("Enhanced prompt copied");
    } else if (response.answer) {
      setAnswer(response.answer);
      setLastPrompt(response.text || response.prompt || "");
      setStatus(`Answer ready from ${response.destination || selectedDestination.type}`);
    } else {
      if (response.text) await writeClipboardBestEffort(response.text);
      setLastPrompt(response.text || response.prompt || "");
      setStatus("Prompt copied");
    }

    await refreshRecentPrompts();
  }

  async function saveFormDestination() {
    const destination = destinationFromForm(form);
    const valid = validateDestination(destination);
    if (valid) {
      setStatus(valid);
      return;
    }

    const allowed = await ensurePermission(destination);
    if (!allowed) return;

    const saved = await saveDestination(destination);
    await saveSettings({ defaultDestinationId: saved.id });
    setSettings((current) => ({ ...current, defaultDestinationId: saved.id }));
    setForm({ ...form, name: "", apiKey: "" });
    await refreshAll();
    setStatus("Destination saved");
  }

  async function testFormDestination() {
    const destination = destinationFromForm(form);
    const valid = validateDestination(destination);
    if (valid) {
      setStatus(valid);
      return;
    }

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
  }

  async function removeDestination(id: string) {
    await deleteDestination(id);
    await refreshAll();
    setStatus("Destination removed");
  }

  async function copyRecent(text: string) {
    await navigator.clipboard.writeText(text);
    setStatus("Recent prompt copied");
  }

  async function copyAnswer() {
    await navigator.clipboard.writeText(answer);
    setStatus("Answer copied");
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(lastPrompt);
    setStatus("Prompt copied");
  }

  async function ensurePermission(destination: ExtensionDestination): Promise<boolean> {
    const pattern = destinationPermissionPattern(destination);
    if (!pattern) return true;

    const hasPermission = await chrome.permissions.contains({ origins: [pattern] });
    if (hasPermission) return true;

    const granted = await chrome.permissions.request({ origins: [pattern] });
    if (!granted) {
      setStatus(`Permission denied for ${pattern}`);
      return false;
    }

    setStatus(`Permission granted for ${pattern}`);
    return true;
  }

  function validateDestination(destination: ExtensionDestination): string {
    if (
      (destination.type === "webhook" && !destination.url.trim()) ||
      ((destination.type === "ollama" || destination.type === "openai-compatible") && !destination.baseUrl.trim())
    ) {
      return "API URL required";
    }
    if ("model" in destination && !destination.model.trim()) return "Model required";
    if (
      (destination.type === "openai-compatible" || destination.type === "anthropic" || destination.type === "gemini") &&
      !destination.apiKey.trim()
    ) {
      return "API key required";
    }
    return "";
  }

  const currentKind = DESTINATION_KINDS.find((item) => item.type === form.type);

  return (
    <main>
      <header>
        <h1>Enhanced Copy</h1>
        <p>Copy prompts, ask Chrome AI, or send to your own API URL.</p>
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
          <button type="button" className="primary" onClick={() => void runSelection("copy")}>
            Copy Prompt
          </button>
          <button type="button" className="electric" onClick={() => void runSelection("ask")}>
            Ask Destination
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

      <details open>
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
        <label>
          API URL
          <input
            value={form.apiUrl}
            placeholder={placeholderUrl(form.type)}
            onChange={(event) => setForm({ ...form, apiUrl: event.currentTarget.value })}
          />
        </label>
        <label>
          API key
          <input
            value={form.apiKey}
            type="password"
            placeholder={currentKind?.needsApiKey ? "Required" : "Optional"}
            onChange={(event) => setForm({ ...form, apiKey: event.currentTarget.value })}
          />
        </label>
        <label>
          Model
          <input
            value={form.model}
            placeholder={placeholderModel(form.type)}
            onChange={(event) => setForm({ ...form, model: event.currentTarget.value })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.sessionOnly}
            onChange={(event) => setForm({ ...form, sessionOnly: event.currentTarget.checked })}
          />
          Session-only key
        </label>
        <p className="warning">BYOK keys stay in this browser. Use scoped keys, not shared root keys.</p>
        <div className="cta-row">
          <button type="button" onClick={() => void testFormDestination()}>
            Send test
          </button>
          <button type="button" className="primary" onClick={() => void saveFormDestination()}>
            Save destination
          </button>
        </div>
      </details>

      {settings.destinations.length > 0 ? (
        <section className="destinations" aria-label="Saved destinations">
          <h2>Saved destinations</h2>
          {settings.destinations.map((destination) => (
            <article key={destination.id}>
              <strong>{destination.name}</strong>
              <span>{kindLabel(destination.type)}{destination.sessionOnly ? " · session key" : ""}</span>
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
              <h2>Prompt</h2>
              <pre>{lastPrompt}</pre>
              <button type="button" onClick={() => void copyPrompt()}>
                Copy prompt
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

async function writeClipboardBestEffort(text: string): Promise<void> {
  await navigator.clipboard.writeText(text).catch(() => {
    // Active-tab flows already write from the background when the popup cannot.
  });
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

createRoot(document.getElementById("root")!).render(<Popup />);
