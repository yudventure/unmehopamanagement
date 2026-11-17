/**
 * Turns a finished build into the folder a server actually needs.
 *
 * `output: "standalone"` leaves `.next/standalone` holding the server and the
 * traced slice of `node_modules`, but deliberately without two things: the
 * files in `public/`, and the compiled CSS and JavaScript in `.next/static`.
 * A platform with an edge in front of it serves those from the edge and does
 * not want copies beside the server. A single Node process has no edge, so it
 * does.
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
      "Jalankan `npm run build` dulu, dan pastikan next.config.mjs memakai output: \"standalone\".",
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

/*
 * Which commit this folder was built from, served publicly at `/version.json`.
 *
 * Deploying used to end in a question nobody could answer: the archive went to
 * the host, the host said it was done, and whether the running site was the new
 * build or the old one was a matter of reloading and squinting. `BUILD-INFO.txt`
 * sits beside the server where only somebody with file access can read it, and
 * `/api/health` is behind the dashboard session, so neither can answer it from
 * outside.
 *
 * This can, which is what lets the workflow wait for a deploy and say whether it
 * landed instead of firing a webhook and hoping. It is also the honest answer to
 * "is my price change live yet?": open it and compare.
 *
 * A commit hash and a timestamp, nothing else. It says which build is running,
 * never what is in it.
 */
function stamp() {
  let commit = (process.env.GITHUB_SHA ?? "").trim();
  if (!commit) {
    try {
      commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString().trim();
    } catch {
      /* Built from a tarball rather than a checkout. An empty hash is honest;
         a made-up one would make the workflow below wait for a build that can
         never appear. */
      commit = "";
    }
  }
  return {
    commit,
    short: commit.slice(0, 7),
    builtAt: new Date().toISOString(),
  };
}

mkdirSync(join(standalone, "public"), { recursive: true });
writeFileSync(
  join(standalone, "public", "version.json"),
  `${JSON.stringify(stamp(), null, 2)}\n`,
);

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
 * Replace the `package.json` Next copies in, because it describes the project
 * this was built from rather than the thing in this folder.
 *
 * What it carries is `"build": "next build"`, `"start": "next start"`, and a
 * full dependency list. None of that is true here: there is no `src`, no
 * `next.config.mjs` and no `next` binary in the archive, only the compiled
 * server. A hosting panel that reads this file and helpfully does the standard
 * thing will run `npm install`, pulling back the 563 MB of dependencies this
 * archive exists to avoid, and then run `next build` against no source at all.
 *
 * Measured, not feared: Hostinger's Node.js deploy screen detects "Next.js" and
 * offers "Default untuk Next.js" as the build settings, reading exactly this
 * file.
 *
 * So the archive gets a `package.json` that describes itself: the runtime
 * dependencies and nothing else, and two scripts pointing at what is actually
 * here — `start`, which runs the server, and a `build` that does nothing.
 *
 * The do-nothing `build` is not decoration either. Measured on 17 November
 * 2026, first install attempt: Hostinger's build settings form marks both
 * "Build command" and "Direktori output" REQUIRED, and the build command is a
 * picker over the scripts in this file. So "leave it empty", which is what
 * their own docs say for an app with no build step, is not a thing the form
 * will accept. Without a `build` script here the only choice the picker
 * offers is `npm run start`, which would launch the server as the build step
 * and hang until the deploy times out.
 *
 * A `build` that succeeds instantly and says why is the honest answer: the
 * build genuinely did happen, in GitHub Actions, and its result is what this
 * folder already is.
 *
 * The dependency list is not decoration, and leaving it empty was tried and is
 * actively dangerous. `npm install` reifies `node_modules` to match
 * `package.json`, so an empty list means every one of the traced packages is
 * extraneous and npm deletes all of them. Measured: `node_modules` went from
 * 19 MB and ten packages to 24 KB and three, and the server then died with
 * `Cannot find module 'next'`, which reaches a visitor as a 503.
 *
 * Declaring them means an install that does run finds the tree already
 * satisfied, and an install that never runs changes nothing. The archive works
 * either way, which is the only way to be safe on a panel that insists on
 * picking a package manager.
 *
 * `devDependencies` stay out: TypeScript and Tailwind built this, they do not
 * run it.
 */
