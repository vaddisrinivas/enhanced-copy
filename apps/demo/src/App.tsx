import { useEffect } from "react";
import { mountEnhancedCopy, renderEnhancedPrompt } from "@enhanced-copy/core";
import { EnhancedCopyButton } from "@enhanced-copy/react";

const productUrl = "https://github.com/vaddisrinivas/enhanced-copy";

const docsText =
  "Enhanced Copy is a drop-in SDK that turns selected docs, code blocks, support answers, changelogs, and issue templates into source-aware text for AI tools and sharing surfaces.";

const codeText = `async function loadUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Could not load users");
  return response.json();
}`;

const issueText =
  "Bug: selected code snippets lose indentation when users paste raw docs into an AI chat. Add a Debug copy action that carries task, source URL, content type, and safety context.";

const communityPost =
  "I keep copying docs into a model chat and then typing the same wrapper again. Copy should carry the task, source URL, and selected content so the next step gets useful context immediately.";

const launchPost =
  "Every docs page already has Copy. The AI workflow version is not answer-here. It is copy with enough intent that the user can choose the next tool.";

const rawCopy = `async function loadUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Could not load users");
  return response.json();
}`;

const enhancedPreview = renderEnhancedPrompt({
  content: rawCopy,
  source: {
    title: "Enhanced Copy SDK docs",
    url: productUrl,
    label: "Fetch helper",
    contentType: "code",
    language: "ts"
  },
  options: { action: "debug", maxChars: 4000 }
});

const destinationCode = `await sendEnhancedPrompt({
  content: selection,
  source: {
    title: document.title,
    url: location.href,
    label: "Selected docs block"
  },
  options: { action: "debug" },
  destination: {
    type: "openai-compatible",
    baseUrl: userApiUrl,
    apiKey: sessionApiKey,
    model: "gpt-4o-mini"
  }
});`;

const sdkCode = `<article
  data-enhanced-copy="explain"
  data-enhanced-copy-title="SDK docs"
  data-enhanced-copy-url="https://docs.example.com/sdk">
  ...
</article>

import { mountEnhancedCopy } from "@enhanced-copy/core";

mountEnhancedCopy({
  buttonLabel: "Explain",
  observe: true
});`;

