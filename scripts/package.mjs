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
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
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

/*
 * Leave the image optimiser's native binaries behind.
 *
 * Tracing pulls in `sharp` because `next/image` might be used. It is not: every
 * photograph on all three sites is served by a plain `<img>` or a `<picture>`,
 * there is no `next/image` import anywhere in the application, and no `images`
 * config. So 45 MB of a 64 MB bundle is prebuilt libvips that nothing calls,
 * and it arrives in triplicate: a glibc build, a musl build and a WebAssembly
 * fallback, for a server that is only ever one of those.
 *
 * Pruned here rather than through `outputFileTracingExcludes`, which was tried
 * and does nothing for this: that option is keyed by route, and `sharp` is
 * pulled in by the trace of the Next server itself rather than by any route, so
 * no route glob ever matches it.
 *
 * `sharp` is loaded lazily, only when an image is actually optimised, so with
 * no `next/image` it is never reached. Introduce `next/image` and this has to
 * stop: the symptom would be image requests failing outright, which is at least
 * a loud failure rather than a subtle one. The guard below is what makes that
 * true, so it should be left alone rather than trusted to memory.
 */
const usesNextImage = ["src"].some((dir) => {
  const stack = [join(root, dir)];
  while (stack.length) {
    const here = stack.pop();
    if (!existsSync(here)) continue;
    for (const entry of readdirSync(here)) {
      const full = join(here, entry);
      if (statSync(full).isDirectory()) {
        stack.push(full);
      } else if (/\.(tsx?|jsx?|mjs)$/.test(entry)) {
        const body = readFileSync(full, "utf8");
        if (/from\s+["']next\/image["']|require\(["']next\/image["']\)/.test(body)) {
          return true;
        }
      }
    }
  }
  return false;
});

if (usesNextImage) {
  console.warn(
    "next/image terdeteksi, jadi sharp DIPERTAHANKAN. Arsipnya akan jauh lebih besar.",
  );
} else {
  for (const dead of ["@img", "sharp"]) {
    rmSync(join(standalone, "node_modules", dead), {
      recursive: true,
      force: true,
    });
  }
}

/*
 * A note to whoever unpacks this on a server.
 *
 * Domains and the Midtrans client key are read at `next build` and baked in,
 * so "does this archive know about my domain?" is a question about the archive
 * rather than about the server it lands on, and it is not answerable by
 * looking at the files. Getting it wrong is quiet: a build with the variable
 * unset produces an archive that works perfectly and serves the dashboard at
 * the homestay's address.
 *
 * So the answer is read back out of the build's own routing manifest, not out
 * of the environment this script happens to be running in, and written down
 * next to the server it describes.
 */
function buildInfo() {
  let hosts = [];
  try {
    const manifest = JSON.parse(
      readFileSync(join(root, ".next", "routes-manifest.json"), "utf8"),
    );
    const rules = [
      ...(manifest.rewrites?.beforeFiles ?? []),
      ...(manifest.rewrites?.afterFiles ?? []),
    ];
    hosts = [
      ...new Set(
        rules.flatMap((r) =>
          (r.has ?? [])
            .filter((h) => h.type === "host")
            .map((h) => h.value),
        ),
      ),
    ].sort();
  } catch {
    /* No manifest means something is wrong that this note cannot fix. Say so
       rather than claiming no domains were configured. */
    return "Tidak bisa membaca routes-manifest.json, jadi status domain tidak diketahui.\n";
  }

  const midtrans = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ? "ada" : "KOSONG";
  return [
    `Dibuat        : ${new Date().toISOString()}`,
    `Domain aktif  : ${hosts.length ? hosts.join(", ") : "TIDAK ADA"}`,
    `Client Midtrans: ${midtrans}`,
    "",
    hosts.length
      ? "Domain di atas sudah tertanam. Mengubahnya perlu build ulang."
      : [
          "PERINGATAN: tidak ada domain yang tertanam di build ini.",
          "Arsip ini akan menyajikan dashboard di alamat homestay, bukan situsnya.",
          "Isi SITE_DOMAIN_EDDO dan SITE_DOMAIN_TURTLE lalu build ulang.",
        ].join("\n"),
    midtrans === "ada"
      ? ""
      : "Catatan: tanpa client key Midtrans, tombol bayar bertanya lewat formulir, bukan menagih.",
    "",
    "Jalankan dengan: node server.js",
    "PORT dan HOSTNAME dibaca dari lingkungan, jangan dipatok di kode.",
    "",
  ].join("\n");
}

const info = buildInfo();
writeFileSync(join(standalone, "BUILD-INFO.txt"), info);

console.log(`.next/standalone siap, ${mb(size(standalone))}`);
console.log(info.split("\n").map((l) => `  ${l}`).join("\n"));

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
