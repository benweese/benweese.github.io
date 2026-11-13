import { test, expect } from "@playwright/test";

/**
 * Every link, image and share-card URL on the page resolves. A 404 or 410, or a host that doesn't
 * answer, fails the test. Some sites refuse automated requests (LinkedIn answers bots with 999,
 * others with 403 or 429); those are reported as warnings, since the page exists for people.
 */
const BLOCKS_BOTS = new Set([401, 403, 429, 999]);

test("every link resolves @links", async ({ page, request }) => {
	test.setTimeout(90_000);
	await page.goto("/");
	const urls = await page.evaluate(() => [
		...new Set(
			[
				...[...document.querySelectorAll("a[href]")].map((a) => a.href),
				...[...document.querySelectorAll("img[src]")].map((img) => img.src),
				...[...document.querySelectorAll('link[rel~="icon"], link[rel="stylesheet"], link[rel="preload"]')].map(
					(l) => l.href
				),
				...[...document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')].map(
					(m) => m.content
				)
			].filter(Boolean)
		)
	]);
	expect(urls.length).toBeGreaterThan(15);

	const broken = [];
	const warnings = [];
	for (const url of urls) {
		const { protocol, hash, origin, pathname } = new URL(url);
		if (protocol === "mailto:") {
			expect(url, "mailto link").toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/);
			continue;
		}
		if (hash && origin === new URL(page.url()).origin && pathname === new URL(page.url()).pathname) {
			if ((await page.locator(hash).count()) === 0) {
				broken.push(`${url}: no element ${hash}`);
			}
			continue;
		}
		const status = await statusOf(request, url);
		if (status === null || status === 404 || status === 410) {
			broken.push(`${url}: ${status ?? "no response"}`);
		} else if (status >= 400) {
			(BLOCKS_BOTS.has(status) ? warnings : broken).push(`${url}: ${status}`);
		}
	}

	for (const warning of warnings) {
		test.info().annotations.push({ type: "warning", description: `Refused an automated check: ${warning}` });
	}
	expect(broken, "links that don't resolve").toEqual([]);
});

/** The final status after redirects, trying twice; null if the host never answered. */
async function statusOf(request, url) {
	for (let attempt = 1; attempt <= 2; attempt += 1) {
		try {
			const response = await request.get(url, {
				maxRedirects: 10,
				timeout: 20_000,
				headers: { "user-agent": "Mozilla/5.0 (link check; +https://benweese.github.io/)" }
			});
			if (response.status() < 500 || attempt === 2) {
				return response.status();
			}
		} catch {
			if (attempt === 2) {
				return null;
			}
		}
	}
	return null;
}
