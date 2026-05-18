import type { EnhancedCopyAction, EnhancedCopyConfig, EnhancedCopyInput } from "./types";

export const DEFAULT_CONFIG: EnhancedCopyConfig = {
  mode: "button",
  action: "explain",
  includeSourceUrl: true,
  includeTitle: true,
  includeSelection: true
};

const ACTION_TASKS: Record<Exclude<EnhancedCopyAction, "custom">, string> = {
  explain: "Explain this clearly and help me use it.",
  debug: "Debug this. Identify the likely issue, explain why it happens, and suggest a fix.",
  summarize: "Summarize the key points and list the practical takeaways.",
  ask: "Answer my question about this content. If no question is provided, propose useful next questions.",
  share: "Rewrite this for sharing with a software developer audience. Keep it accurate and concise."
};

export function normalizeConfig(config: Partial<EnhancedCopyConfig> = {}): EnhancedCopyConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    includeSourceUrl: config.includeSourceUrl ?? DEFAULT_CONFIG.includeSourceUrl,
    includeTitle: config.includeTitle ?? DEFAULT_CONFIG.includeTitle,
    includeSelection: config.includeSelection ?? DEFAULT_CONFIG.includeSelection
  };
}

export function actionTask(action: EnhancedCopyAction, customTemplate?: string): string {
  if (action === "custom") {
    return customTemplate?.trim() || ACTION_TASKS.explain;
  }

  return ACTION_TASKS[action];
}

export function renderEnhancedCopy(input: EnhancedCopyInput): string {
  const action = input.action ?? "explain";
  const includeTitle = input.includeTitle ?? true;
  const includeSourceUrl = input.includeSourceUrl ?? true;
  const includeSelection = input.includeSelection ?? true;
  const title = (input.title || "this page").trim();
  const url = (input.url || "").trim();
  const selection = (input.selection || "").trim();

  if (action === "custom" && input.customTemplate?.trim()) {
    return applyTemplate(input.customTemplate, {
      action,
      selection,
      title,
      url,
      task: ACTION_TASKS.explain
    });
  }

  const lines: string[] = [];
  const source = renderSourceLine({ includeTitle, includeSourceUrl, title, url });
  if (source) lines.push(source, "");
  lines.push(`Task: ${actionTask(action, input.customTemplate)}`);

  if (includeSelection) {
    lines.push("", "Content:", selection);
  }

  return lines.join("\n").trimEnd();
}

function renderSourceLine(input: {
  includeTitle: boolean;
  includeSourceUrl: boolean;
  title: string;
  url: string;
}): string {
  if (input.includeTitle && input.includeSourceUrl && input.url) {
    return `I copied this from ${input.title} at ${input.url}.`;
  }

  if (input.includeTitle) {
    return `I copied this from ${input.title}.`;
  }

  if (input.includeSourceUrl && input.url) {
    return `I copied this from ${input.url}.`;
  }

  return "";
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(action|selection|title|url|task)\}/g, (_, key: string) => values[key] ?? "");
}
