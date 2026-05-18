import { writeClipboardText } from "./clipboard";
import { renderEnhancedPrompt } from "./templates";
import type {
  AnthropicDestination,
  ChromeAiDestination,
  CustomDestination,
  EnhancedCopyDestination,
  EnhancedPromptInput,
  GeminiDestination,
  OllamaDestination,
  OpenAiCompatibleDestination,
  RenderOptions,
  SendEnhancedPromptInput,
  SendEnhancedPromptResult,
  SourceContext,
  WebhookDestination
} from "./types";

type JsonRecord = Record<string, unknown>;

type LanguageModelSession = {
  prompt: (input: string) => Promise<string>;
  destroy?: () => void;
};

type LanguageModelApi = {
  availability: (options?: JsonRecord) => Promise<string>;
  create: (options?: JsonRecord) => Promise<LanguageModelSession>;
};

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_ANTHROPIC_BASE_URL = "https://api.anthropic.com";
const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_ANTHROPIC_VERSION = "2023-06-01";

export async function sendEnhancedPrompt(input: SendEnhancedPromptInput): Promise<SendEnhancedPromptResult> {
  const destination = input.destination || ({ type: "clipboard" } satisfies EnhancedCopyDestination);
  const prompt = renderEnhancedPrompt(input);

  try {
    if (destination.type === "clipboard") {
      await writeClipboardText(prompt, input.clipboard);
      return { ok: true, destination: destination.type, prompt };
    }

    if (destination.type === "chrome-ai") {
      const responseText = await askChromeAi(prompt, destination);
      return { ok: true, destination: destination.type, prompt, responseText };
    }

    if (destination.type === "custom") {
      return await sendCustom(prompt, input, destination);
    }

    const fetcher = input.fetch || globalThis.fetch;
    if (!fetcher) throw new Error("fetch is unavailable");

    if (destination.type === "ollama") {
      return await sendOllama(prompt, input, destination, fetcher);
    }
    if (destination.type === "openai-compatible") {
      return await sendOpenAiCompatible(prompt, destination, fetcher, input.signal);
    }
    if (destination.type === "anthropic") {
      return await sendAnthropic(prompt, destination, fetcher, input.signal);
    }
    if (destination.type === "gemini") {
      return await sendGemini(prompt, destination, fetcher, input.signal);
    }
    if (destination.type === "webhook") {
      return await sendWebhook(prompt, input, destination, fetcher);
    }

    return unreachable(destination, prompt);
  } catch (error) {
    const typedError = toError(error);
    return {
      ok: false,
      destination: destination.type,
      prompt,
      error: typedError,
      status: errorStatus(typedError),
      raw: errorRaw(typedError)
    };
  }
}

export function destinationRequestUrl(destination: EnhancedCopyDestination): string | undefined {
  if (destination.type === "clipboard" || destination.type === "chrome-ai" || destination.type === "custom") return undefined;
  if (destination.type === "webhook") return destination.url;
  if (destination.type === "ollama") return ollamaChatUrl(destination.baseUrl);
  if (destination.type === "openai-compatible") {
    return joinUrl(destination.baseUrl || DEFAULT_OPENAI_BASE_URL, destination.path || "/chat/completions");
  }
  if (destination.type === "anthropic") return joinUrl(DEFAULT_ANTHROPIC_BASE_URL, "/v1/messages");
  return geminiGenerateUrl(destination);
}

async function askChromeAi(prompt: string, destination: ChromeAiDestination): Promise<string> {
  const model = (globalThis as typeof globalThis & { LanguageModel?: LanguageModelApi }).LanguageModel;
  if (!model) throw new Error("Chrome built-in AI is unavailable");

  const options: JsonRecord = {};
  if (destination.topK !== undefined) options.topK = destination.topK;
  if (destination.temperature !== undefined) options.temperature = destination.temperature;
  if (destination.systemPrompt?.trim()) {
    options.initialPrompts = [{ role: "system", content: destination.systemPrompt.trim() }];
  }

  const availability = await model.availability(options);
  if (availability === "unavailable") throw new Error("Chrome built-in AI is unavailable for this profile");

  const session = await model.create(options);
  try {
    return await session.prompt(prompt);
  } finally {
    session.destroy?.();
  }
}

