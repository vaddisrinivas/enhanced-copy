# Launch Posts

Use these after the repo, live demo, CDN, CI, license, and extension release are green.

## Submit Links

Review before posting. These are public surfaces.

- Hacker News prefill: https://news.ycombinator.com/submitlink?u=https%3A%2F%2Fgithub.com%2Fvaddisrinivas%2Fenhanced-copy&t=Show%20HN%3A%20Enhanced%20Copy%20-%20source-aware%20copy%20buttons%20for%20AI%20workflows
- Reddit `r/webdev` prefill: https://www.reddit.com/r/webdev/submit?type=TEXT&title=I%20built%20a%20small%20open-source%20SDK%2Fextension%20for%20source-aware%20copy%20actions&text=I%20built%20an%20MVP%20called%20Enhanced%20Copy.%0A%0AThe%20idea%3A%20normal%20copy%20stays%20normal%2C%20but%20explicit%20actions%20like%20Explain%20%2F%20Debug%20%2F%20Summarize%20%2F%20Ask%20%2F%20Share%20copy%20a%20richer%20text%20payload%3A%0A%0A-%20source%20URL%2Ftitle%0A-%20content%20type%0A-%20selected%20content%0A-%20task%0A-%20prompt-injection%20boundary%0A%0AThere%20is%20a%20CDN%20script%20for%20docs%2Fblogs%2C%20and%20a%20Chromium%20extension%20prototype%20for%20selected%20text%20on%20arbitrary%20pages.%20I%20also%20added%20LiteLLM%2FOllama%20config%20examples%20for%20people%20running%20local%20models.%0A%0ALive%20demo%3A%0Ahttps%3A%2F%2Fvaddisrinivas.github.io%2Fenhanced-copy%2F%0A%0ARepo%3A%0Ahttps%3A%2F%2Fgithub.com%2Fvaddisrinivas%2Fenhanced-copy%0A%0AStill%20early%3A%0A-%20npm%20packages%20are%20not%20published%20yet%0A-%20Chrome%20Web%20Store%20listing%20is%20not%20done%0A-%20extension%20release%20is%20a%20ZIP%2Funpacked%20install%0A-%20no%20backend%2Faccounts%2Fanalytics%2Fmodel%20proxy%0A%0AWould%20love%20feedback%20on%20the%20product%20boundary.%20Should%20this%20stay%20a%20tiny%20SDK%2FCDN%20layer%2C%20or%20is%20there%20a%20real%20power-user%20workflow%20around%20local%20models%20%2B%20clipboard%20managers%3F
- Reddit `r/LocalLLaMA` prefill: https://www.reddit.com/r/LocalLLaMA/submit?type=TEXT&title=I%20built%20a%20small%20open-source%20SDK%2Fextension%20for%20source-aware%20copy%20actions&text=I%20built%20an%20MVP%20called%20Enhanced%20Copy.%0A%0AThe%20idea%3A%20normal%20copy%20stays%20normal%2C%20but%20explicit%20actions%20like%20Explain%20%2F%20Debug%20%2F%20Summarize%20%2F%20Ask%20%2F%20Share%20copy%20a%20richer%20text%20payload%3A%0A%0A-%20source%20URL%2Ftitle%0A-%20content%20type%0A-%20selected%20content%0A-%20task%0A-%20prompt-injection%20boundary%0A%0AThere%20is%20a%20CDN%20script%20for%20docs%2Fblogs%2C%20and%20a%20Chromium%20extension%20prototype%20for%20selected%20text%20on%20arbitrary%20pages.%20I%20also%20added%20LiteLLM%2FOllama%20config%20examples%20for%20people%20running%20local%20models.%0A%0ALive%20demo%3A%0Ahttps%3A%2F%2Fvaddisrinivas.github.io%2Fenhanced-copy%2F%0A%0ARepo%3A%0Ahttps%3A%2F%2Fgithub.com%2Fvaddisrinivas%2Fenhanced-copy%0A%0AStill%20early%3A%0A-%20npm%20packages%20are%20not%20published%20yet%0A-%20Chrome%20Web%20Store%20listing%20is%20not%20done%0A-%20extension%20release%20is%20a%20ZIP%2Funpacked%20install%0A-%20no%20backend%2Faccounts%2Fanalytics%2Fmodel%20proxy%0A%0AWould%20love%20feedback%20on%20the%20product%20boundary.%20Should%20this%20stay%20a%20tiny%20SDK%2FCDN%20layer%2C%20or%20is%20there%20a%20real%20power-user%20workflow%20around%20local%20models%20%2B%20clipboard%20managers%3F

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
