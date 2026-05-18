import { describe, expect, it } from "vitest";
import { DEFAULT_EXTENSION_SETTINGS, destinationFromForm, destinationPermissionPattern, validateDestinationNetwork } from "./shared";

describe("extension settings", () => {
  it("defaults to explicit prompt copy with clipboard destination", () => {
    expect(DEFAULT_EXTENSION_SETTINGS.action).toBe("explain");
    expect(DEFAULT_EXTENSION_SETTINGS.rememberRecentPrompts).toBe(false);
    expect(DEFAULT_EXTENSION_SETTINGS.includeSafetyNote).toBe(true);
    expect(DEFAULT_EXTENSION_SETTINGS.defaultDestinationId).toBe("clipboard");
  });

  it("builds user-provided destinations from form fields", () => {
    expect(
      destinationFromForm({
        name: "Local Ollama",
        type: "ollama",
        apiUrl: "http://127.0.0.1:11434",
        apiKey: "",
        model: "gemma3"
      })
    ).toMatchObject({
      name: "Local Ollama",
      type: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma3",
      sessionOnly: true
    });

    expect(
      destinationFromForm({
        name: "LiteLLM",
        type: "openai-compatible",
        apiUrl: "https://llm.example.com/v1",
        apiKey: "test-api-key",
        model: "gpt-test"
      })
    ).toMatchObject({
      type: "openai-compatible",
      baseUrl: "https://llm.example.com/v1",
      apiKey: "test-api-key",
      model: "gpt-test"
    });
  });

  it("converts destination URLs into exact optional permission origins", () => {
    expect(destinationPermissionPattern({ type: "clipboard" })).toBeUndefined();
    expect(destinationPermissionPattern({ type: "chrome-ai" })).toBeUndefined();
    expect(destinationPermissionPattern({ type: "webhook", url: "https://api.example.com/path", apiKey: "x" })).toBe(
      "https://api.example.com/*"
    );
    expect(destinationPermissionPattern({ type: "ollama", baseUrl: "http://127.0.0.1:11434", model: "gemma3" })).toBe("http://127.0.0.1/*");
    expect(destinationPermissionPattern({ type: "webhook", url: "http://api.example.com/path", apiKey: "x" })).toBeUndefined();
    expect(validateDestinationNetwork({ type: "webhook", url: "http://api.example.com/path", apiKey: "x" })).toContain("HTTPS");
  });
});
