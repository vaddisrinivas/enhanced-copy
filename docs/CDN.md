# CDN Button

Use this when you want Enhanced Copy without an npm install, build step, or framework integration. You still mark the content blocks you want upgraded.

## One Script

```html
<script
  defer
  src="https://vaddisrinivas.github.io/enhanced-copy/cdn/enhanced-copy.cdn.js"
  data-enhanced-copy-button-label="Enhanced Copy">
</script>
```

Then mark blocks:

```html
<p
  data-enhanced-copy="explain"
  data-enhanced-copy-title="SDK docs"
  data-enhanced-copy-url="https://docs.example.com/sdk">
  Your docs text here.
</p>

<pre
  data-enhanced-copy="debug"
  data-enhanced-copy-type="code"
  data-enhanced-copy-title="API example"
  data-enhanced-copy-url="https://docs.example.com/api">
fetch("/api/users")
</pre>
```

That is the default no-build-step install path for docs/blogs/product pages.

## Script Options

| Attribute | Default | Use |
| --- | --- | --- |
| `data-enhanced-copy-auto` | `true` | Set to `false` if you want to mount manually. |
| `data-enhanced-copy-action` | `explain` | Fallback action when a block omits `data-enhanced-copy`. |
| `data-enhanced-copy-button-label` | action label | Override button label globally. |
| `data-enhanced-copy-selector` | `[data-enhanced-copy]` | Mount on a custom selector. |
| `data-enhanced-copy-include-title` | `true` | Include page title/source title. |
| `data-enhanced-copy-include-source-url` | `true` | Include source URL. |
| `data-enhanced-copy-include-safety-note` | `true` | Include copied-content safety boundary. |

## Manual Mode

```html
<script
  defer
  src="https://vaddisrinivas.github.io/enhanced-copy/cdn/enhanced-copy.cdn.js"
  data-enhanced-copy-auto="false">
</script>
```

After the script loads, `window.EnhancedCopy` exposes:

- `mountEnhancedCopy`
- `createEnhancedCopy`
- `renderEnhancedPrompt`
- `copyEnhancedPrompt`
- `sendEnhancedPrompt`
- `icon`

## Brand Asset

Use the icon from:

```text
https://vaddisrinivas.github.io/enhanced-copy/assets/enhanced-copy-icon.svg
```

The icon means: copy, source context, AI-ready enhancement.
