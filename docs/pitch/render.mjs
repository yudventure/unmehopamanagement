import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Prints `deck.built.html` to PDF, and refuses quietly to ship a broken page.
 *
 * A slide is a fixed 16:9 box, so anything reaching past that box is content
 * that will be cut off in print. Chromium will not complain about it and a
 * glance at page 1 will not catch it on page 9, so the check happens here and
 * names the page before the file is written.
 *
 *   node docs/pitch/build.mjs
 *   node docs/pitch/render.mjs docs/spesifikasi-website.pdf
 *
 * Needs Playwright's Chromium. Set PLAYWRIGHT to point at another install if
 * the default path is not where yours lives.
 */

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] ?? join(here, "spesifikasi-website.pdf"));
const modulePath =
  process.env.PLAYWRIGHT ?? "/opt/node22/lib/node_modules/playwright/index.js";

const { chromium } = (await import(modulePath)).default;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

await page.goto(`file://${join(here, "deck.built.html")}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

const audit = await page.evaluate(() => {
  const slides = [];
  document.querySelectorAll(".slide").forEach((s, i) => {
    const box = s.getBoundingClientRect();
    let bottom = 0;
    let right = 0;
    s.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      bottom = Math.max(bottom, r.bottom - box.top);
      right = Math.max(right, r.right - box.left);
    });
    slides.push({
      n: i + 1,
      w: Math.round(box.width),
      h: Math.round(box.height),
      bottom: Math.round(bottom),
      right: Math.round(right),
      scrollH: s.scrollHeight,
    });
  });
  return {
    slides,
    sans: document.fonts.check('700 32px "DM Sans"'),
    mono: document.fonts.check('400 12px "JetBrains Mono"'),
  };
});

console.log(`DM Sans loaded: ${audit.sans} | JetBrains Mono loaded: ${audit.mono}`);
const spilling = audit.slides.filter(
  (s) => s.bottom > s.h + 2 || s.right > s.w + 2 || s.scrollH > s.h + 2,
);
for (const s of spilling) {
  console.log(
    `  slide ${s.n}: OVERFLOW  box ${s.w}x${s.h}, content reaches ${s.right}x${s.bottom}`,
  );
}
console.log(`slides: ${audit.slides.length}, overflowing: ${spilling.length}`);

if (!audit.sans || !audit.mono) {
  console.error("fonts did not load; run node docs/pitch/build.mjs first");
  await browser.close();
  process.exit(1);
}
if (spilling.length) {
  console.error("not writing a PDF with content off the page");
  await browser.close();
  process.exit(1);
}

await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
console.log("errors:", errors.length ? errors : "none");
console.log("written:", out);
await browser.close();
