# Enhanced Copy

Drop-in SDK for adding AI-ready copy buttons and model destinations to docs, code blocks, support articles, changelogs, and issue templates.

Enhanced Copy does **not** watch the clipboard. It renders a structured prompt and then either copies it, asks Chrome's local model, calls Ollama, or sends it to a user-configured API/webhook after an explicit user action.

## Product Wedge

Add **Explain / Debug / Summarize / Ask Prompt / Share** actions to any content block in minutes.

```html
<p data-enhanced-copy="explain">
  Your docs content here.
</p>
```

```ts
import { mountEnhancedCopy } from "@enhanced-copy/core";

mountEnhancedCopy();
```

## Packages

- `@enhanced-copy/core`: prompt renderer, clipboard copy helper, explicit SDK mount.
- `@enhanced-copy/react`: React button wrapper.
- `apps/demo`: SDK-first demo site.
- `apps/extension`: optional Chromium dogfood extension using `activeTab`; no persistent content script.

## Core API

```ts
import { copyEnhancedPrompt, renderEnhancedPrompt, sendEnhancedPrompt } from "@enhanced-copy/core";

const text = renderEnhancedPrompt({
  content: "fetch('/api/users')",
  source: {
    title: "Fetch docs",
    url: "https://example.com/docs",
    contentType: "code",
    language: "ts"
  },
  options: { action: "debug" }
});

await copyEnhancedPrompt({ content: "Explain this", options: { action: "explain" } });

const result = await sendEnhancedPrompt({
  content: "fetch('/api/users')",
  options: { action: "debug" },
  destination: {
    type: "openai-compatible",
    baseUrl: "https://your-gateway.com/v1",
    apiKey: userProvidedKey,
    model: "gpt-4o-mini"
  }
});
```

Rendered prompts include:

- source block
- task block
- fenced copied content
- max character truncation
- prompt-injection safety note

## Destinations

The default destination is `clipboard`. Optional destinations:

- `chrome-ai`: Chrome built-in Gemini Nano Prompt API when available.
- `ollama`: `http://127.0.0.1:11434/api/chat` style local models.
- `openai-compatible`: OpenAI, OpenRouter, LiteLLM, and compatible gateways.
- `anthropic`: Claude Messages API.
- `gemini`: Gemini `generateContent`.
- `webhook`: generic `POST` to your API URL.
- `custom`: SDK-only executor function for providers not built into core.

Webhook body:

```json
{
  "action": "explain",
  "prompt": "...",
  "source": { "title": "...", "url": "..." },
  "content": "..."
}
```

Webhook privacy rules:

- `content` is truncated with the same `maxChars` limit as the prompt.
- `source.title` and `source.url` obey `includeTitle` / `includeSourceUrl`.
- `options` is sanitized to render options only; extension settings and destination keys are never included.

## Extension

The extension is not the product. It is a reference/dogfood surface.

- Uses `activeTab` + `scripting`.
- No `<all_urls>` host permission.
- No optional host permissions.
- No persistent content script.
- No background normal-copy capture.
- Copies only selected text after popup/context-menu/shortcut action.
- Shortcut uses `Alt+Shift+C` because Chromium leaves `Command+Shift+C` unassigned in common dev-tool conflicts.
- Users can add API URL + API key destinations. Endpoints must allow browser-extension CORS.
- Destination URLs are HTTPS-only, except localhost HTTP for Ollama/local gateways.
- API keys are BYOK and session-only. They are kept in `chrome.storage.session`, never persisted to `chrome.storage.local`.
- Native Anthropic/Gemini destinations use official API origins. Custom gateways should use `webhook` or `openai-compatible`.

Build and load unpacked:

```bash
npm run build -w apps/extension
```

Load `apps/extension/dist` in Chromium.

## Development

```bash
npm install
npm run build
npm run test
npm run test:e2e
npm run dev
```