async function sendOllama(
  prompt: string,
  input: EnhancedPromptInput & { signal?: AbortSignal },
  destination: OllamaDestination,
  fetcher: typeof fetch
): Promise<SendEnhancedPromptResult> {
  const response = await fetchJson(fetcher, ollamaChatUrl(destination.baseUrl), {
    method: "POST",
    signal: input.signal,
    headers: {
      "Content-Type": "application/json",
      ...(destination.apiKey ? { Authorization: `Bearer ${destination.apiKey}` } : {})
    },
    body: JSON.stringify({
      model: destination.model,
      stream: false,
      messages: [{ role: "user", content: prompt }]
    })
  });

  return {
    ok: true,
    destination: destination.type,
    prompt,
    responseText: requireResponseText(
      stringAt(response.json, ["message", "content"]) || stringAt(response.json, ["response"]),
      response.json
    ),
    raw: response.json,
    status: response.status
  };
}

async function sendOpenAiCompatible(
  prompt: string,
  destination: OpenAiCompatibleDestination,
  fetcher: typeof fetch,
  signal?: AbortSignal
): Promise<SendEnhancedPromptResult> {
  const response = await fetchJson(fetcher, joinUrl(destination.baseUrl || DEFAULT_OPENAI_BASE_URL, destination.path || "/chat/completions"), {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${destination.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: destination.model,
      stream: false,
      messages: [{ role: "user", content: prompt }]
    })
  });

  return {
    ok: true,
    destination: destination.type,
    prompt,
    responseText: requireResponseText(
      stringAt(response.json, ["choices", 0, "message", "content"]) ||
        stringAt(response.json, ["output_text"]) ||
        stringAt(response.json, ["message", "content"]),
      response.json
    ),
    raw: response.json,
    status: response.status
  };
}

async function sendAnthropic(
  prompt: string,
  destination: AnthropicDestination,
  fetcher: typeof fetch,
  signal?: AbortSignal
): Promise<SendEnhancedPromptResult> {
  const response = await fetchJson(fetcher, joinUrl(DEFAULT_ANTHROPIC_BASE_URL, "/v1/messages"), {
    method: "POST",
    signal,
    headers: {
      "x-api-key": destination.apiKey,
      "anthropic-version": destination.anthropicVersion || DEFAULT_ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: destination.model,
      max_tokens: destination.maxTokens || 1024,
      messages: [{ role: "user", content: prompt }]
    })
  });

  return {
    ok: true,
    destination: destination.type,
    prompt,
    responseText: requireResponseText(extractAnthropicText(response.json), response.json),
    raw: response.json,
    status: response.status
  };
}

