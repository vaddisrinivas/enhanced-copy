import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173"
  });
  await page.goto("/");
});

test("SDK button copies structured enhanced prompt", async ({ page }) => {
  await page.locator(".enhanced-copy-button", { hasText: "Explain" }).first().click();
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("## Source");
  expect(text).toContain("## Task\nExplain this clearly and help me use it.");
  expect(text).toContain("## Copied Content");
  expect(text).toContain("framecraft is an LLM skill and plugin");
  expect(text).toContain("github.com/vaddisrinivas/framecraft");
});

test("normal copy remains normal and not enhanced", async ({ page }) => {
  await page.getByText("framecraft is an LLM skill and plugin").first().selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("framecraft is an LLM skill and plugin");
  expect(text).not.toContain("## Task");
});

test("demo renders SDK-first positioning", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Copy should carry intent." })).toBeVisible();
  await expect(page.getByText("Not a bubble. Not a prompt library. Not a clipboard vacuum.")).toBeVisible();
  await expect(page.locator("[data-enhanced-copy]")).toHaveCount(4);
});

test("Framecraft fixture behaves like an arbitrary website for selection", async ({ page }) => {
  await page.goto("/sites/framecraft.html");
  await expect(page.getByRole("heading", { name: "framecraft" })).toBeVisible();
  await page.locator("[data-copy-target]").selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("framecraft is an LLM skill and plugin");
  expect(text).toContain("github.com/vaddisrinivas/framecraft");
  expect(text).not.toContain("## Task");
});