/**
 * Exact versions rather than the ranges the project develops against.
 *
 * `server.js` is generated by a particular build of Next and then loads `next`
 * at runtime, so the two should be the same build. A caret lets them drift:
 * measured on the first successful deploy, the archive was built with 16.3.0
 * and the server came up announcing 16.3.5, because the host's `npm install`
 * resolved `^16.3.0` to whatever had been published since. It worked, and a
 * patch release usually will, but "usually" is doing load-bearing work in that
 * sentence and it costs nothing to remove.
 *
 * Read from what is actually installed here rather than from the lockfile, so
 * the number pinned is the number this archive was built and tested against.
 */
function pinned(deps) {
  const out = {};
  for (const name of Object.keys(deps ?? {})) {
    const meta = join(root, "node_modules", name, "package.json");
    out[name] = existsSync(meta)
      ? JSON.parse(readFileSync(meta, "utf8")).version
      : /* Not installed is not something to paper over with a guess: keep the
           range so the install still resolves, and say so. */
        (console.warn(`${name} tidak terpasang, versinya tidak bisa dikunci.`),
        deps[name]);
  }
  return out;
}

const shipped = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
writeFileSync(
  join(standalone, "package.json"),
  `${JSON.stringify(
    {
      name: shipped.name,
      version: shipped.version,
      private: true,
      /* Deliberately no "type": the compiled server is CommonJS, and declaring
         it a module here makes Node refuse to load it. */
      scripts: {
        /* Dibangun di GitHub Actions; isi folder ini sudah hasilnya. Lihat
           catatan panjang di atas sebelum menghapusnya. */
        build: "echo Sudah dibangun di GitHub Actions - tidak ada yang perlu dibangun di sini",
        start: "node server.js",
      },
      dependencies: pinned(shipped.dependencies),
    },
    null,
    2,
  )}\n`,
);

/*
 * A note on what an install on the server undoes.
 *
 * If the host runs `npm install`, the pruning above is reversed: `node_modules`
 * comes back at about 241 MB, sharp included. Shipping an `.npmrc` with
 * `omit=optional` was tried to prevent that and measured not to work, so it is
 * not shipped: a file whose comment promises something it does not do is worse
 * than no file.
 *
 * That outcome is accepted rather than fought. The pruning's real job is
 * getting the archive through an upload form, and 13.6 MB does that; 241 MB
 * afterwards sits on a plan with 50 GB. What matters is that the server runs in
 * both states, which is what the dependency list above buys and what is
 * actually tested.
 *
 * Removed rather than merely not written, because `.next/standalone` survives a
 * repackage: a version of this script did ship one, and without this line that
 * stale file rides along in every archive built on the same machine afterwards.
 */
rmSync(join(standalone, ".npmrc"), { force: true });

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

  /*
   * The same thing as a zip, because a hosting panel's upload form is fussier
   * than it looks.
   *
   * Hostinger's accepts `.zip`, `.tar` and `.tar.gz` and still rejected a
   * `.tar.gz`, which points at the name rather than the contents: a browser
   * that ungzips on download leaves a `.tar` named `.tar.gz`, and a second
   * download becomes `app.tar (1).gz`. Zip survives both, because nothing
   * along the way tries to be helpful about it.
   *
   * `-r` from inside the folder so entries are `server.js` and `public/…`
   * rather than a wrapper directory, matching the tar and landing at the
   * application root when the panel extracts it. `-q` because the file list is
   * seventeen hundred lines of nothing.
   */
  const zip = join(dist, "app.zip");
  execFileSync("zip", ["-qr", zip, "."], { cwd: standalone, stdio: "inherit" });
  console.log(`dist/app.zip, ${mb(size(zip))}`);
}
