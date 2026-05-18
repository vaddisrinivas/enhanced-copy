import { renderEnhancedPrompt } from "./templates";
import type { CopyOptions, CopyResult, EnhancedPromptInput } from "./types";

export async function copyEnhancedPrompt(
  input: EnhancedPromptInput | string,
  options: CopyOptions = {}
): Promise<CopyResult> {
  const promptInput: EnhancedPromptInput =
    typeof input === "string"
      ? { content: input, source: options.source, options }
      : { ...input, source: input.source || options.source, options: { ...options, ...input.options } };
  const text = renderEnhancedPrompt(promptInput);
  const action = promptInput.options?.action || "explain";
  const truncated = promptInput.content.trim().length > (promptInput.options?.maxChars || 12_000);

  try {
    const method = await writeClipboardText(text, options.clipboard);
    return { ok: true, text, chars: text.length, truncated, action, method };
  } catch (error) {
    return { ok: false, text, chars: text.length, truncated, action, error: toError(error) };
  }
}

export async function writeClipboardText(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined = globalThis.navigator?.clipboard
): Promise<"clipboard" | "legacy"> {
  if (clipboard?.writeText) {
    await clipboard.writeText(text);
    return "clipboard";
  }

  legacyCopy(text);
  return "legacy";
}

export function legacyCopy(text: string): void {
  if (typeof document === "undefined") {
    throw new Error("Clipboard API is unavailable outside a browser document");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto 0";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();

  const ok = document.execCommand("copy");
  textarea.remove();

  if (!ok) {
    throw new Error("Clipboard copy failed");
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
