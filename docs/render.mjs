import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Prints a built document to PDF, and refuses quietly to ship a broken page.
 *
 * A page here is a fixed box, so anything reaching past that box is content
 * that will be cut off in print. Chromium will not complain about it and a
 * glance at page 1 will not catch it on page 9, so the check happens here and
 * names the page before the file is written.
 *
 *   node docs/build.mjs pitch
 *   node docs/render.mjs pitch docs/spesifikasi-website.pdf
 *
 * Needs Playwright's Chromium. Set PLAYWRIGHT to point at another install if
 * the default path is not where yours lives.
 */

const here = dirname(fileURLToPath(import.meta.url));
const folder = process.argv[2];
const out = resolve(process.argv[3] ?? join(here, `${folder ?? "doc"}.pdf`));
if (!folder) {
  console.error("usage: node docs/render.mjs <folder> <out.pdf>");
  process.exit(1);
}
const modulePath =
  process.env.PLAYWRIGHT ?? "/opt/node22/lib/node_modules/playwright/index.js";

const { chromium } = (await import(modulePath)).default;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

await page.goto(`file://${join(here, folder, "doc.built.html")}`, { waitUntil: "networkidle" });
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

    /* The box check alone is not enough, because the slide clips what it
       cannot hold. Content that outgrows `.body` does not always spill off the
       page edge where the box check would see it: it is cut off at the bottom,
       or, where the body is centred in what the header leaves, it rides up
       over the heading. Either way it is still inside the slide and still
       unreadable. So compare the body against the room it actually has, and
       against the header and footer it must not touch. */
    const body = s.querySelector(".body");
    const head = s.querySelector(".head");
    const foot = s.querySelector(".foot");
    let overflowsBody = false;
    let hitsHead = false;
    let hitsFoot = false;
    if (body) {
      overflowsBody = body.scrollHeight > body.clientHeight + 2;
      const b = body.getBoundingClientRect();
      if (head) hitsHead = b.top < head.getBoundingClientRect().bottom - 2;
      if (foot) hitsFoot = b.bottom > foot.getBoundingClientRect().top + 2;
    }

    slides.push({
      n: i + 1,
      w: Math.round(box.width),
      h: Math.round(box.height),
      bottom: Math.round(bottom),
      right: Math.round(right),
      scrollH: s.scrollHeight,
      overflowsBody,
      hitsHead,
      hitsFoot,
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
  (s) =>
    s.bottom > s.h + 2 ||
    s.right > s.w + 2 ||
    s.scrollH > s.h + 2 ||
    s.overflowsBody ||
    s.hitsHead ||
    s.hitsFoot,
);
for (const s of spilling) {
  const why = [
    s.bottom > s.h + 2 || s.right > s.w + 2 || s.scrollH > s.h + 2
      ? `past the page edge (${s.right}x${s.bottom} of ${s.w}x${s.h})`
      : null,
    s.overflowsBody ? "body taller than its space" : null,
    s.hitsHead ? "riding over the heading" : null,
    s.hitsFoot ? "running into the footer" : null,
  ].filter(Boolean);
  console.log(`  page ${s.n}: ${why.join(", ")}`);
}
console.log(`pages: ${audit.slides.length}, overflowing: ${spilling.length}`);

if (!audit.sans || !audit.mono) {
  console.error(`fonts did not load; run node docs/build.mjs ${folder} first`);
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
