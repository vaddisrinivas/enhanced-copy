import { expect, test, chromium, type BrowserContext } from "@playwright/test";
import path from "node:path";
import type { ClipboardHistoryItem } from "../apps/extension/src/history";

const extensionPath = path.join(process.cwd(), "apps/extension/dist");
const modifier = process.platform === "darwin" ? "Meta" : "Control";

test.describe("Enhanced Copy extension", () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeEach(async ({}, testInfo) => {
    context = await chromium.launchPersistentContext(testInfo.outputPath("user-data"), {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });

    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker", {
        timeout: 10_000
      }));
    extensionId = worker.url().split("/")[2];
    await worker.evaluate(async () => {
      await chrome.storage.local.clear();
      await chrome.storage.local.set({
        capturePlainCopies: true,
        mode: "shortcut",
        showSelectionBubble: true,
        redactLikelySecrets: true
      });
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("captures normal copies from GitHub, Reddit, and LinkedIn-style pages", async () => {
    for (const site of ["github", "reddit", "linkedin"]) {
      const page = await context.newPage();
      await context.grantPermissions(["clipboard-read", "clipboard-write"], {
        origin: "http://127.0.0.1:4173"
      });
      await page.goto(`http://127.0.0.1:4173/sites/${site}.html`);
      await page.locator("[data-copy-target]").selectText();
      await page.keyboard.press(`${modifier}+C`);
      await expect.poll(() => historyCount()).toBeGreaterThan(0);
      await page.close();
    }

    const history = await getHistory();
    expect(history.map((item) => item.title)).toEqual(
      expect.arrayContaining(["GitHub Issue Fixture", "Reddit Thread Fixture", "LinkedIn Post Fixture"])
    );
    expect(history.every((item) => item.kind === "plain")).toBe(true);
  });

  test("selection bubble writes enhanced copy and saves it to manager history", async () => {
    const page = await context.newPage();
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://127.0.0.1:4173"
    });
    await page.goto("http://127.0.0.1:4173/sites/github.html");
    await page.locator("[data-copy-target]").selectText();
    await page.locator(".enhanced-copy-bubble button", { hasText: "Explain" }).click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("Task: Explain this clearly");
    expect(clipboard).toContain("GitHub fixture");

    await expect.poll(() => historyCount()).toBe(1);
    const history = await getHistory();
    expect(history[0].kind).toBe("enhanced");
    expect(history[0].action).toBe("explain");
  });

  test("popup searches, pins, copies, and deletes history items", async () => {
    const page = await context.newPage();
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://127.0.0.1:4173"
    });
    await page.goto("http://127.0.0.1:4173/sites/reddit.html");
    await page.locator("[data-copy-target]").selectText();
    await page.keyboard.press(`${modifier}+C`);
    await expect.poll(() => historyCount()).toBe(1);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.getByText("Reddit fixture")).toBeVisible();

    await popup.getByLabel("Search clipboard history").fill("reddit");
    await expect(popup.getByText("Reddit fixture")).toBeVisible();

    await popup.getByRole("button", { name: "Pin" }).click();
    await expect(popup.getByRole("button", { name: "Unpin" })).toBeVisible();

    await popup.getByRole("button", { name: "Copy" }).click();
    await expect(popup.getByText("History item copied")).toBeVisible();

    await popup.getByRole("button", { name: "Delete" }).click();
    await expect(popup.getByText("Copy text on any normal webpage")).toBeVisible();
  });

  async function getHistory(): Promise<ClipboardHistoryItem[]> {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    return worker.evaluate(async () => {
      const stored = await chrome.storage.local.get({ enhancedCopyHistory: [] });
      return stored.enhancedCopyHistory;
    }) as Promise<ClipboardHistoryItem[]>;
  }

  async function historyCount(): Promise<number> {
    return (await getHistory()).length;
  }
});
