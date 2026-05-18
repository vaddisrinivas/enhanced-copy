import { copyEnhancedPrompt } from "./clipboard";
import type {
  CopyOptions,
  CopyResult,
  EnhancedCopyConfig,
  EnhancedCopyController,
  MountEnhancedCopyOptions,
  PromptAction,
  SourceContext
} from "./types";
import { showCopyFallback, showToast } from "./ui";

const ACTIONS = new Set<PromptAction>(["explain", "debug", "summarize", "ask", "share", "custom"]);

export function mountEnhancedCopy(options: MountEnhancedCopyOptions = {}): EnhancedCopyController {
  const root = options.root || document;
  const selector = options.selector || "[data-enhanced-copy]";
  const observe = options.observe ?? true;
  const buttons: HTMLElement[] = [];
  const disposers: Array<() => void> = [];
  const mounted = new WeakSet<Element>();

  scan(root);

  if (observe && document.body) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    disposers.push(() => observer.disconnect());
  }

  async function copyFromElement(element: Element, copyOptions: CopyOptions = {}): Promise<CopyResult> {
    const source = { ...defaultSourceForElement(element), ...options.getSource?.(element), ...copyOptions.source };
    const result = await copyEnhancedPrompt(
      {
        content: getContent(element, options),
        source,
        options: {
          ...options,
          ...copyOptions,
          action: copyOptions.action || actionForElement(element, options)
        }
      },
      copyOptions
    );

    if (result.ok) {
      showToast("Enhanced copy ready");
      options.onCopied?.(result, element);
    } else {
      showCopyFallback(result.text);
      options.onError?.(result, element);
    }

    return result;
  }

  function scan(scanRoot: ParentNode | Element): void {
    if (scanRoot instanceof Element && scanRoot.matches(selector)) {
      mountButton(scanRoot);
    }
    scanRoot.querySelectorAll(selector).forEach(mountButton);
  }

  function mountButton(element: Element): void {
    if (mounted.has(element)) return;
    mounted.add(element);

    const action = actionForElement(element, options);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "enhanced-copy-button";
    button.title = "Copy enhanced text for AI or sharing";
    button.textContent = labelFor(element, options, action);
    button.addEventListener("click", () => {
      void copyFromElement(element);
    });

    element.before(button);
    buttons.push(button);
  }

  return {
    copyFromElement,
    destroy() {
      buttons.forEach((button) => button.remove());
      disposers.forEach((dispose) => dispose());
    }
  };
}

export function createEnhancedCopy(config: EnhancedCopyConfig = {}): EnhancedCopyController {
  return mountEnhancedCopy(config);
}

export function extractElementContent(element: Element): string {
  const code = element.matches("pre, code") ? element : element.querySelector("pre, code");
  if (code) return (code.textContent || "").trim();

  return domToMarkdown(element).replace(/\n{3,}/g, "\n\n").trim();
}

export function sourceFromElement(element: Element): SourceContext {
  const code = element.matches("pre, code") ? element : element.querySelector("pre, code");
  const language = code ? languageFromClass(code.className) : undefined;
  const explicitType = element.getAttribute("data-enhanced-copy-type");

  return {
    title: element.getAttribute("data-enhanced-copy-title") || document.title,
    url: element.getAttribute("data-enhanced-copy-url") || window.location.href,
    label: element.getAttribute("data-enhanced-copy-label") || undefined,
    language,
    contentType: explicitType === "code" || code ? "code" : "markdown"
  };
}

function defaultSourceForElement(element: Element): SourceContext {
  return sourceFromElement(element);
}

function getContent(element: Element, options: MountEnhancedCopyOptions): string {
  return options.getContent?.(element) || extractElementContent(element);
}

function actionForElement(element: Element, options: MountEnhancedCopyOptions): PromptAction {
  const value = element.getAttribute("data-enhanced-copy")?.trim() as PromptAction | undefined;
  return value && ACTIONS.has(value) ? value : options.action || "explain";
}

function labelFor(element: Element, options: MountEnhancedCopyOptions, action: PromptAction): string {
  const source = defaultSourceForElement(element);
  if (typeof options.buttonLabel === "function") return options.buttonLabel(source, action);
  if (typeof options.buttonLabel === "string") return options.buttonLabel;
  if (action === "explain") return "Explain";
  if (action === "debug") return "Debug";
  if (action === "summarize") return "Summarize";
  if (action === "ask") return "Ask Prompt";
  if (action === "share") return "Share";
  return "Copy AI Prompt";
}

function domToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (!(node instanceof Element)) return "";

  const tag = node.tagName.toLowerCase();
  if (tag === "br") return "\n";
  if (tag === "a") {
    const text = childrenToMarkdown(node).trim() || node.getAttribute("href") || "";
    const href = node.getAttribute("href");
    return href ? `[${text}](${href})` : text;
  }
  if (tag === "code") return `\`${node.textContent || ""}\``;
  if (tag === "pre") return `\n\`\`\`\n${node.textContent || ""}\n\`\`\`\n`;
  if (/^h[1-6]$/.test(tag)) return `\n${"#".repeat(Number(tag[1]))} ${childrenToMarkdown(node).trim()}\n`;
  if (tag === "li") return `\n- ${childrenToMarkdown(node).trim()}`;
  if (["p", "div", "section", "article", "ul", "ol"].includes(tag)) return `\n${childrenToMarkdown(node).trim()}\n`;

  return childrenToMarkdown(node);
}

function childrenToMarkdown(element: Element): string {
  return Array.from(element.childNodes).map(domToMarkdown).join("");
}

function languageFromClass(className: string): string | undefined {
  return className
    .split(/\s+/)
    .find((value) => value.startsWith("language-"))
    ?.replace("language-", "");
}
