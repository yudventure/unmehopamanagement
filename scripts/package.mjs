/**
 * Turns a finished build into the folder a server actually needs.
 *
 * `output: "standalone"` leaves `.next/standalone` holding the server and the
 * traced slice of `node_modules`, but deliberately without two things: the
 * files in `public/`, and the compiled CSS and JavaScript in `.next/static`.
 * Vercel serves those from its own edge, so it does not want copies. A single
 * Node process has no edge, so it does.
 *
 * Forgetting this step does not fail loudly. The site comes up, answers every
 * request, and renders with no stylesheet and no photographs, which reads as a
 * broken build rather than a missing copy. So the copy is a script with a name
 * rather than a line in a README, and it checks its own work at the end.
 *
 *   node scripts/package.mjs           copy into place
 *   node scripts/package.mjs --archive also write dist/app.tar.gz to upload
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error(
    "Tidak ada .next/standalone.\n" +
      "Jalankan `npm run build` dulu, dan pastikan next.config.ts memakai output: \"standalone\".",
  );
  process.exit(1);
}

/** Bytes under a path, following the tree. Used to report, not to decide. */
function size(path) {
  if (!existsSync(path)) return 0;
  const s = statSync(path);
  if (!s.isDirectory()) return s.size;
  let total = 0;
  for (const entry of readdirSync(path)) total += size(join(path, entry));
  return total;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/* `public/` is optional in principle: a build with no photographs is still a
   build. It is not optional here, but saying so is better than crashing. */
const publicDir = join(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, join(standalone, "public"), { recursive: true });
} else {
  console.warn("public/ tidak ada, dilewati.");
}

/* `.next/static` is never optional. Without it there is no CSS and no client
   JavaScript, so the page paints unstyled and every button is inert. */
const staticDir = join(root, ".next", "static");
if (!existsSync(staticDir)) {
  console.error("Tidak ada .next/static. Build-nya belum selesai.");
  process.exit(1);
}
cpSync(staticDir, join(standalone, ".next", "static"), { recursive: true });

/* Checked rather than assumed. A copy that silently landed in the wrong place
   produces exactly the same unstyled page as a copy that never ran. */
for (const required of ["server.js", ".next/static", "public"]) {
  if (!existsSync(join(standalone, required))) {
    console.error(`Gagal: ${required} tidak ada di .next/standalone setelah penyalinan.`);
    process.exit(1);
  }
}

console.log(`.next/standalone siap, ${mb(size(standalone))}`);
console.log("  jalankan: PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js");

if (process.argv.includes("--archive")) {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  const out = join(dist, "app.tar.gz");
  /* `-C` so the archive opens as the application's own root rather than as
     three nested folders named after this machine's directory layout. */
  execFileSync("tar", ["-czf", out, "-C", standalone, "."], { stdio: "inherit" });
  console.log(`dist/app.tar.gz, ${mb(size(out))}`);
}
