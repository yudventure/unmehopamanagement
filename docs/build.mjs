import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

/*
 * Screenshots, if the folder has a `shots/` beside its HTML. `__SHOT_name__`
 * in the markup becomes the bytes of `shots/name.jpg`, so a page can hold a
 * real screen without the PDF depending on a file path that only exists on
 * the machine that took it.
 *
 * Every shot has to be used and every placeholder has to resolve. A document
 * whose evidence quietly went missing still prints, and prints wrong, so both
 * directions are an error rather than a warning nobody reads.
 */
function shots(markup) {
  const dirShots = join(dir, "shots");
  let files;
  try {
    files = readdirSync(dirShots).filter((n) => n.endsWith(".jpg"));
  } catch {
    return markup;
  }
  const asked = new Set(
    [...markup.matchAll(/__SHOT_([a-z0-9-]+)__/g)].map((m) => m[1]),
  );
  const have = new Set(files.map((n) => n.replace(/\.jpg$/, "")));
  const missing = [...asked].filter((n) => !have.has(n));
  if (missing.length) {
    throw new Error(`shots referenced but not in ${dirShots}: ${missing.join(", ")}`);
  }
  const unused = [...have].filter((n) => !asked.has(n));
  if (unused.length) {
    throw new Error(`shots in ${dirShots} that no page uses: ${unused.join(", ")}`);
  }
  let out = markup;
  let bytes = 0;
  for (const name of asked) {
    const data = b64(join(dirShots, `${name}.jpg`));
    bytes += data.length;
    out = out.replaceAll(`__SHOT_${name}__`, data);
  }
  console.log(`  ${asked.size} screenshots, ${Math.round(bytes / 1024)} kB encoded`);
  return out;
}

/*
 * Numbers, if the folder has an `angka.mjs` beside its HTML. The module
 * default-exports a function returning `{ marker: text }`, and `__N_name__`
 * in the markup becomes that text.
 *
 * It exists because a priced document's figures are nearly all derived: a
 * monthly price times a term, the tax on the sum, a deposit that is one part
 * plus half of another. Typed into the markup one by one they are eleven
 * chances to be wrong, and the one that is wrong is the one nobody adds up.
 * Here the inputs live in one place, the arithmetic happens once, and
 * changing a price is changing a price rather than a page.
 *
 * Checked in both directions, like the screenshots: a marker with no value
 * would print as `__N_total__` on a document somebody signs, and a value no
 * page uses is a figure that was moved or renamed with its twin left behind.
 */
async function angka(markup) {
  const file = join(dir, "angka.mjs");
  if (!existsSync(file)) return markup;
  const nilai = await (await import(pathToFileURL(file).href)).default();
  const asked = new Set([...markup.matchAll(/__N_([A-Za-z0-9-]+)__/g)].map((m) => m[1]));
  const have = new Set(Object.keys(nilai));
  const missing = [...asked].filter((n) => !have.has(n));
  if (missing.length) {
    throw new Error(`numbers used by the markup but not in ${file}: ${missing.join(", ")}`);
  }
  const unused = [...have].filter((n) => !asked.has(n));
  if (unused.length) {
    throw new Error(`numbers in ${file} that no page uses: ${unused.join(", ")}`);
  }
  let out = markup;
  for (const [name, text] of Object.entries(nilai)) {
    out = out.replaceAll(`__N_${name}__`, String(text));
  }
  console.log(`  ${asked.size} numbers from angka.mjs`);
  return out;
}

const html = (await angka(shots(readFileSync(one(".html", [".built.html"]), "utf8"))))
  .replace("__DMSANS__", b64(fontFile("DM Sans")))
  .replace("__MONO__", b64(fontFile("JetBrains Mono")))
  .replace("__LOGO__", b64(join(root, "public", "logo.png")))
  .replace("__CSS__", readFileSync(one(".css"), "utf8"));

writeFileSync(join(dir, "doc.built.html"), html);
console.log(`built ${folder}/doc.built.html — now run: node docs/render.mjs ${folder} <out.pdf>`);
