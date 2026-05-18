# Enhanced Copy

Enhanced Copy upgrades copied content with source, intent, formatting, and local clipboard history so it can be pasted into ChatGPT, Claude, Cursor, GitHub, Reddit, LinkedIn, or any other text surface.

V1 has no backend and makes no model calls. It only renders enhanced clipboard text.

## Packages

- `@enhanced-copy/core`: renderer, vanilla SDK, clipboard UI fallback.
- `@enhanced-copy/react`: React button wrapper.
- `apps/demo`: Vite demo site.
- `apps/extension`: Chromium extension with selection bubble, context menu, shortcuts, opt-in copy override, and local clipboard manager.

## Quick Start

```bash
npm install
npm run build
npm run test
npm run dev
```

## SDK

```ts
import { createEnhancedCopy } from "@enhanced-copy/core";

createEnhancedCopy({
  mode: "all",
  action: "explain",
  includeTitle: true,
  includeSourceUrl: true
});
```

Any element with `data-enhanced-copy` gets an Enhanced Copy affordance:

```html
<pre data-enhanced-copy="debug">...</pre>
```

## Extension

Build the extension:

```bash
npm run build -w apps/extension
```

Load `apps/extension/dist` as an unpacked Chromium extension.

The extension stores history locally in Chrome storage. It captures normal copy events on regular webpages when enabled, but Chrome does not allow content scripts on browser-internal pages like `chrome://` or the Chrome Web Store.
