import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR =
  "/Users/errol/.gemini/antigravity/brain/55fc87e9-5aef-4089-a2a6-db5dc7efcfc6/screenshots";

const BLUE_RGB = "rgb(22, 93, 252)";
const RED_RGB = "rgb(216, 34, 48)";

async function attachErrorCollectors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      errors.push(`console.${msg.type()}: ${msg.text()}`);
    }
  });
  return errors;
}

async function getMarkColor(page: Page, cellIndex: number) {
  return page
    .getByTestId(`cell-${cellIndex}`)
    .locator("svg")
    .last()
    .evaluate((el) => getComputedStyle(el).color);
}

test.describe("Tic-Tac-Toe E2E", () => {
  test("desktop gameplay, consistent X/O colors, winning line geometry, persistence, and keyboard nav", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await attachErrorCollectors(page);

    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByTestId("game-status")).toContainText("BLUE'S TURN");
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    // Wait briefly for entrance stagger to settle before taking initial screenshot
    await page.waitForTimeout(550);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-initial.png`,
      fullPage: false,
    });

    // Immediate color verification upon placement: X = Electric Blue, O = Vibrant Red
    await page.getByTestId("cell-0").click();
    await expect.poll(() => getMarkColor(page, 0)).toBe(BLUE_RGB);

    await page.getByTestId("cell-3").click();
    await expect.poll(() => getMarkColor(page, 3)).toBe(RED_RGB);

    // Complete Blue win on top row [0, 1, 2]
    await page.getByTestId("cell-1").click();
    await page.getByTestId("cell-4").click();
    await page.getByTestId("cell-2").click();

    await expect(page.getByTestId("game-status")).toContainText("BLUE WINS!");
    await expect(page.getByTestId("score-x")).toHaveText("1");
    await expect(page.getByTestId("score-o")).toHaveText("0");
    await expect(page.getByTestId("score-draws")).toHaveText("0");

    // Post-win clicks must be ignored
    await expect(page.getByTestId("cell-5")).toBeDisabled();
    await page.getByTestId("cell-5").click({ force: true });
    await expect(page.getByTestId("cell-5")).toHaveAttribute(
      "data-playable",
      "false",
    );

    // Verify winning line geometry aligns with cell 0 and cell 2 centers
    await page.waitForTimeout(450);
    const geometry = await page.evaluate(() => {
      const c0 = document
        .querySelector('[data-testid="cell-0"]')
        ?.getBoundingClientRect();
      const c2 = document
        .querySelector('[data-testid="cell-2"]')
        ?.getBoundingClientRect();
      const line = document.querySelector(
        '[data-testid="winning-line"] line',
      );
      if (!c0 || !c2 || !line) return null;
      const lineRect = line.getBoundingClientRect();
      const c0CenterY = c0.top + c0.height / 2;
      const lineCenterY = lineRect.top + lineRect.height / 2;
      return {
        yDelta: Math.abs(c0CenterY - lineCenterY),
        spansHorizontally:
          lineRect.left >= c0.left &&
          lineRect.left <= c0.left + c0.width &&
          lineRect.right >= c2.left &&
          lineRect.right <= c2.right,
      };
    });
    expect(geometry).not.toBeNull();
    expect(geometry!.yDelta).toBeLessThan(6);
    expect(geometry!.spansHorizontally).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-blue-win.png`,
      fullPage: false,
    });

    // New Game resets board, keeps scoreboard, and maintains X/O color identity
    await page.getByRole("button", { name: "New Game" }).click();
    await expect(page.getByTestId("game-status")).toContainText("BLUE'S TURN");
    await expect(page.getByTestId("score-x")).toHaveText("1");

    // Red win on diagonal [0, 4, 8]
    await page.getByTestId("cell-1").click(); // X
    await page.getByTestId("cell-0").click(); // O
    await page.getByTestId("cell-2").click(); // X
    await page.getByTestId("cell-4").click(); // O
    await page.getByTestId("cell-6").click(); // X
    await page.getByTestId("cell-8").click(); // O wins

    await expect(page.getByTestId("game-status")).toContainText("RED WINS!");
    await expect.poll(() => getMarkColor(page, 0)).toBe(RED_RGB);
    await expect.poll(() => getMarkColor(page, 4)).toBe(RED_RGB);
    await expect.poll(() => getMarkColor(page, 8)).toBe(RED_RGB);
    await expect(page.getByTestId("score-o")).toHaveText("1");

    await page.waitForTimeout(450);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-red-win.png`,
      fullPage: false,
    });

    // Draw game
    await page.getByRole("button", { name: "New Game" }).click();
    for (const idx of [0, 1, 2, 4, 3, 5, 7, 6, 8]) {
      await page.getByTestId(`cell-${idx}`).click();
    }
    await expect(page.getByTestId("game-status")).toContainText("IT'S A DRAW!");
    await expect(page.getByTestId("score-draws")).toHaveText("1");

    await page.waitForTimeout(350);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-draw.png`,
      fullPage: false,
    });

    // LocalStorage persistence across reload
    await page.reload();
    await expect(page.getByTestId("score-x")).toHaveText("1");
    await expect(page.getByTestId("score-o")).toHaveText("1");
    await expect(page.getByTestId("score-draws")).toHaveText("1");

    // Reset Scoreboard independently
    await page.getByRole("button", { name: "Reset Scoreboard" }).click();
    await expect(page.getByTestId("score-x")).toHaveText("0");
    await expect(page.getByTestId("score-o")).toHaveText("0");
    await expect(page.getByTestId("score-draws")).toHaveText("0");

    // 2D keyboard navigation
    await page.getByTestId("cell-0").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect.poll(() => getMarkColor(page, 4)).toBe(BLUE_RGB);

    expect(errors).toEqual([]);
  });

  test("tablet and mobile responsive layouts have zero overflow and comfortable touch targets", async ({
    page,
  }) => {
    const errors = await attachErrorCollectors(page);

    // Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.getByTestId("game-status")).toContainText("BLUE'S TURN");
    const tabletOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(tabletOverflow).toBe(false);

    // Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByTestId("game-status")).toContainText("BLUE'S TURN");
    const mobileMetrics = await page.evaluate(() => {
      const cell = document
        .querySelector('[data-testid="cell-0"]')
        ?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        cellWidth: cell?.width ?? 0,
        cellHeight: cell?.height ?? 0,
      };
    });
    expect(mobileMetrics.overflow).toBe(false);
    expect(mobileMetrics.cellWidth).toBeGreaterThanOrEqual(44);
    expect(mobileMetrics.cellHeight).toBeGreaterThanOrEqual(44);

    await page.getByTestId("cell-4").click();
    await page.getByTestId("cell-0").click();
    await expect.poll(() => getMarkColor(page, 4)).toBe(BLUE_RGB);
    await expect.poll(() => getMarkColor(page, 0)).toBe(RED_RGB);

    await page.waitForTimeout(450);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/mobile-game.png`,
      fullPage: false,
    });

    expect(errors).toEqual([]);
  });
});
