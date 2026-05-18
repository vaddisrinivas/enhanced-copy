import { useState } from "react";
import {
  copyEnhancedPrompt,
  sendEnhancedPrompt,
  type CopyResult,
  type EnhancedCopyDestination,
  type PromptAction,
  type RenderOptions,
  type SendEnhancedPromptResult,
  type SourceContext
} from "@enhanced-copy/core";

export type EnhancedCopyButtonProps = RenderOptions & {
  content: string;
  source?: SourceContext;
  title?: string;
  url?: string;
  action?: PromptAction;
  destination?: EnhancedCopyDestination;
  intent?: "copy" | "ask";
  className?: string;
  children?: React.ReactNode;
  onCopied?: (result: CopyResult) => void;
  onSent?: (result: SendEnhancedPromptResult) => void;
  onError?: (result: CopyResult | SendEnhancedPromptResult) => void;
};

export function EnhancedCopyButton(props: EnhancedCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const label = props.children ?? labelForAction(props.action ?? "explain");
  const source = {
    ...props.source,
    title: props.title ?? props.source?.title ?? (typeof document !== "undefined" ? document.title : ""),
    url: props.url ?? props.source?.url ?? (typeof window !== "undefined" ? window.location.href : "")
  };

  async function onClick() {
    if (props.intent === "ask" || (props.destination && props.destination.type !== "clipboard")) {
      const result = await sendEnhancedPrompt({
        content: props.content,
        source,
        destination: props.destination,
        options: {
          action: props.action ?? "explain",
          customTask: props.customTask,
          includeSafetyNote: props.includeSafetyNote,
          includeSourceUrl: props.includeSourceUrl,
          includeTitle: props.includeTitle,
          maxChars: props.maxChars,
          question: props.question
        }
      });

      props.onSent?.(result);
      if (result.ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } else {
        props.onError?.(result);
      }
      return;
    }

    const result = await copyEnhancedPrompt({
      content: props.content,
      source,
      options: {
        action: props.action ?? "explain",
        customTask: props.customTask,
        includeSafetyNote: props.includeSafetyNote,
        includeSourceUrl: props.includeSourceUrl,
        includeTitle: props.includeTitle,
        maxChars: props.maxChars,
        question: props.question
      }
    });

    if (result.ok) {
      setCopied(true);
      props.onCopied?.(result);
      window.setTimeout(() => setCopied(false), 1400);
    } else {
      props.onError?.(result);
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

function labelForAction(action: PromptAction): string {
  if (action === "explain") return "Explain";
  if (action === "debug") return "Debug";
  if (action === "summarize") return "Summarize";
  if (action === "ask") return "Ask Prompt";
  if (action === "share") return "Share";
  return "Enhanced Copy";
}
