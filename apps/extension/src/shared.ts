import { destinationRequestUrl, type EnhancedCopyDestination, type PromptAction, type RenderOptions } from "@enhanced-copy/core";

export type ConfigurableDestinationKind = "webhook" | "ollama" | "openai-compatible" | "anthropic" | "gemini";
export type DestinationKind = ConfigurableDestinationKind;

export type ExtensionDestination = EnhancedCopyDestination & {
  id: string;
  name: string;
  createdAt?: number;
  hasApiKey?: boolean;
  sessionOnly?: true;
};

export type ExtensionSettings = RenderOptions & {
  rememberRecentPrompts: boolean;
  defaultDestinationId: string;
  destinations: ExtensionDestination[];
};

export type CopyIntent = "copy" | "ask";

export type ActiveTabMessage = {
  type: "ENHANCED_COPY_ACTIVE_TAB";
  action?: PromptAction;
  intent?: CopyIntent;
  destinationId?: string;
  targetTabId?: number;
};

export type TestDestinationMessage = {
  type: "ENHANCED_COPY_TEST_DESTINATION";
  destination: EnhancedCopyDestination;
};

export type ExtensionRequest = ActiveTabMessage | TestDestinationMessage;

export type ExtensionResponse = {
  ok: boolean;
  text?: string;
  answer?: string;
  prompt?: string;
  destination?: string;
  error?: string;
  copied?: boolean;
};

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
  { action: "ask", label: "Ask Prompt" },
  { action: "share", label: "Share" }
];

export const DESTINATION_KINDS: Array<{
  type: ConfigurableDestinationKind;
  label: string;
  needsApiUrl: boolean;
  needsApiKey: boolean;
  needsModel: boolean;
}> = [
  { type: "webhook", label: "Webhook", needsApiUrl: true, needsApiKey: false, needsModel: false },
  { type: "ollama", label: "Ollama", needsApiUrl: true, needsApiKey: false, needsModel: true },
  { type: "openai-compatible", label: "OpenAI-compatible", needsApiUrl: true, needsApiKey: true, needsModel: true },
  { type: "anthropic", label: "Anthropic", needsApiUrl: false, needsApiKey: true, needsModel: true },
  { type: "gemini", label: "Gemini", needsApiUrl: false, needsApiKey: true, needsModel: true }
];

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get(DEFAULT_EXTENSION_SETTINGS);
  const destinations = normalizeStoredDestinations(stored.destinations);
  if (JSON.stringify(destinations) !== JSON.stringify(stored.destinations || [])) {
    await chrome.storage.local.set({ destinations });
  }

  return {
    ...DEFAULT_EXTENSION_SETTINGS,
    ...stored,
    destinations
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
  if (destination.type === "clipboard" || destination.type === "chrome-ai") return destination;

  const needsKey = destinationNeedsApiKey(destination) || destination.hasApiKey;
  if (!needsKey) return withoutApiKey(destination);

  const apiKey = await getSessionApiKey(destination.id);
  if (!apiKey) {
    throw new Error(`API key for ${destination.name} is not in this browser session. Re-enter it.`);
  }

  return { ...destination, apiKey } as ExtensionDestination;
}

