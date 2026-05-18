import { useEffect } from "react";
import { mountEnhancedCopy, renderEnhancedPrompt } from "@enhanced-copy/core";
import { EnhancedCopyButton } from "@enhanced-copy/react";

const framecraftUrl = "https://github.com/vaddisrinivas/framecraft";

const framecraftDocs = `framecraft is an LLM skill and plugin for creating polished demo videos. You describe what you want; your LLM writes the HTML scenes, narration, and config, then framecraft renders everything into a real video. It is not a framework. It is a pipeline that gives your LLM the tools to produce real video.`;

const framecraftInstall = `claude plugin marketplace add vaddisrinivas/framecraft
claude plugin install framecraft
uv run playwright install chromium`;

const framecraftIssue = `GitHub issue draft:
Framecraft demo render looks correct locally, but the CI artifact misses voiceover on the second scene. Need a debugging prompt that preserves repo URL, install steps, output format, and exact failure context.`;

const redditPost = `I keep copying README chunks into ChatGPT and then typing "explain this" again. The copy event should carry the task, source URL, and selected content so paste targets get useful context immediately.`;

const linkedInPost = `Every docs page already has Copy. The AI-era version is not "answer here." It is "copy with enough intent that the user can paste anywhere."`;

const rawCopy = `framecraft is an LLM skill and plugin for creating polished demo videos. You describe what you want; your LLM writes the HTML scenes...`;

const enhancedPreview = renderEnhancedPrompt({
  content: framecraftDocs,
  source: {
    title: "framecraft README",
    url: framecraftUrl,
    label: "Product README excerpt",
    contentType: "markdown"
  },
  options: { action: "explain", maxChars: 4000 }
});

const destinationCode = `await sendEnhancedPrompt({
  content: selection,
  source: {
    title: document.title,
    url: location.href,
    label: "Framecraft docs block"
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
  data-enhanced-copy-title="framecraft README"
  data-enhanced-copy-url="https://github.com/vaddisrinivas/framecraft">
  ...
</article>

import { mountEnhancedCopy } from "@enhanced-copy/core";

mountEnhancedCopy({
  buttonLabel: "Explain",
  observe: true
});`;

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
          <p className="eyebrow">Enhanced Copy for AI-era docs, repos, and posts</p>
          <h1 id="hero-title">Copy should carry intent.</h1>
          <p className="lede">
            Users already copy your docs into ChatGPT, Claude, Cursor, GitHub, Reddit, and LinkedIn.
            Enhanced Copy turns that copy into source-aware, task-aware text they can paste anywhere.
          </p>
          <div className="hero-actions">
            <EnhancedCopyButton
              className="primary"
              content={framecraftDocs}
              action="explain"
              source={{ title: "framecraft README", url: framecraftUrl, label: "README excerpt", contentType: "markdown" }}
            >
              Explain Framecraft
            </EnhancedCopyButton>
            <EnhancedCopyButton
              className="danger"
              content={framecraftInstall}
              action="debug"
              source={{ title: "framecraft install", url: framecraftUrl, label: "Install commands", contentType: "code", language: "bash" }}
            >
              Debug Install
            </EnhancedCopyButton>
            <EnhancedCopyButton
              className="electric"
              content={linkedInPost}
              action="share"
              source={{ title: "Enhanced Copy launch note", url: window.location.href, label: "LinkedIn draft" }}
            >
              Share
            </EnhancedCopyButton>
          </div>
          <div className="metrics" aria-label="Product constraints">
            <span>No model calls by default</span>
            <span>No background clipboard capture</span>
            <span>SDK first, extension second</span>
          </div>
        </div>

        <div className="hero-stage" aria-label="Framecraft enhanced copy demo">
          <div className="browser-top">
            <span />
            <span />
            <span />
            <strong>github.com/vaddisrinivas/framecraft</strong>
          </div>
          <img src="/framecraft-demo-preview.gif" alt="Framecraft demo preview" />
          <div className="copy-rail">
            <strong>Selected README text</strong>
            <p>{rawCopy}</p>
            <span>Enhanced Copy adds the missing task, source, and safety wrapper.</span>
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
          <p>The right paste target might be ChatGPT, Claude, Cursor, GitHub, Reddit, Slack, Ollama, or a private gateway.</p>
        </div>
      </section>

      <section className="world" aria-label="Framecraft examples">
        <div className="section-headline">
          <p className="section-kicker">Real repo demo</p>
          <h2>Framecraft becomes an AI-ready documentation surface.</h2>
          <p>
            This page uses <a href={framecraftUrl}>github.com/vaddisrinivas/framecraft</a> as the demo subject:
            README copy, install commands, issue context, Reddit phrasing, and launch sharing.
          </p>
        </div>

        <div className="arena">
          <article>
            <div className="panel-heading">
              <span>README excerpt</span>
              <small>Explain</small>
            </div>
            <p
              data-enhanced-copy="explain"
              data-enhanced-copy-title="framecraft README"
              data-enhanced-copy-url={framecraftUrl}
              data-enhanced-copy-label="README positioning"
            >
              {framecraftDocs}
            </p>
          </article>

          <article>
            <div className="panel-heading">
              <span>Install block</span>
              <small>Debug</small>
            </div>
            <pre
              data-enhanced-copy="debug"
              data-enhanced-copy-type="code"
              data-enhanced-copy-title="framecraft install"
              data-enhanced-copy-url={framecraftUrl}
              data-enhanced-copy-label="Install commands"
            >
              <code className="language-bash">{framecraftInstall}</code>
            </pre>
          </article>

          <article>
            <div className="panel-heading">
              <span>GitHub issue</span>
              <small>Ask AI</small>
            </div>
            <p
              data-enhanced-copy="ask"
              data-enhanced-copy-title="framecraft issue draft"
              data-enhanced-copy-url={`${framecraftUrl}/issues/new`}
              data-enhanced-copy-label="GitHub issue"
            >
              {framecraftIssue}
            </p>
          </article>

          <article>
            <div className="panel-heading">
              <span>Reddit post</span>
              <small>Share</small>
            </div>
            <p
              data-enhanced-copy="share"
              data-enhanced-copy-title="Reddit launch draft"
              data-enhanced-copy-url="https://reddit.com/r/webdev"
              data-enhanced-copy-label="Reddit post"
            >
              {redditPost}
            </p>
          </article>
        </div>
      </section>

      <section className="extension" aria-label="Extension story">
        <div>
          <p className="section-kicker">Chrome extension</p>
          <h2>Works on any website after the user selects text.</h2>
          <p>
            Context menu, popup, and shortcut all use activeTab. No persistent content script. No global copy hijack.
            Recent enhanced prompts behave like a tiny clipboard manager, but only for explicit enhanced-copy actions.
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
          <div className="recent-line">Recent Enhanced Copy: framecraft CI voiceover debug</div>
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
            <p>Answers in place. Good for one site. Bad when the user wants Claude, Cursor, GitHub, or a private model.</p>
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
    </main>
  );
}
