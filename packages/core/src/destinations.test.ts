import { afterEach, describe, expect, it, vi } from "vitest";
import { destinationRequestUrl, sendEnhancedPrompt } from "./destinations";
import type { EnhancedCopyDestination } from "./types";

describe("sendEnhancedPrompt", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { LanguageModel?: unknown }).LanguageModel;
  });

  it("copies prompt text for clipboard destinations", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    const result = await sendEnhancedPrompt({
      content: "copy me",
      destination: { type: "clipboard" },
      clipboard
    });

    expect(result.ok).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("copy me"));
  });

  it("calls Ollama chat with model, prompt, and optional key", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ message: { content: "local answer" } }));

    const result = await sendEnhancedPrompt({
      content: "debug this",
      destination: {
        type: "ollama",
        name: "Local Gemma",
        baseUrl: "http://127.0.0.1:11434",
        model: "gemma3",
        apiKey: "local-key"
      },
      fetch: fetcher
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.responseText).toBe("local answer");
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer local-key" })
      })
    );
    const request = (fetcher.mock.calls as unknown as Array<[string, RequestInit]>)[0][1];
    expect(JSON.parse(request.body as string)).toMatchObject({
      model: "gemma3",
      stream: false,
      messages: [{ role: "user", content: expect.stringContaining("## Copied Content") }]
    });
  });

  it("calls OpenAI-compatible chat completions", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ choices: [{ message: { content: "cloud answer" } }] }));

    const result = await sendEnhancedPrompt({
      content: "summarize this",
      destination: {
        type: "openai-compatible",
        baseUrl: "https://api.example.com/v1",
        apiKey: "sk-test",
        model: "gpt-test"
      },
      fetch: fetcher
    });

    expect(result.ok && result.responseText).toBe("cloud answer");
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" })
      })
    );
  });

  it("calls Anthropic messages with browser opt-in header", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ content: [{ type: "text", text: "claude answer" }] }));

    const result = await sendEnhancedPrompt({
      content: "ask this",
      destination: { type: "anthropic", apiKey: "ant-key", model: "claude-test" },
      fetch: fetcher
    });

    expect(result.ok && result.responseText).toBe("claude answer");
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-api-key": "ant-key",
          "anthropic-dangerous-direct-browser-access": "true"
        })
      })
    );
  });

  it("calls Gemini generateContent with API key header", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ candidates: [{ content: { parts: [{ text: "gemini answer" }] } }] }));

    const result = await sendEnhancedPrompt({
      content: "explain this",
      destination: { type: "gemini", apiKey: "gem-key", model: "gemini-test" },
      fetch: fetcher
    });

    expect(result.ok && result.responseText).toBe("gemini answer");
    expect(fetcher).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-goog-api-key": "gem-key" })
      })
    );
  });

  it("posts portable webhook payloads", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ answer: "hook answer" }));

    const result = await sendEnhancedPrompt({
      content: `ship this ${"x".repeat(40)}`,
      source: { title: "Docs", url: "https://private.example.com/docs" },
      options: {
        action: "share",
        maxChars: 12,
        includeSourceUrl: false,
        destinations: [{ apiKey: "leak-me" }]
      } as never,
      destination: { type: "webhook", url: "https://hooks.example.com/enhance", apiKey: "hook-key" },
      fetch: fetcher
    });

    const request = (fetcher.mock.calls as unknown as Array<[string, RequestInit]>)[0][1];
    const body = JSON.parse(request.body as string);
    expect(result.ok && result.responseText).toBe("hook answer");
    expect(body).toMatchObject({
      action: "share",
      prompt: expect.stringContaining("## Task"),
      source: { title: "Docs" },
      content: "ship this xx",
      options: {
        action: "share",
        maxChars: 12,
        includeSourceUrl: false
      }
    });
    expect(JSON.stringify(body)).not.toContain("leak-me");
    expect(JSON.stringify(body)).not.toContain("private.example.com");
  });

  it("does not return success when a provider response has no answer text", async () => {
    const result = await sendEnhancedPrompt({
      content: "empty",
      destination: { type: "webhook", url: "https://hooks.example.com/enhance" },
      fetch: vi.fn(async () => jsonResponse({ ok: true }))
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.message).toContain("No text response");
    expect(!result.ok && result.raw).toEqual({ ok: true });
  });

  it("keeps status and raw payload on failed HTTP requests", async () => {
    const result = await sendEnhancedPrompt({
      content: "fail",
      destination: { type: "openai-compatible", baseUrl: "https://api.example.com/v1", apiKey: "sk", model: "gpt" },
      fetch: vi.fn(async () => jsonResponse({ error: { message: "bad key" } }, 401))
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.status).toBe(401);
    expect(!result.ok && result.raw).toEqual({ error: { message: "bad key" } });
  });

  it("uses Chrome built-in AI when available", async () => {
    const destroy = vi.fn();
    (globalThis as typeof globalThis & { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn(async () => "available"),
      create: vi.fn(async () => ({ prompt: vi.fn(async () => "nano answer"), destroy }))
    };

    const result = await sendEnhancedPrompt({
      content: "local browser",
      destination: { type: "chrome-ai", systemPrompt: "Be concise" }
    });

    expect(result.ok && result.responseText).toBe("nano answer");
    expect(destroy).toHaveBeenCalled();
  });

  it("supports SDK-only custom destination executors", async () => {
    const send = vi.fn(async ({ prompt }: { prompt: string }) => ({
      responseText: `custom: ${prompt.includes("## Task")}`,
      raw: { provider: "mine" },
      status: 299
    }));

    const result = await sendEnhancedPrompt({
      content: "route this",
      destination: { type: "custom", name: "My provider", send }
    });

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining("route this") }));
    expect(result).toMatchObject({
      ok: true,
      destination: "custom",
      responseText: "custom: true",
      status: 299,
      raw: { provider: "mine" }
    });
  });

  it("returns request URLs for permission prompts", () => {
    const destinations: EnhancedCopyDestination[] = [
      { type: "clipboard" },
      { type: "chrome-ai" },
      { type: "custom", send: async () => ({ responseText: "ok" }) },
      { type: "ollama", baseUrl: "http://127.0.0.1:11434", model: "gemma3" },
      { type: "webhook", url: "https://api.example.com/hook" }
    ];

    expect(destinations.map(destinationRequestUrl)).toEqual([
      undefined,
      undefined,
      undefined,
      "http://127.0.0.1:11434/api/chat",
      "https://api.example.com/hook"
    ]);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
