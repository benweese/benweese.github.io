import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";

/**
 * The repo benweese/playwright-ai-qa-agents became benweese/claude-plugins, and GitHub doesn't redirect project-site
 * URLs after a rename. playwright-ai-qa-agents/ holds one redirect page per page the old site published, each sending
 * visitors to the same page under /claude-plugins/ (old aliases go straight to their final page).
 */
const DIR = "playwright-ai-qa-agents";
const MOVED = { "index.html": "", "changelog.html": "qa-changelog.html", "worked-example.html": "qa-worked-example.html" };

test("every old project-site page redirects to the same page under /claude-plugins/", () => {
	const pages = readdirSync(DIR).filter((f) => f.endsWith(".html"));
	expect(pages.length).toBe(18);
	for (const page of pages) {
		const html = readFileSync(`${DIR}/${page}`, "utf8");
		const target = `https://code.benweese.com/claude-plugins/${page in MOVED ? MOVED[page] : page}`;
		expect(html, page).toContain(`<meta http-equiv="refresh" content="0; url=${target}">`);
		expect(html, page).toContain(`<link rel="canonical" href="${target}">`);
		expect(html, page).toContain(`location.replace("${target}" + location.hash)`);
		expect(html, page).toContain('<meta name="robots" content="noindex">');
	}
});

test("the deploy publishes the redirect pages", () => {
	const workflow = readFileSync(".github/workflows/" + readdirSync(".github/workflows")[0], "utf8");
	expect(workflow).toMatch(/cp -r [^\n]*\bplaywright-ai-qa-agents\b[^\n]*_site\//);
});
