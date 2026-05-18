export type PromptAction =
  | "explain"
  | "debug"
  | "summarize"
  | "ask"
  | "share"
  | "custom";

export type ContentFormat = "text" | "markdown" | "code";

export type SourceContext = {
  title?: string;
  url?: string;
  label?: string;
  language?: string;
  contentType?: ContentFormat;
  metadata?: Record<string, string | number | boolean | undefined>;
};

export type RenderOptions = {
  action?: PromptAction;
  customTask?: string;
  question?: string;
  maxChars?: number;
  includeSourceUrl?: boolean;
  includeTitle?: boolean;
  includeSafetyNote?: boolean;
  outputFormat?: "markdown";
};

export type EnhancedPromptInput = {
  content: string;
  source?: SourceContext;
  options?: RenderOptions;
};

export type DestinationBase = {
  name?: string;
};

export type ClipboardDestination = DestinationBase & {
  type: "clipboard";
};

export type ChromeAiDestination = DestinationBase & {
  type: "chrome-ai";
  systemPrompt?: string;
  topK?: number;
  temperature?: number;
};

export type OllamaDestination = DestinationBase & {
  type: "ollama";
  baseUrl: string;
  model: string;
  apiKey?: string;
};

export type OpenAiCompatibleDestination = DestinationBase & {
  type: "openai-compatible";
  baseUrl: string;
  model: string;
  apiKey: string;
  path?: string;
};

export type AnthropicDestination = DestinationBase & {
  type: "anthropic";
  baseUrl?: string;
  model: string;
  apiKey: string;
  maxTokens?: number;
  anthropicVersion?: string;
};

export type GeminiDestination = DestinationBase & {
  type: "gemini";
  baseUrl?: string;
  model: string;
  apiKey: string;
};

export type WebhookDestination = DestinationBase & {
  type: "webhook";
  url: string;
  apiKey?: string;
  authorizationHeader?: string;
};

export type EnhancedCopyDestination =
  | ClipboardDestination
  | ChromeAiDestination
  | OllamaDestination
  | OpenAiCompatibleDestination
  | AnthropicDestination
  | GeminiDestination
  | WebhookDestination;

export type SendOptions = {
  destination?: EnhancedCopyDestination;
  fetch?: typeof fetch;
  clipboard?: Pick<Clipboard, "writeText">;
  signal?: AbortSignal;
};

export type SendEnhancedPromptInput = EnhancedPromptInput & SendOptions;

export type SendEnhancedPromptResult =
  | {
      ok: true;
      destination: EnhancedCopyDestination["type"];
      prompt: string;
      responseText?: string;
      raw?: unknown;
      status?: number;
    }
  | {
      ok: false;
      destination: EnhancedCopyDestination["type"];
      prompt: string;
      error: Error;
      status?: number;
      raw?: unknown;
    };

export type CopyResult =
  | {
      ok: true;
      text: string;
      chars: number;
      truncated: boolean;
      action: PromptAction;
      method: "clipboard" | "legacy";
    }
  | {
      ok: false;
      text: string;
      chars: number;
      truncated: boolean;
      action: PromptAction;
      error: Error;
    };

export type CopyOptions = RenderOptions & {
  source?: SourceContext;
  clipboard?: Pick<Clipboard, "writeText">;
};

export type MountEnhancedCopyOptions = RenderOptions & {
  root?: ParentNode;
  selector?: string;
  buttonLabel?: string | ((source: SourceContext, action: PromptAction) => string);
  observe?: boolean;
  getSource?: (element: Element) => SourceContext;
  getContent?: (element: Element) => string;
  onCopied?: (result: CopyResult, element: Element) => void;
  onError?: (result: CopyResult, element: Element) => void;
};

export type EnhancedCopyController = {
  destroy: () => void;
  copyFromElement: (element: Element, options?: CopyOptions) => Promise<CopyResult>;
};

export type EnhancedCopyConfig = MountEnhancedCopyOptions & {
  action?: PromptAction;
};

export type EnhancedCopyAction = PromptAction;