const cdnCode = `<script
  defer
  src="https://vaddisrinivas.github.io/enhanced-copy/cdn/enhanced-copy.cdn.js"
  data-enhanced-copy-button-label="Enhanced Copy">
</script>`;

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
        <div className="hero-copy">
          <p className="eyebrow">Provider-authored prompts for docs, repos, and posts</p>
          <h1 id="hero-title">Let your site provide the prompt.</h1>
          <p className="lede">
            Website owners know the prompt users need. Enhanced Copy puts that prompt behind Explain,
            Debug, Summarize, Ask, and Share buttons so users can paste better input into their AI tool.
          </p>
          <div className="hero-actions">
            <EnhancedCopyButton
              className="primary"
              content={docsText}
              action="explain"
              source={{ title: "Enhanced Copy docs", url: productUrl, label: "Docs excerpt", contentType: "markdown" }}
            >
              Explain Docs
            </EnhancedCopyButton>
            <EnhancedCopyButton
              className="danger"
              content={codeText}
              action="debug"
              source={{ title: "Enhanced Copy SDK", url: productUrl, label: "Fetch code sample", contentType: "code", language: "ts" }}
            >
              Debug Code
            </EnhancedCopyButton>
            <EnhancedCopyButton
              className="electric"
              content={launchPost}
              action="share"
              source={{ title: "Enhanced Copy launch note", url: productUrl, label: "Launch draft" }}
            >
              Share
            </EnhancedCopyButton>
          </div>
          <div className="metrics" aria-label="Product constraints">
            <span>Provider-authored prompts</span>
            <span>No model calls by default</span>
            <span>No background clipboard capture</span>
          </div>
        </div>

        <div className="hero-stage" aria-label="Enhanced Copy flow demo">
          <div className="browser-top">
            <span />
            <span />
            <span />
            <strong>docs.example.com/sdk/get-started</strong>
          </div>
          <div className="flow-board">
            <div className="selection-card">
              <strong>Selected code</strong>
              <pre>{rawCopy}</pre>
            </div>
            <div className="arrow-card">Enhanced Copy</div>
            <div className="prompt-card">
              <strong>AI-ready output</strong>
              <p>Source + task + fenced content + safety boundary.</p>
            </div>
          </div>
          <div className="copy-rail">
            <strong>The magic moment</strong>
            <p>The website supplies the prompt. The user keeps the choice of AI tool.</p>
            <span>Copy provider-authored prompt + selected content + source context.</span>
          </div>
        </div>
      </section>

      <section className="comparison" aria-label="Raw copy versus Enhanced Copy">
        <div>
          <p className="section-kicker">The broken default</p>
          <h2>Raw copy is context loss.</h2>
          <pre>
            <code>{rawCopy}</code>
          </pre>
        </div>
        <div>
          <p className="section-kicker">The upgrade</p>
          <h2>Enhanced Copy is task plus source plus content.</h2>
          <pre>
            <code>{enhancedPreview}</code>
          </pre>
        </div>
      </section>

      <section className="problem" aria-label="Problem">
        <div>
          <strong>Docs teams lose the handoff</strong>
          <p>Readers copy a paragraph, paste into an AI tool, then rewrite the same prompt wrapper by hand.</p>
        </div>
        <div>
          <strong>Developers lose source truth</strong>
          <p>Raw snippets arrive without repo URL, title, label, content type, or prompt-injection boundary.</p>
        </div>
        <div>
          <strong>AI surfaces stay fragmented</strong>
          <p>The right next step might be a model chat, editor, issue tracker, team chat, local model, or private gateway.</p>
        </div>
      </section>

      <section className="world" aria-label="Enhanced Copy examples">
        <div className="section-headline">
          <p className="section-kicker">SDK demo</p>
          <h2>Every copyable block can become an AI-ready action.</h2>
          <p>
            Docs text, code, issue templates, community posts, launch drafts, and support answers can each render
            a different enhanced-copy action while normal copy stays untouched.
          </p>
        </div>

        <div className="arena">
          <article>
            <div className="panel-heading">
              <span>Docs excerpt</span>
              <small>Explain</small>
            </div>
            <p
              data-enhanced-copy="explain"
              data-enhanced-copy-title="Enhanced Copy docs"
              data-enhanced-copy-url={productUrl}
              data-enhanced-copy-label="Docs positioning"
            >
              {docsText}
            </p>
          </article>

          <article>
            <div className="panel-heading">
              <span>Code block</span>
              <small>Debug</small>
            </div>
            <pre
              data-enhanced-copy="debug"
              data-enhanced-copy-type="code"
              data-enhanced-copy-title="Enhanced Copy SDK"
              data-enhanced-copy-url={productUrl}
              data-enhanced-copy-label="Fetch code sample"
            >
              <code className="language-ts">{codeText}</code>
            </pre>
          </article>

          <article>
            <div className="panel-heading">
              <span>GitHub issue</span>
              <small>Ask AI</small>
            </div>
            <p
              data-enhanced-copy="ask"
              data-enhanced-copy-title="Enhanced Copy issue draft"
              data-enhanced-copy-url={`${productUrl}/issues/new`}
              data-enhanced-copy-label="GitHub issue"
            >
              {issueText}
            </p>
          </article>

          <article>
            <div className="panel-heading">
              <span>Community post</span>
              <small>Share</small>
            </div>
            <p
              data-enhanced-copy="share"
              data-enhanced-copy-title="Community launch draft"
              data-enhanced-copy-url="https://community.example.com/thread/enhanced-copy"
              data-enhanced-copy-label="Community post"
            >
              {communityPost}
            </p>
          </article>
        </div>
      </section>

      <section className="extension" aria-label="Extension story">
        <div>
          <p className="section-kicker">Chrome extension</p>
          <h2>Works on arbitrary pages after explicit selection.</h2>
          <p>
            Context menu, popup, and shortcut all use activeTab. No persistent content script. No global copy hijack.
            Recent enhanced outputs behave like a tiny clipboard manager, but only for explicit Enhanced Copy actions.
          </p>
        </div>
        <div className="popup-mock" aria-label="Extension popup mock">
          <header>
            <strong>Enhanced Copy</strong>
            <span>Run enhanced copy or ask your model</span>
          </header>
          <label>
            Action
            <select defaultValue="debug">
              <option>debug</option>
            </select>
          </label>
          <label>
            Destination
            <select defaultValue="ollama">
              <option>Ollama local</option>
            </select>
          </label>
          <div className="cta-row">
            <button type="button">Enhanced Copy</button>
            <button type="button">Ask Model</button>
          </div>
          <div className="recent-line">Recent Enhanced Copy: API debugging context</div>
        </div>
      </section>

      <section className="different" aria-label="How Enhanced Copy is different">
        <div className="section-headline">
          <p className="section-kicker">Why this is different</p>
          <h2>Not a bubble. Not a prompt library. Not a clipboard vacuum.</h2>
        </div>
        <div className="matrix">
          <div>
            <strong>Explain button</strong>
            <p>Answers in place. Good for one site. Bad when the user wants a different model, editor, issue tracker, or private gateway.</p>
          </div>
          <div>
            <strong>Clipboard manager</strong>
            <p>Stores copy history. Useful, but it does not know the task, source URL, content type, or intended AI action.</p>
          </div>
          <div>
            <strong>Prompt library</strong>
            <p>Stores templates. It still makes users manually paste content and stitch source context together.</p>
          </div>
          <div>
            <strong>Enhanced Copy</strong>
            <p>Turns the exact selected source into structured, portable, AI-ready text through an SDK and extension.</p>
          </div>
        </div>
      </section>

      <section className="api" aria-label="SDK and destination API">
        <div>
          <p className="section-kicker">SDK</p>
          <h2>One attribute for docs teams. One destination API for power users.</h2>
          <p>Copy by default. Ask Chrome AI, Ollama, OpenAI-compatible APIs, Anthropic, Gemini, or webhooks when configured.</p>
        </div>
        <div className="code-grid">
          <pre>
            <code>{sdkCode}</code>
          </pre>
          <pre>
            <code>{destinationCode}</code>
          </pre>
        </div>
      </section>

      <section className="api" aria-label="CDN and stack setup">
        <div>
          <p className="section-kicker">No-build install</p>
          <h2>Serve the button from GitHub Pages.</h2>
          <p>
            Drop in one CDN script, mark blocks with data attributes, and let power users connect clipboard managers,
            LiteLLM, Ollama, Chrome AI, or their team gateway.
          </p>
        </div>
        <div className="code-grid">
          <pre>
            <code>{cdnCode}</code>
          </pre>
          <div className="stack-list">
            <span>CDN button</span>
            <span>Chrome extension</span>
            <span>LiteLLM gateway</span>
            <span>Ollama local models</span>
            <span>Maccy / PowerToys / CopyQ</span>
            <span>Android via share sheet later</span>
          </div>
        </div>
      </section>
    </main>
  );
}
