import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("front page", () => {
	test("loads with its own CSS, font and favicon, and no errors", async ({ page }) => {
		const problems = [];
		page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
		page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
		page.on("requestfailed", (req) => problems.push(`failed: ${req.url()}`));
		page.on("response", (res) => res.status() >= 400 && problems.push(`${res.status()}: ${res.url()}`));

		const response = await page.goto("/");
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle("Ben Weese · Playwright automation projects");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ben Weese");
		await expect(page.locator("h1")).toHaveCount(1);
		await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Projects", "How they fit", "Writing"]);
		await expect(page.locator(".cards > li")).toHaveCount(3);

		const assets = await page.evaluate(async () => {
			await document.fonts.ready;
			return {
				font: document.fonts.check('16px "Manrope"'),
				background: getComputedStyle(document.body).backgroundColor
			};
		});
		expect(assets).toEqual({ font: true, background: "rgb(20, 20, 20)" });
		expect((await page.request.get("/favicon.png")).headers()["content-type"]).toBe("image/png");
		await page.waitForLoadState("networkidle");
		expect(problems).toEqual([]);
	});

	test("has the meta tags, share card and Person JSON-LD", async ({ page }) => {
		await page.goto("/");
		const meta = (selector) => page.locator(selector).first().getAttribute("content");
		expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe("https://benweese.github.io/");
		expect(await meta('meta[name="description"]')).toBeTruthy();
		expect(await meta('meta[property="og:url"]')).toBe("https://benweese.github.io/");
		const card = "https://benweese.com/wp-content/uploads/2026/11/benweese-share-card.png";
		expect(await meta('meta[property="og:image"]')).toBe(card);
		expect(await meta('meta[name="twitter:image"]')).toBe(card);
		expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");

		const person = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
		expect(person).toMatchObject({ "@context": "https://schema.org", "@type": "Person", name: "Ben Weese" });
		expect(person.sameAs).toEqual([
			"https://benweese.com/",
			"https://www.linkedin.com/in/benweese/",
			"https://github.com/benweese"
		]);
	});

	test("has no axe violations (WCAG 2.0-2.2 A and AA, plus best practices)", async ({ page }) => {
		await page.goto("/");
		const { violations } = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
			.analyze();
		const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
		expect(summary).toEqual([]);
	});

	test("has no horizontal scroll at 320px wide", async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 640 });
		await page.goto("/");
		await page.evaluate(() => document.fonts.ready);
		const { scrollWidth, clientWidth, wide } = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth,
			wide: [...document.querySelectorAll("body *")]
				.filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5)
				.map((el) => el.tagName.toLowerCase() + (el.className ? `.${el.className}` : ""))
		}));
		expect(wide, "elements wider than the viewport").toEqual([]);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	});

	test("skip link is the first stop and moves focus to the main content", async ({ page }) => {
		await page.goto("/");
		await page.keyboard.press("Tab");
		const skip = page.getByRole("link", { name: "Skip to content" });
		await expect(skip).toBeFocused();
		await expect(skip).toBeInViewport();
		const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
		expect(outline).toBe("solid");
		await page.keyboard.press("Enter");
		await expect(page.locator("main")).toBeFocused();
	});

	test("respects prefers-reduced-motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		const motion = await page.evaluate(() => ({
			scroll: getComputedStyle(document.documentElement).scrollBehavior,
			transitions: [...document.querySelectorAll("a")].map((a) => getComputedStyle(a).transitionDuration)
		}));
		expect(motion.scroll).toBe("auto");
		expect(new Set(motion.transitions)).toEqual(new Set(["0s"]));
	});
});
