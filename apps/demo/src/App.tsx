import { useEffect } from "react";
import { createEnhancedCopy } from "@enhanced-copy/core";
import { EnhancedCopyButton } from "@enhanced-copy/react";

const docsText =
  "Enhanced Copy adds source, intent, and selected content to the clipboard so copied docs become useful when pasted into AI tools.";

const codeText = `async function loadUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) throw new Error("Could not load users");
  return response.json();
}`;

const issueText =
  "Bug: Cmd+Shift+C works on docs pages, but selected code snippets sometimes lose indentation after being pasted into a GitHub issue.";

const redditText =
  "I built a tiny extension that turns selected docs text into an AI-ready explanation prompt. Would developers use this instead of copy/pasting raw docs?";

const linkedInText =
  "Enhanced Copy is a small UX shift: instead of adding another AI answer widget, let users copy richer context and paste it into the AI workspace they already trust.";

const sites = [
  {
    name: "GitHub",
    action: "Summarize",
    text: issueText,
    attr: "summarize"
  },
  {
    name: "Reddit",
    action: "Ask AI",
    text: redditText,
    attr: "ask"
  },
  {
    name: "LinkedIn",
    action: "Share",
    text: linkedInText,
    attr: "share"
  }
];

export function App() {
  useEffect(() => {
    const controller = createEnhancedCopy({
      mode: "all",
      action: "explain",
      includeTitle: true,
      includeSourceUrl: true
    });

    return () => controller.destroy();
  }, []);

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Enhanced Copy // clipboard manager // AI paste cannon</p>
          <h1 id="hero-title">Copy just became a power tool.</h1>
          <p className="lede">
            Select anything. Hit the bubble, shortcut, context menu, or override copy. The clipboard gets
            source, intent, formatting, and a local history trail you can search later.
          </p>
          <div className="hero-actions" aria-label="Primary demo actions">
            <EnhancedCopyButton className="primary" content={docsText} action="explain">
              Explain
            </EnhancedCopyButton>
            <EnhancedCopyButton className="danger" content={codeText} action="debug">
              Debug
            </EnhancedCopyButton>
            <EnhancedCopyButton className="electric" content={linkedInText} action="share">
              Share
            </EnhancedCopyButton>
          </div>
        </div>
        <div className="copy-engine" aria-label="Enhanced Copy engine preview">
          <div className="engine-top">
            <span>LIVE COPY BUS</span>
            <strong>ON</strong>
          </div>
          <div className="tracks">
            {Array.from({ length: 30 }, (_, index) => (
              <i key={index} style={{ animationDelay: `${(index % 10) * 0.11}s` }} />
            ))}
          </div>
          <div className="payload">
            <span>source</span>
            <span>intent</span>
            <span>selection</span>
            <span>history</span>
          </div>
        </div>
      </section>

      <section className="command-strip" aria-label="Extension modes">
        <div>
          <span>Shortcut</span>
          <strong>Cmd/Ctrl+Shift+C</strong>
        </div>
        <div>
          <span>Override</span>
          <strong>Opt-in Cmd/Ctrl+C</strong>
        </div>
        <div>
          <span>Manager</span>
          <strong>Local search + pin</strong>
        </div>
        <div>
          <span>Any Site</span>
          <strong>GitHub / Reddit / LinkedIn</strong>
        </div>
      </section>

      <section className="arena" aria-label="Enhanced copy demo blocks">
        <article className="wide">
          <div className="panel-heading">
            <span>Docs block</span>
            <small>Explain</small>
          </div>
          <p data-enhanced-copy="explain">{docsText}</p>
        </article>

        <article className="code-panel">
          <div className="panel-heading">
            <span>Code block</span>
            <small>Debug</small>
          </div>
          <pre data-enhanced-copy="debug">
            <code>{codeText}</code>
          </pre>
        </article>
      </section>

      <section className="site-grid" aria-label="Works anywhere examples">
        {sites.map((site) => (
          <article key={site.name}>
            <div className="panel-heading">
              <span>{site.name}</span>
              <small>{site.action}</small>
            </div>
            <p data-enhanced-copy={site.attr}>{site.text}</p>
          </article>
        ))}
      </section>

      <section className="manager-preview" aria-label="Clipboard manager preview">
        <div>
          <p className="eyebrow">Local memory, no backend</p>
          <h2>Clipboard history without the weird cloud smell.</h2>
          <p>
            Normal copies can be saved, enhanced copies get action badges, likely secrets are redacted, and
            pinned clips stay above the chaos.
          </p>
        </div>
        <div className="history-stack">
          <div>
            <span>explain</span>
            <p>I copied this from React docs at react.dev...</p>
          </div>
          <div>
            <span>plain</span>
            <p>Bug reproduction steps from a GitHub issue...</p>
          </div>
          <div>
            <span>debug</span>
            <p>async function loadUsers() {"{ ... }"}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
