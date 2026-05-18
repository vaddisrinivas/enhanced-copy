import { destinationRequestUrl, type EnhancedCopyDestination, type PromptAction, type RenderOptions } from "@enhanced-copy/core";

export type ExtensionDestination = EnhancedCopyDestination & {
  id: string;
  name: string;
  sessionOnly?: boolean;
  createdAt?: number;
};

export type ExtensionSettings = RenderOptions & {
  rememberRecentPrompts: boolean;
  defaultDestinationId: string;
  destinations: ExtensionDestination[];
};

export type DestinationKind = ExtensionDestination["type"];

export const CLIPBOARD_DESTINATION_ID = "clipboard";
export const CHROME_AI_DESTINATION_ID = "chrome-ai";

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  action: "explain",
  includeSourceUrl: true,
  includeTitle: true,
  includeSafetyNote: true,
  maxChars: 12_000,
  rememberRecentPrompts: false,
  defaultDestinationId: CLIPBOARD_DESTINATION_ID,
  destinations: []
};

export const BUILT_IN_DESTINATIONS: ExtensionDestination[] = [
  { id: CLIPBOARD_DESTINATION_ID, name: "Clipboard", type: "clipboard" },
  { id: CHROME_AI_DESTINATION_ID, name: "Chrome AI", type: "chrome-ai" }
];

export const ACTIONS: Array<{ action: PromptAction; label: string }> = [
  { action: "explain", label: "Explain" },
  { action: "debug", label: "Debug" },
  { action: "summarize", label: "Summarize" },
  { action: "ask", label: "Ask AI" },
  { action: "share", label: "Share" }
];

export const DESTINATION_KINDS: Array<{ type: DestinationKind; label: string; needsApiUrl: boolean; needsApiKey: boolean; needsModel: boolean }> = [
  { type: "webhook", label: "Webhook", needsApiUrl: true, needsApiKey: false, needsModel: false },
  { type: "ollama", label: "Ollama", needsApiUrl: true, needsApiKey: false, needsModel: true },
  { type: "openai-compatible", label: "OpenAI-compatible", needsApiUrl: true, needsApiKey: true, needsModel: true },
  { type: "anthropic", label: "Anthropic", needsApiUrl: false, needsApiKey: true, needsModel: true },
  { type: "gemini", label: "Gemini", needsApiUrl: false, needsApiKey: true, needsModel: true }
];

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get(DEFAULT_EXTENSION_SETTINGS);
  return {
    ...DEFAULT_EXTENSION_SETTINGS,
    ...stored,
    destinations: normalizeStoredDestinations(stored.destinations)
  };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  await chrome.storage.local.set(settings);
}

export async function getAllDestinations(): Promise<ExtensionDestination[]> {
  const settings = await getSettings();
  return [...BUILT_IN_DESTINATIONS, ...settings.destinations];
}

export async function getDestination(id: string | undefined): Promise<ExtensionDestination> {
  const destinations = await getAllDestinations();
  return destinations.find((destination) => destination.id === id) || destinations[0];
}

export async function getResolvedDestination(id: string | undefined): Promise<ExtensionDestination> {
  const destination = await getDestination(id);
  if (!destination.sessionOnly || destination.type === "clipboard" || destination.type === "chrome-ai") return destination;

  const key = await getSessionApiKey(destination.id);
  return { ...destination, apiKey: key } as ExtensionDestination;
}

export async function saveDestination(destination: ExtensionDestination): Promise<ExtensionDestination> {
  const settings = await getSettings();
  const createdAt = destination.createdAt || Date.now();
  const next = { ...destination, createdAt };
  const localDestination = await destinationForLocalStorage(next);
  const destinations = [
    ...settings.destinations.filter((item) => item.id !== destination.id),
    localDestination
  ].sort((left, right) => (left.createdAt || 0) - (right.createdAt || 0));

  await chrome.storage.local.set({ destinations, defaultDestinationId: settings.defaultDestinationId || destination.id });
  return next;
}

