/**
 * post-build.js
 * Creates dist/aryaPremium/index.html so Vercel serves the SPA
 * directly from filesystem — no rewrite rules needed, no 404 risk.
 *
 * Run automatically as part of `npm run build` via postbuild script.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const SRC  = path.join(DIST, "app.html");

if (!fs.existsSync(SRC)) {
  console.error("✗ dist/app.html not found — run vite build first");
  process.exit(1);
}

const content = fs.readFileSync(SRC, "utf8");

// All route paths the Mini App may be opened on
const ROUTES = [
  "aryaPremium",
  // Add more if BotFather URL ever changes
];

for (const route of ROUTES) {
  const dir  = path.join(DIST, route);
  const dest = path.join(dir, "index.html");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, content, "utf8");
  console.log(`✓ Created dist/${route}/index.html`);
}

console.log("✓ SPA routing files ready");
