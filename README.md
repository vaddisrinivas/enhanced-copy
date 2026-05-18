# Enhanced Copy

Drop-in SDK for adding AI-ready copy buttons to docs, code blocks, support articles, changelogs, and issue templates.

Enhanced Copy does **not** answer in-place and does **not** watch the clipboard. It renders a structured prompt and writes it to the clipboard only after an explicit user action.

## Product Wedge

Add **Explain / Debug / Summarize / Ask AI / Share** copy buttons to any content block in minutes.

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
import { copyEnhancedPrompt, renderEnhancedPrompt } from "@enhanced-copy/core";

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
```

Rendered prompts include:

- source block
- task block
- fenced copied content
- max character truncation
- prompt-injection safety note

## Extension

The extension is not the product. It is a reference/dogfood surface.

- Uses `activeTab` + `scripting`.
- No `<all_urls>` host permission.
- No persistent content script.
- No background normal-copy capture.
- Copies only selected text after popup/context-menu/shortcut action.
- Shortcut uses `Alt+Shift+C` because Chromium leaves `Command+Shift+C` unassigned in common dev-tool conflicts.

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
