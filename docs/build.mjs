import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bakes a document folder into one self-contained HTML file, then it is ready
 * for render.mjs.
 *
 *   node docs/build.mjs pitch
 *   node docs/build.mjs proposal
 *
 * A document folder holds exactly one `.html` and one `.css`. The HTML carries
 * four placeholders that this fills in: the two fonts, the logo, and the CSS.
 *
 * The fonts come out of `.next/static/media`, which means `npm run build` has
 * to have run at least once. That is on purpose: these documents are typeset in
 * the same DM Sans and JetBrains Mono the product uses, and taking them from
 * the build rather than from the network keeps it that way with nothing to
 * fetch and nothing to go missing on whichever machine prints it.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const folder = process.argv[2];
if (!folder) {
  console.error("usage: node docs/build.mjs <folder>   e.g. pitch, proposal");
  process.exit(1);
}
const dir = resolve(here, folder);

const one = (ext, exclude = []) => {
  const hits = readdirSync(dir).filter(
    (n) => n.endsWith(ext) && !exclude.some((x) => n.endsWith(x)),
  );
  if (hits.length !== 1) {
    throw new Error(`expected exactly one ${ext} in ${dir}, found ${hits.length}`);
  }
  return join(dir, hits[0]);
};

const chunks = join(root, ".next", "static", "chunks");
const sheet = () => {
  const f = readdirSync(chunks).find((n) => n.endsWith(".css"));
  if (!f) throw new Error("no built CSS found; run npm run build first");
  return readFileSync(join(chunks, f), "utf8");
};

/* Find each font by the family name in the built CSS rather than by hash: the
   hashes change on every build, the family names do not. Only the latin subset
   is wanted, which is the rule whose range starts at U+00-FF. */
function fontFile(family) {
  const re = new RegExp(
    `@font-face\\{font-family:${family};[^}]*?src:url\\(\\.\\./media/([^)]+)\\)[^}]*?unicode-range:U\\+\\?\\?`,
    "s",
  );
  const m = sheet().match(re);
  if (!m) throw new Error(`latin subset for ${family} not found; run npm run build first`);
  return join(root, ".next", "static", "media", m[1]);
}

const b64 = (p) => readFileSync(p).toString("base64");

const html = readFileSync(one(".html", [".built.html"]), "utf8")
  .replace("__DMSANS__", b64(fontFile("DM Sans")))
  .replace("__MONO__", b64(fontFile("JetBrains Mono")))
  .replace("__LOGO__", b64(join(root, "public", "logo.png")))
  .replace("__CSS__", readFileSync(one(".css"), "utf8"));

writeFileSync(join(dir, "doc.built.html"), html);
console.log(`built ${folder}/doc.built.html — now run: node docs/render.mjs ${folder} <out.pdf>`);