export async function deleteDestination(id: string): Promise<void> {
  const settings = await getSettings();
  await chrome.storage.local.set({
    destinations: settings.destinations.filter((destination) => destination.id !== id),
    defaultDestinationId: settings.defaultDestinationId === id ? CLIPBOARD_DESTINATION_ID : settings.defaultDestinationId
  });
  await removeSessionApiKey(id);
}

export function destinationPermissionPattern(destination: EnhancedCopyDestination): string | undefined {
  const requestUrl = destinationRequestUrl(destination);
  if (!requestUrl) return undefined;
  try {
    const url = new URL(requestUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return `${url.origin}/*`;
  } catch {
    return undefined;
  }
}

export function destinationLabel(destination: ExtensionDestination): string {
  if (destination.type === "clipboard") return "Clipboard";
  if (destination.type === "chrome-ai") return "Chrome AI";
  return `${destination.name} · ${kindLabel(destination.type)}`;
}

export function kindLabel(type: DestinationKind): string {
  return DESTINATION_KINDS.find((item) => item.type === type)?.label || type;
}

export function makeDestinationId(): string {
  return `dest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function destinationFromForm(input: {
  id?: string;
  name: string;
  type: DestinationKind;
  apiUrl: string;
  apiKey: string;
  model: string;
  sessionOnly?: boolean;
}): ExtensionDestination {
  const base = {
    id: input.id || makeDestinationId(),
    name: input.name.trim() || kindLabel(input.type),
    sessionOnly: Boolean(input.sessionOnly),
    createdAt: Date.now()
  };

  if (input.type === "webhook") {
    return { ...base, type: "webhook", url: input.apiUrl.trim(), apiKey: input.apiKey.trim() || undefined };
  }
  if (input.type === "ollama") {
    return {
      ...base,
      type: "ollama",
      baseUrl: input.apiUrl.trim() || "http://127.0.0.1:11434",
      model: input.model.trim() || "gemma3",
      apiKey: input.apiKey.trim() || undefined
    };
  }
  if (input.type === "openai-compatible") {
    return {
      ...base,
      type: "openai-compatible",
      baseUrl: input.apiUrl.trim() || "https://api.openai.com/v1",
      model: input.model.trim() || "gpt-4o-mini",
      apiKey: input.apiKey.trim()
    };
  }
  if (input.type === "anthropic") {
    return {
      ...base,
      type: "anthropic",
      baseUrl: input.apiUrl.trim() || undefined,
      model: input.model.trim() || "claude-3-5-sonnet-latest",
      apiKey: input.apiKey.trim()
    };
  }

  return {
    ...base,
    type: "gemini",
    baseUrl: input.apiUrl.trim() || undefined,
    model: input.model.trim() || "gemini-2.5-flash",
    apiKey: input.apiKey.trim()
  };
}

async function destinationForLocalStorage(destination: ExtensionDestination): Promise<ExtensionDestination> {
  if (!destination.sessionOnly) return destination;
  if ("apiKey" in destination && destination.apiKey) await setSessionApiKey(destination.id, destination.apiKey);
  return { ...destination, apiKey: "" } as ExtensionDestination;
}

function normalizeStoredDestinations(value: unknown): ExtensionDestination[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isExtensionDestination);
}

function isExtensionDestination(value: unknown): value is ExtensionDestination {
  return typeof value === "object" && value !== null && "id" in value && "type" in value && "name" in value;
}

async function getSessionApiKey(id: string): Promise<string> {
  const stored = await sessionStorage().get({ sessionApiKeys: {} });
  return (stored.sessionApiKeys as Record<string, string>)[id] || "";
}

async function setSessionApiKey(id: string, apiKey: string): Promise<void> {
  const stored = await sessionStorage().get({ sessionApiKeys: {} });
  await sessionStorage().set({ sessionApiKeys: { ...(stored.sessionApiKeys as Record<string, string>), [id]: apiKey } });
}

async function removeSessionApiKey(id: string): Promise<void> {
  const stored = await sessionStorage().get({ sessionApiKeys: {} });
  const next = { ...(stored.sessionApiKeys as Record<string, string>) };
  delete next[id];
  await sessionStorage().set({ sessionApiKeys: next });
}

function sessionStorage(): chrome.storage.StorageArea {
  return chrome.storage.session || chrome.storage.local;
}
