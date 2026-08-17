import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bakes `deck.html` into a single self-contained file, then renders it.
 *
 * The two fonts come out of `.next/static/media`, which means `npm run build`
 * has to have run at least once. That is on purpose: the deck is typeset in the
 * same DM Sans and JetBrains Mono the product uses, and taking them from the
 * build rather than from the network keeps it that way with nothing to fetch.
 *
 *   npm run build          # once, so the fonts exist
 *   node docs/pitch/build.mjs
 *
 * Rendering needs Playwright's Chromium. It is not a dependency of the app and
 * deliberately not in package.json: this is a document, not part of the
 * product, and the app should not carry a browser to ship a PDF.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const css = join(root, ".next", "static", "chunks");

const b64 = (p) => readFileSync(p).toString("base64");

/* Find each font by the family name in the built CSS rather than by hash: the
   hashes change on every build, the family names do not. Only the latin subset
   is wanted, which is the rule with no `unicode-range` beyond U+00-FF. */
function fontFile(family) {
  const sheets = readFileSync(join(css, findCss()), "utf8");
  const re = new RegExp(
    `@font-face\\{font-family:${family};[^}]*?src:url\\(\\.\\./media/([^)]+)\\)[^}]*?unicode-range:U\\+\\?\\?`,
    "s",
  );
  const m = sheets.match(re);
  if (!m) throw new Error(`latin subset for ${family} not found; run npm run build first`);
  return join(root, ".next", "static", "media", m[1]);
}

function findCss() {
  const f = readdirSync(css).find((n) => n.endsWith(".css"));
  if (!f) throw new Error("no built CSS found; run npm run build first");
  return f;
}

const html = readFileSync(join(here, "deck.html"), "utf8")
  .replace("__DMSANS__", b64(fontFile("DM Sans")))
  .replace("__MONO__", b64(fontFile("JetBrains Mono")))
  .replace("__LOGO__", b64(join(root, "public", "logo.png")))
  .replace("__CSS__", readFileSync(join(here, "deck.css"), "utf8"));

writeFileSync(join(here, "deck.built.html"), html);
console.log("built deck.built.html — now run: node docs/pitch/render.mjs");
