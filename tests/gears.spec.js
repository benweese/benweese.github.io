import { test, expect } from "@playwright/test";

const gearState = (page) =>
	page.locator(".bwg-a").evaluate((el) => getComputedStyle(el).animationPlayState);

test.describe("gears hero", () => {
	test("ticks, and the pause button stops and restarts it", async ({ page }) => {
		await page.goto("/");
		const button = page.locator(".bwg-pause");
		await expect(button).toHaveAccessibleName("Pause animation");
		expect(await gearState(page)).toBe("running");

		await button.click();
		await expect(button).toHaveAccessibleName("Play animation");
		expect(await gearState(page)).toBe("paused");

		await button.click();
		await expect(button).toHaveAccessibleName("Pause animation");
		expect(await gearState(page)).toBe("running");
	});

	test("pause button is keyboard operable and at least 44px", async ({ page }) => {
		await page.goto("/");
		const button = page.locator(".bwg-pause");
		await button.focus();
		await page.keyboard.press("Enter");
		await expect(button).toHaveAccessibleName("Play animation");
		const box = await button.boundingBox();
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
	});

	test("with reduced motion the gears start paused and the moth never shows", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/#moth");
		await expect(page.locator(".bwg-pause")).toHaveAccessibleName("Play animation");
		expect(await gearState(page)).toBe("paused");
		await page.waitForTimeout(3500);
		await expect(page.locator(".bwg")).not.toHaveClass(/is-bug/);
		await expect(page.locator(".bwg-moth")).toBeHidden();
	});

	test("the moth jams the gears, and pausing holds its caption on screen", async ({ page }) => {
		await page.goto("/#moth"); // #moth brings the first moth in after ~2s
		const hero = page.locator(".bwg");
		await expect(hero).toHaveClass(/is-jam/, { timeout: 5000 });
		expect(await gearState(page)).toBe("paused");

		await page.waitForTimeout(1500);
		await page.locator(".bwg-pause").click();
		await page.waitForTimeout(6000); // longer than the whole moth run
		await expect(hero).toHaveClass(/is-bug/);
		await expect(page.locator(".bwg-note")).toHaveCSS("opacity", "1");

		await page.locator(".bwg-pause").click();
		await expect(hero).not.toHaveClass(/is-bug/, { timeout: 8000 });
	});
});
