import { useEffect } from "react";
import { mountEnhancedCopy, renderEnhancedPrompt } from "@enhanced-copy/core";
import { EnhancedCopyButton } from "@enhanced-copy/react";

const docsText =
  "Enhanced Copy is a drop-in SDK for adding AI-ready copy buttons to docs, code blocks, support articles, changelogs, and issue templates.";

const codeText = `async function loadUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Could not load users");
  return response.json();
}`;

const issueText =
  "Bug: selected code snippets lose indentation when users paste raw docs into an AI chat. Add a Debug copy button that carries task and source context.";

const destinationCode = `await sendEnhancedPrompt({
  content,
  options: { action: "debug" },
  destination: {
    type: "openai-compatible",
    baseUrl: "https://your-gateway.com/v1",
    apiKey: userKey,
    model: "gpt-4o-mini"
  }
});`;

const preview = renderEnhancedPrompt({
  content: codeText,
  source: {
    title: "SDK demo",
    url: "https://example.dev/docs/fetch",
    label: "Code sample",
    contentType: "code",
    language: "ts"
  },
  options: { action: "debug", maxChars: 4000 }
});

export function App() {
  useEffect(() => {
    const controller = mountEnhancedCopy({
      action: "explain",
      observe: true
    });

    return () => controller.destroy();
  }, []);

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">SDK-first. Explicit copy. No creepy clipboard capture.</p>
          <h1 id="hero-title">Add AI-ready copy buttons in 5 minutes.</h1>
          <p className="lede">
            Enhanced Copy turns docs, code blocks, support answers, and changelogs into structured prompts
            users can paste anywhere or send to Chrome AI, Ollama, webhooks, and BYOK model APIs.
          </p>
          <div className="hero-actions">
            <EnhancedCopyButton className="primary" content={docsText} action="explain">
              Explain
            </EnhancedCopyButton>
            <EnhancedCopyButton
              className="danger"
              content={codeText}
              action="debug"
              source={{ label: "Fetch code sample", contentType: "code", language: "ts" }}
            >
              Debug
            </EnhancedCopyButton>
            <EnhancedCopyButton className="electric" content={issueText} action="ask" question="What should I try next?">
              Copy Ask Prompt
            </EnhancedCopyButton>
          </div>
        </div>
        <pre className="prompt-preview" aria-label="Rendered prompt preview">
          <code>{preview}</code>
        </pre>
      </section>

      <section className="install-strip" aria-label="Install examples">
        <code>npm install @enhanced-copy/core</code>
        <code>{`mountEnhancedCopy()`}</code>
        <code>{`sendEnhancedPrompt()`}</code>
      </section>

      <section className="destinations" aria-label="Destination examples">
        <div>
          <span>Clipboard</span>
          <strong>Default</strong>
        </div>
        <div>
          <span>Chrome AI</span>
          <strong>Local</strong>
        </div>
        <div>
          <span>Ollama</span>
          <strong>localhost</strong>
        </div>
        <div>
          <span>Webhook</span>
          <strong>your backend</strong>
        </div>
        <div>
          <span>OpenAI-compatible</span>
          <strong>BYOK</strong>
        </div>
      </section>

      <section className="arena" aria-label="SDK examples">
        <article>
          <div className="panel-heading">
            <span>Docs block</span>
            <small>data-enhanced-copy="explain"</small>
          </div>
          <p data-enhanced-copy="explain">{docsText}</p>
        </article>

        <article>
          <div className="panel-heading">
            <span>Code block</span>
            <small>data-enhanced-copy="debug"</small>
          </div>
          <pre data-enhanced-copy="debug" data-enhanced-copy-type="code">
            <code className="language-ts">{codeText}</code>
          </pre>
        </article>

        <article>
          <div className="panel-heading">
            <span>Support answer</span>
            <small>data-enhanced-copy="summarize"</small>
          </div>
          <p data-enhanced-copy="summarize">
            If the webhook retries three times and still fails, inspect the signature header, replay window,
            and endpoint timeout before opening a support ticket.
          </p>
        </article>

        <article>
          <div className="panel-heading">
            <span>Issue template</span>
            <small>data-enhanced-copy="ask"</small>
          </div>
          <p data-enhanced-copy="ask">{issueText}</p>
        </article>
      </section>

      <section className="api-strip" aria-label="Destination API">
        <div>
          <strong>Destination API</strong>
          <p>Same rendered prompt. Different output target. No provider lock-in.</p>
        </div>
        <pre>
          <code>{destinationCode}</code>
        </pre>
      </section>

      <section className="principles">
        <div>
          <strong>No background capture</strong>
          <span>Only user-triggered buttons or active-tab extension actions.</span>
        </div>
        <div>
          <strong>Prompt-safe output</strong>
          <span>Source block, task block, fenced content, truncation, injection note.</span>
        </div>
        <div>
          <strong>Docs-team wedge</strong>
          <span>Embeddable SDK first. Extension is dogfood, not the product.</span>
        </div>
        <div>
          <strong>BYOK ready</strong>
          <span>Users can bring API URLs, local models, or a private webhook.</span>
        </div>
      </section>
    </main>
  );
}
