# Recommended Stack

Enhanced Copy should stay tiny. The maxed-out experience comes from integration, not from turning this repo into a giant app.

## Product Rule

Do not own every layer.

Enhanced Copy owns:

- source-aware prompt rendering
- explicit copy actions
- extension action surface
- user-provided destination configuration
- docs-team SDK and CDN button

Enhanced Copy should not own:

- full clipboard history
- hosted model proxy
- account system
- mobile background clipboard sync
- enterprise secrets storage
- analytics pipeline

## Install Profiles

| Profile | Who | Install |
| --- | --- | --- |
| Docs Lite | docs teams, blogs, component libraries | CDN script + `data-enhanced-copy` attributes |
| DevRel | docs teams with npm pipeline | local workspace packages today; npm publish later |
| Power User | developers on arbitrary sites | Chrome extension + local clipboard manager |
| Local AI | privacy-first developers | Chrome extension + Ollama + LiteLLM proxy |
| Team Gateway | companies | extension/API URL pointed at internal LiteLLM or webhook |
| Mobile | Android/iOS users | share-sheet or keyboard-first companion later, not background clipboard spying |

## Clipboard Layer

Enhanced Copy should interoperate with clipboard managers instead of becoming one.

Recommended defaults:

- macOS: Maccy for lightweight history.
- Windows: PowerToys Advanced Paste for clipboard transforms and optional AI paste workflows.
- Linux/Windows/macOS: CopyQ for cross-platform clipboard history.

Compatibility expectation:

- Enhanced Copy writes plain text to the clipboard after an explicit action.
- Clipboard managers should store that output like any other text copy.
- Sensitive-data policy belongs to the clipboard manager or OS.
- Enhanced Copy should avoid background capture and global clipboard watching.

## AI Layer

Recommended local-first stack:

1. Ollama runs local models on `http://127.0.0.1:11434`.
2. LiteLLM exposes a stable OpenAI-compatible gateway on `http://127.0.0.1:4000`.
3. Enhanced Copy extension points to LiteLLM as an `openai-compatible` destination.
4. Teams can swap LiteLLM routing to OpenAI, Anthropic, Gemini, Bedrock, Azure, OpenRouter, or internal models without changing the browser extension.

Why LiteLLM:

- one API shape for many model providers
- local and hosted routing behind one URL
- team-level keys and policies can live outside the extension
- easier docs: users paste API URL + API key once

Why Ollama:

- local model runtime
- simple localhost API
- works behind LiteLLM or directly through the extension

Why Chrome AI:

- good opt-in path when Chrome exposes local built-in models
- should stay optional because availability is browser/device dependent

## Suggested Power User Setup

```text
Browser: Chrome / Chromium
Extension: Enhanced Copy
Local model: Ollama
Model gateway: LiteLLM
Clipboard manager: Maccy, PowerToys Advanced Paste, or CopyQ
Editor: your code editor
Paste targets: model chats, code editors, issue trackers, community posts, team chat
```

## Team Setup

```text
Docs site
  -> Enhanced Copy CDN/SDK buttons
  -> generated enhanced text copied locally

Developer browser
  -> Enhanced Copy extension
  -> internal LiteLLM URL
  -> team-approved model providers

Security boundary
  -> no secrets in page code
  -> API keys stored in browser session or managed by gateway
  -> source URL and title included by default
```

## Android Direction

Android should not be framed as a background clipboard manager.

Android has privacy restrictions around background clipboard access, and modern Android surfaces clipboard previews/controls to users. Enhanced Copy should respect that.

Better Android shapes:

- share-sheet target: send selected text or shared page text to Enhanced Copy
- keyboard integration: transform selected text from an input field
- browser extension path if Android browsers expose enough extension APIs
- PWA helper for manual paste-in, enhanced-copy-out
- no background clipboard sync as a core promise

## DevRel Extras

Useful things to ship before more product code:

- CDN script URL
- SVG icon and badges
- LiteLLM config examples
- screenshots and demo video
- “works with your clipboard manager” guide
- extension install guide
- local AI setup guide
- sample docs-page HTML fixture
- one-page security/trust model

## Source References

- LiteLLM proxy docs: https://docs.litellm.ai/
- Ollama API docs: https://docs.ollama.com/api
- Chrome Prompt API docs: https://developer.chrome.com/docs/ai/prompt-api
- Microsoft PowerToys Advanced Paste docs: https://learn.microsoft.com/en-us/windows/powertoys/advanced-paste
- Maccy: https://maccy.org/
- CopyQ: https://www.copyq.com/
- Android 13 privacy overview: https://www.android.com/android-13/
