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
      content: "ship this",
      source: { title: "Docs" },
      options: { action: "share" },
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
      content: "ship this"
    });
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

  it("returns request URLs for permission prompts", () => {
    const destinations: EnhancedCopyDestination[] = [
      { type: "clipboard" },
      { type: "chrome-ai" },
      { type: "ollama", baseUrl: "http://127.0.0.1:11434", model: "gemma3" },
      { type: "webhook", url: "https://api.example.com/hook" }
    ];

    expect(destinations.map(destinationRequestUrl)).toEqual([
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
