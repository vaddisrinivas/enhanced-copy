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