async function sendGemini(
  prompt: string,
  destination: GeminiDestination,
  fetcher: typeof fetch,
  signal?: AbortSignal
): Promise<SendEnhancedPromptResult> {
  const response = await fetchJson(fetcher, geminiGenerateUrl(destination), {
    method: "POST",
    signal,
    headers: {
      "x-goog-api-key": destination.apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  return {
    ok: true,
    destination: destination.type,
    prompt,
    responseText: requireResponseText(extractGeminiText(response.json), response.json),
    raw: response.json,
    status: response.status
  };
}

async function sendWebhook(
  prompt: string,
  input: EnhancedPromptInput & { signal?: AbortSignal },
  destination: WebhookDestination,
  fetcher: typeof fetch
): Promise<SendEnhancedPromptResult> {
  const response = await fetchJson(fetcher, destination.url, {
    method: "POST",
    signal: input.signal,
    headers: {
      "Content-Type": "application/json",
      ...(destination.apiKey ? { [destination.authorizationHeader || "Authorization"]: `Bearer ${destination.apiKey}` } : {})
    },
    body: JSON.stringify({
      ...webhookPayload(input, prompt)
    })
  });

  return {
    ok: true,
    destination: destination.type,
    prompt,
    responseText: requireResponseText(
      stringAt(response.json, ["answer"]) ||
        stringAt(response.json, ["response"]) ||
        stringAt(response.json, ["text"]) ||
        stringAt(response.json, ["message", "content"]),
      response.json
    ),
    raw: response.json,
    status: response.status
  };
}

async function sendCustom(
  prompt: string,
  input: EnhancedPromptInput & { signal?: AbortSignal },
  destination: CustomDestination
): Promise<SendEnhancedPromptResult> {
  const response = await destination.send({
    prompt,
    content: input.content,
    source: input.source,
    options: safeRenderOptions(input.options),
    signal: input.signal
  });

  return {
    ok: true,
    destination: destination.type,
    prompt,
    responseText: requireResponseText(response.responseText, response.raw),
    raw: response.raw,
    status: response.status
  };
}

async function fetchJson(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit
): Promise<{ json: JsonRecord; status: number }> {
  const response = await fetcher(url, init);
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    const message = stringAt(json, ["error", "message"]) || stringAt(json, ["error"]) || text || response.statusText;
    const error = new Error(`Request failed ${response.status}: ${message}`);
    (error as Error & { status?: number; raw?: unknown }).status = response.status;
    (error as Error & { status?: number; raw?: unknown }).raw = json;
    throw error;
  }

  return { json, status: response.status };
}

function parseJson(text: string): JsonRecord {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as JsonRecord;
  } catch {
    return { text };
  }
}

function ollamaChatUrl(baseUrl: string): string {
  const clean = trimTrailingSlash(baseUrl || "http://127.0.0.1:11434");
  return clean.endsWith("/api") ? `${clean}/chat` : `${clean}/api/chat`;
}

function geminiGenerateUrl(destination: GeminiDestination): string {
  return `${trimTrailingSlash(DEFAULT_GEMINI_BASE_URL)}/models/${encodeURIComponent(destination.model)}:generateContent`;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${trimTrailingSlash(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function extractAnthropicText(json: JsonRecord): string | undefined {
  const content = json.content;
  if (!Array.isArray(content)) return undefined;
  return content
    .map((part) => (isRecord(part) && part.type === "text" && typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n");
}

function extractGeminiText(json: JsonRecord): string | undefined {
  const parts = valueAt(json, ["candidates", 0, "content", "parts"]);
  if (!Array.isArray(parts)) return undefined;
  return parts
    .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n");
}

function stringAt(value: unknown, path: Array<string | number>): string | undefined {
  const found = valueAt(value, path);
  return typeof found === "string" ? found : undefined;
}

function valueAt(value: unknown, path: Array<string | number>): unknown {
  return path.reduce<unknown>((current, key) => {
    if (Array.isArray(current) && typeof key === "number") return current[key];
    if (isRecord(current) && typeof key === "string") return current[key];
    return undefined;
  }, value);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function webhookPayload(input: EnhancedPromptInput, prompt: string): JsonRecord {
  const options = safeRenderOptions(input.options);
  return {
    action: options.action || "explain",
    prompt,
    source: safeSource(input.source, options),
    content: limitContent(input.content, options.maxChars || 12_000),
    options
  };
}

function safeRenderOptions(options: RenderOptions = {}): RenderOptions {
  return {
    action: options.action,
    customTask: options.customTask,
    question: options.question,
    maxChars: options.maxChars,
    includeSourceUrl: options.includeSourceUrl,
    includeTitle: options.includeTitle,
    includeSafetyNote: options.includeSafetyNote,
    outputFormat: options.outputFormat
  };
}

function safeSource(source: SourceContext = {}, options: RenderOptions): SourceContext {
  return {
    ...(options.includeTitle === false ? {} : { title: source.title }),
    ...(options.includeSourceUrl === false ? {} : { url: source.url }),
    label: source.label,
    language: source.language,
    contentType: source.contentType,
    metadata: source.metadata
  };
}

function limitContent(content: string, maxChars: number): string {
  const normalized = content.trim();
  if (normalized.length <= maxChars) return normalized;
  return normalized.slice(0, maxChars).trimEnd();
}

function requireResponseText(value: string | undefined, raw: unknown): string {
  if (value?.trim()) return value;
  const error = new Error("No text response found in destination response");
  (error as Error & { raw?: unknown }).raw = raw;
  throw error;
}

function errorStatus(error: Error): number | undefined {
  return (error as Error & { status?: number }).status;
}

function errorRaw(error: Error): unknown {
  return (error as Error & { raw?: unknown }).raw;
}

function unreachable(destination: never, prompt: string): SendEnhancedPromptResult {
  return {
    ok: false,
    destination: "clipboard",
    prompt,
    error: new Error(`Unsupported destination: ${String(destination)}`)
  };
}
