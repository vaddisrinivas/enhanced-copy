# Integrations

These are setup artifacts, not product code.

Goal: let power users and teams wire Enhanced Copy into their existing clipboard and AI stack with as little custom work as possible.

## Included

- `litellm/docker-compose.yml` - local LiteLLM proxy.
- `litellm/config.example.yaml` - example routes for Ollama and OpenAI-compatible providers.

## Recommended Flow

1. Run Ollama locally.
2. Run LiteLLM with the example config.
3. Add a destination in the Enhanced Copy extension:

```text
Provider shape: OpenAI-compatible
Base URL: http://127.0.0.1:4000/v1
Model: local-default
API key: value of LITELLM_MASTER_KEY
```

4. Select text on any page.
5. Click Enhanced Copy or Ask Model.

Use the team gateway shape when you want policy, logging, budgets, and provider routing outside the browser extension.
