// Serves the site's files from the repo root for the tests, like GitHub Pages would.
// Dev only: the published site is plain static files with no server code.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 4173);
const types = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".png": "image/png",
	".woff2": "font/woff2",
	".txt": "text/plain; charset=utf-8"
};

createServer(async (req, res) => {
	const { pathname } = new URL(req.url ?? "/", "http://localhost");
	const file = path.join(root, decodeURIComponent(pathname.endsWith("/") ? `${pathname}index.html` : pathname));
	// Only files inside the repo, and never the dev tooling.
	if (!file.startsWith(root + path.sep) || /[\\/](node_modules|tests|\.git)([\\/]|$)/.test(file.slice(root.length))) {
		res.writeHead(404).end("Not found");
		return;
	}
	try {
		const body = await readFile(file);
		res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(body);
	} catch {
		res.writeHead(404).end("Not found");
	}
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://127.0.0.1:${port}/`));