export async function saveDestination(destination: ExtensionDestination): Promise<ExtensionDestination> {
  const settings = await getSettings();
  const createdAt = destination.createdAt || Date.now();
  const next = { ...destination, createdAt, sessionOnly: true as const };
  const localDestination = await destinationForLocalStorage(next);
  const destinations = [...settings.destinations.filter((item) => item.id !== next.id), localDestination].sort(
    (left, right) => (left.createdAt || 0) - (right.createdAt || 0)
  );

  await chrome.storage.local.set({ destinations });
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

export async function clearRecentPrompts(): Promise<void> {
  await chrome.storage.local.set({ recentPrompts: [] });
}

export function destinationPermissionPattern(destination: EnhancedCopyDestination): string | undefined {
  const requestUrl = destinationRequestUrl(destination);
  if (!requestUrl) return undefined;
  try {
    const url = new URL(requestUrl);
    if (url.protocol === "https:") return `${url.protocol}//${url.hostname}/*`;
    if (url.protocol === "http:" && isLocalhost(url.hostname)) return `${url.protocol}//${url.hostname}/*`;
    return undefined;
  } catch {
    return undefined;
  }
}

export function validateDestinationNetwork(destination: EnhancedCopyDestination): string {
  const requestUrl = destinationRequestUrl(destination);
  if (!requestUrl) return "";
  try {
    const url = new URL(requestUrl);
    if (url.protocol === "https:") return "";
    if (url.protocol === "http:" && isLocalhost(url.hostname)) return "";
    return "Use HTTPS, or HTTP only for localhost.";
  } catch {
    return "Enter a valid URL including https:// or http://localhost.";
  }
}

export function destinationLabel(destination: ExtensionDestination): string {
  if (destination.type === "clipboard") return "Clipboard";
  if (destination.type === "chrome-ai") return "Chrome AI";
  if (destination.type === "custom") return destination.name;
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
}): ExtensionDestination {
  const apiKey = input.apiKey.trim();
  const base = {
    id: input.id || makeDestinationId(),
    name: input.name.trim() || kindLabel(input.type),
    sessionOnly: true as const,
    hasApiKey: Boolean(apiKey),
    createdAt: Date.now()
  };

  if (input.type === "webhook") {
    return { ...base, type: "webhook", url: input.apiUrl.trim(), apiKey: apiKey || undefined };
  }
  if (input.type === "ollama") {
    return {
      ...base,
      type: "ollama",
      baseUrl: input.apiUrl.trim() || "http://127.0.0.1:11434",
      model: input.model.trim() || "gemma3",
      apiKey: apiKey || undefined
    };
  }
  if (input.type === "openai-compatible") {
    return {
      ...base,
      type: "openai-compatible",
      baseUrl: input.apiUrl.trim() || "https://api.openai.com/v1",
      model: input.model.trim() || "gpt-4o-mini",
      apiKey
    };
  }
  if (input.type === "anthropic") {
    return {
      ...base,
      type: "anthropic",
      model: input.model.trim() || "claude-3-5-sonnet-latest",
      apiKey
    };
  }

  return {
    ...base,
    type: "gemini",
    model: input.model.trim() || "gemini-2.5-flash",
    apiKey
  };
}

function normalizeStoredDestinations(value: unknown): ExtensionDestination[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isExtensionDestination).filter((destination) => destination.type !== "custom").map((destination) => withoutApiKey({ ...destination, sessionOnly: true }));
}

function isExtensionDestination(value: unknown): value is ExtensionDestination {
  return typeof value === "object" && value !== null && "id" in value && "type" in value && "name" in value;
}

async function destinationForLocalStorage(destination: ExtensionDestination): Promise<ExtensionDestination> {
  if ("apiKey" in destination && destination.apiKey) {
    await setSessionApiKey(destination.id, destination.apiKey);
  }

  return withoutApiKey({
    ...destination,
    hasApiKey: Boolean("apiKey" in destination && destination.apiKey) || destination.hasApiKey,
    sessionOnly: true
  });
}

function withoutApiKey<T extends ExtensionDestination>(destination: T): T {
  if (!("apiKey" in destination)) return destination;
  const copy = { ...destination };
  delete (copy as T & { apiKey?: string }).apiKey;
  return copy;
}

function destinationNeedsApiKey(destination: ExtensionDestination): boolean {
  return destination.type === "openai-compatible" || destination.type === "anthropic" || destination.type === "gemini";
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
  const storage = sessionStorage();
  const stored = await storage.get({ sessionApiKeys: {} });
  const next = { ...(stored.sessionApiKeys as Record<string, string>) };
  delete next[id];
  await storage.set({ sessionApiKeys: next });
}

function sessionStorage(): chrome.storage.StorageArea {
  if (!chrome.storage.session) throw new Error("Session storage unavailable; API keys were not saved.");
  return chrome.storage.session;
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}
