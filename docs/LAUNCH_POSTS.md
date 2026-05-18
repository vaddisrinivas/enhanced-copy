# Launch Posts

Use these after the repo, live demo, CDN, CI, license, and extension release are green.

## Hacker News

Title:

```text
Show HN: Enhanced Copy - source-aware copy buttons for AI workflows
```

URL:

```text
https://github.com/vaddisrinivas/enhanced-copy
```

First comment:

```text
I built Enhanced Copy because I kept copying docs/code into model chats and then retyping the same wrapper: explain this, debug this, include source, treat this as quoted content.

It is a small open-source SDK/CDN button plus a Chromium extension prototype. Normal copy stays normal. Enhanced Copy is explicit: click Explain, Debug, Summarize, Ask, or Share, and it copies selected content with source URL, title, content type, task, and a prompt-injection boundary.

What works today:
- Live demo and CDN script from GitHub Pages
- Attribute-based docs integration
- Chromium extension build/release zip
- Clipboard output
- Optional model/API destinations with per-origin permission request
- LiteLLM/Ollama example config

What is not done:
- npm packages are not published yet
- Chrome Web Store listing is not done
- Mobile is only a direction, not shipped
- No hosted backend, accounts, analytics, sync, or model proxy

I am especially interested in feedback on whether this should stay a tiny copy/prompt rendering layer, or grow into a broader clipboard/model workflow tool.
```

## Reddit

Recommended subreddit: `r/webdev` or `r/LocalLLaMA`.

Title:

```text
I built a small open-source SDK/extension for source-aware copy actions
```

Body:

```text
I built an MVP called Enhanced Copy.

The idea: normal copy stays normal, but explicit actions like Explain / Debug / Summarize / Ask / Share copy a richer text payload:

- source URL/title
- content type
- selected content
- task
- prompt-injection boundary

There is a CDN script for docs/blogs, and a Chromium extension prototype for selected text on arbitrary pages. I also added LiteLLM/Ollama config examples for people running local models.

Live demo:
https://vaddisrinivas.github.io/enhanced-copy/

Repo:
https://github.com/vaddisrinivas/enhanced-copy

Still early:
- npm packages are not published yet
- Chrome Web Store listing is not done
- extension release is a ZIP/unpacked install
- no backend/accounts/analytics/model proxy

Would love feedback on the product boundary. Should this stay a tiny SDK/CDN layer, or is there a real power-user workflow around local models + clipboard managers?
```

## LinkedIn

```text
I built an MVP called Enhanced Copy.

It is an open-source SDK/CDN button and Chromium extension prototype for source-aware copy actions.

The problem:
People copy docs, code, issues, and posts into AI tools, then manually add the same wrapper every time: explain this, debug this, include the source, treat this as quoted content.

Enhanced Copy keeps normal copy untouched. But explicit actions like Explain, Debug, Summarize, Ask, and Share copy a richer payload:

- source URL/title
- content type
- selected content
- task
- prompt-injection boundary

What works now:
- live GitHub Pages demo
- CDN script for docs/blogs
- Chromium extension build
- release ZIP for unpacked install
- optional model/API destinations
- LiteLLM/Ollama setup examples

Still early:
- npm packages are not published yet
- no Chrome Web Store listing yet
- no backend, accounts, analytics, sync, or hosted model proxy

Demo:
https://vaddisrinivas.github.io/enhanced-copy/

Repo:
https://github.com/vaddisrinivas/enhanced-copy

Curious where people think the boundary should be: tiny SDK for better copy buttons, or a broader clipboard/model workflow for power users?
```
