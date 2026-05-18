import { useMemo, useState } from "react";
import {
  renderEnhancedCopy,
  writeClipboardText,
  type EnhancedCopyAction,
  type EnhancedCopyConfig
} from "@enhanced-copy/core";

export type EnhancedCopyButtonProps = Partial<EnhancedCopyConfig> & {
  content: string;
  title?: string;
  url?: string;
  action?: EnhancedCopyAction;
  className?: string;
  children?: React.ReactNode;
  onCopied?: (text: string) => void;
  onError?: (error: unknown, text: string) => void;
};

export function EnhancedCopyButton(props: EnhancedCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const label = props.children ?? props.buttonLabel ?? labelForAction(props.action ?? "explain");
  const title = props.title ?? (typeof document !== "undefined" ? document.title : "");
  const url = props.url ?? (typeof window !== "undefined" ? window.location.href : "");
  const text = useMemo(
    () =>
      renderEnhancedCopy({
        action: props.action ?? "explain",
        customTemplate: props.customTemplate,
        includeSelection: props.includeSelection,
        includeSourceUrl: props.includeSourceUrl,
        includeTitle: props.includeTitle,
        selection: props.content,
        title,
        url
      }),
    [
      props.action,
      props.content,
      props.customTemplate,
      props.includeSelection,
      props.includeSourceUrl,
      props.includeTitle,
      title,
      url
    ]
  );

  async function onClick() {
    try {
      await writeClipboardText(text);
      setCopied(true);
      props.onCopied?.(text);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      props.onError?.(error, text);
    }
  }

  return (
    <button
      type="button"
      className={props.className}
      title="Copy enhanced text for AI or sharing"
      aria-live="polite"
      data-enhanced-copy-react-button
      onClick={onClick}
    >
      {copied ? "Enhanced copy ready" : label}
    </button>
  );
}

function labelForAction(action: EnhancedCopyAction): string {
  if (action === "explain") return "Explain";
  if (action === "debug") return "Debug";
  if (action === "summarize") return "Summarize";
  if (action === "ask") return "Ask AI";
  if (action === "share") return "Share";
  return "Enhanced Copy";
}
