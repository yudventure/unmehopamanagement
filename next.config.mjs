/** @typedef {import("next").NextConfig} NextConfig */

/**
 * One application, three sites, told apart by the domain that was asked for.
 *
 * On any host, attaching a domain to this project makes that domain serve
 * `/`, which is the booking dashboard. That is right for the
 * manager's domain and wrong for the other two: a guest who types the homestay
 * address should land on the homestay, not on a login screen. This is the
 * layer that sorts that out, and it is the one thing "point the domain at the
 * project" does not do by itself.
 *
 * **Inert until it is configured.** With neither variable set, both lists come
 * back empty and routing is exactly what it was: `/` the dashboard, `/turtle`
 * and `/eddo` the two public sites. So this can sit in the repository from
 * today and start working the day the domains are bought, without a deploy in
 * between changing how anything behaves.
 *
 * **Why `next.config` and not a proxy.** A rewrite here is resolved by the
 * routing layer before anything runs, so it costs nothing per request and
 * behaves the same on a plain Node server behind a reverse proxy as it would
 * on any managed platform. A proxy of our own would cost an invocation on
 * every request to do work that never changes.
 *
 * **Why two lists.** `beforeFiles` runs before the filesystem, `afterFiles`
 * after it. The root has to be rewritten before, because `/` is a real page
 * and would otherwise be served as the dashboard. Everything else has to be
 * rewritten after, so that `/api/...`, `/_next/...`, and files in `public/`
 * are found first and never get a site prefix glued to the front of them.
 */

/**
 * Domain bawaan tiap situs, dipakai bila variabelnya kosong.
 *
 * Sebelumnya domain hanya dikenali kalau `SITE_DOMAIN_*` terisi di GitHub
 * Variables saat build. Variabel yang terlewat berarti `eddohomestay.com/`
 * menyajikan dashboard, bukan situs Eddo, tanpa pesan apa pun. Domainnya
 * sudah diputuskan pemilik, jadi tertulis di sini; variabel tetap menang kalau
 * diisi (untuk domain lain atau uji). Apex lebih dulu: yang pertama dianggap
 * alamat resmi.
 */
const SITES = [
  {
    env: "SITE_DOMAIN_TURTLE",
    base: "/turtle",
    bawaan: ["turtlehomestay.com", "www.turtlehomestay.com"],
  },
  {
    env: "SITE_DOMAIN_EDDO",
    base: "/eddo",
    bawaan: ["eddohomestay.com", "www.eddohomestay.com"],
  },
];

/** Alamat dashboard. Pintu masuk dashboard ada di sini, bukan di domain homestay. */
const DOMAIN_MANAJEMEN = (process.env.MANAGEMENT_DOMAIN ?? "unmehopamanagement.com").trim();

/**
 * Hosts for one site. A comma-separated list, because the apex and the `www.`
 * form are two different hosts as far as matching is concerned, and a redirect
 * between them is a setting on the host rather than something this can assume.
 *
 * @param {string} name
 * @returns {string[]}
 */
function hostsFor(name) {
  const dariEnv = (process.env[name] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (dariEnv.length) return dariEnv;
  return SITES.find((s) => s.env === name)?.bawaan ?? [];
}

function hostRewrites() {
  /** @type {any[]} */
  const beforeFiles = [];
  /** @type {any[]} */
  const afterFiles = [];

  for (const site of SITES) {
    for (const host of hostsFor(site.env)) {
      const has = [{ type: "host", value: host }];
      beforeFiles.push({ source: "/", has, destination: site.base });
      afterFiles.push({
        source: "/:path*",
        has,
        destination: `${site.base}/:path*`,
      });
    }
  }

  return { beforeFiles, afterFiles };
}

/**
 * One page, one address.
 *
 * The rewrite above makes `turtlehomestay.com/` serve the site, but it does
 * not stop `turtlehomestay.com/turtle` from serving the very same page: that
 * path is a real page and the filesystem finds it. Two addresses for one page
 * is a small mess that a search engine has to guess its way out of, so the
 * long one bounces to the short one.
 *
 * There is no loop in this. Redirects are checked before rewrites, so
 * `/turtle/about` is answered with a bounce to `/about`, and only then does
 * the rewrite quietly turn that back into `/turtle/about` to render it. The
 * address bar keeps the short form; the router keeps the long one.
 *
 * Temporary rather than permanent on purpose. A permanent redirect is cached
 * by the browser for a long time and is unpleasant to take back if a domain
 * turns out to be wrong. It can be promoted once the addresses have settled.
 */
function canonicalPathRedirects() {
  /** @type {any[]} */
  const out = [];
  for (const site of SITES) {
    for (const host of hostsFor(site.env)) {
      const has = [{ type: "host", value: host }];
      /*
       * Two rules, and the split is not tidiness. A single `/:path*` covers
       * the bare `/turtle` as well, matching zero segments — and a zero-segment
       * `:path*` interpolates to nothing, so the redirect goes out as a 307
       * with an empty `Location`, which is a dead end in a browser. Measured,
       * not guessed. `:path+` demands at least one segment and leaves the bare
       * case to a rule that names its destination outright.
       */
      out.push({ source: site.base, has, destination: "/", permanent: false });
      out.push({
        /* Hanya halaman, bukan berkas. Berkas seperti `icon.png` dan
           `apple-icon.png` ada di dua tempat: milik situs di bawah jalurnya,
           dan milik dashboard di akar. Dialihkan ke akar, tab eddohomestay.com
           menampilkan ikon Unmehopa. Jalur tanpa titik adalah halaman. */
        source: `${site.base}/:path((?!.*\\.).+)`,
        has,
        destination: "/:path+",
        permanent: false,
      });
    }
  }
  return out;
}

/**
 * Dashboard tidak punya pintu di domain homestay.
 *
 * `/kelola` dulu dibuat supaya dashboard punya alamat di satu-satunya domain
 * yang waktu itu menunjuk ke aplikasi. Sekarang dashboard punya domainnya
 * sendiri, dan tamu yang membuka alamat homestay tidak seharusnya melihat layar
 * masuk manajemen. Pengelola dibawa ke domain manajemen. Sementara, bukan
 * permanen, karena alasan yang sama seperti pengalihan lain di sini.
 */
function pintuDashboard() {
  const out = [];
  for (const site of SITES) {
    for (const host of hostsFor(site.env)) {
      out.push({
        source: "/kelola",
        has: [{ type: "host", value: host }],
        destination: `https://${DOMAIN_MANAJEMEN}/kelola`,
        permanent: false,
      });
    }
  }
  return out;
}

/**
 * The client's own staff system, kept out of search results.
 *
 * `public/sistem/` holds the Turtle System pages byte for byte as the family
 * runs them today. They are the working tools of a business, not pages anybody
 * should find by searching, and one of them carries a staff PIN in its source
 * — see `MIGRASI.md`, where that is the first thing on the list to fix.
 *
 * This is a sign on the door, not a lock. It keeps the pages out of Google,
 * which is worth having and is all it does; anyone with the address still
 * reaches them, exactly as on the hosting they are served from today.
 */
/**
 * Halaman situs publik tidak boleh tinggal di cache bersama.
 *
 * Next mengirim halaman yang dibangun saat build dengan
 * `s-maxage=31536000`: satu tahun di CDN. Tiap deploy mengganti nama berkas
 * gaya (`/_next/static/css/<hash>.css`) dan membuang yang lama, jadi HTML lama
 * yang masih di CDN menunjuk ke berkas yang sudah tidak ada. Hasilnya halaman
 * tanpa gaya, dan ikon tab yang tidak pernah berganti, persis seperti yang
 * terlihat di eddohomestay.com pada sebuah mesin Windows.
 *
 * `max-age=0, must-revalidate`: CDN dan peramban boleh menyimpannya, tapi
 * bertanya dulu ke server sebelum memakainya (ETag, jawaban 304 yang murah).
 * Berkas statis di `/_next/static` tetap abadi, karena namanya memuat hash
 * isinya.
 *
 * Hanya situs publik: jalurnya sendiri (`/turtle`, `/eddo`) dan akar serta
 * halaman di domain homestay. Dashboard dan `/api` memuat isi per pengguna dan
 * tetap dengan aturan bawaannya (`private, no-store`), tidak pernah `public`.
 */
function cachePublik() {
  const nilai = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];
  /* Bukan berkas statis, bukan /api, dan bukan /kelola (pintu dashboard). */
  const bukanStatis = "(?!_next/|api/|kelola|.*\\..*).+";
  const out = [];
  for (const site of SITES) {
    out.push({ source: site.base, headers: nilai });
    out.push({ source: `${site.base}/:path*`, headers: nilai });
    for (const host of hostsFor(site.env)) {
      const has = [{ type: "host", value: host }];
      out.push({ source: "/", has, headers: nilai });
      out.push({ source: `/:path(${bukanStatis})`, has, headers: nilai });
    }
  }
  return out;
}

function systemHeaders() {
  return [
    ...cachePublik(),
    {
      source: "/sistem/:path*",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ],
    },
  ];
}

/**
 * Tautan lama sistem stafnya, tetap hidup.
 *
 * Di hosting lama berkasnya duduk di akar domain, jadi yang beredar di
 * WhatsApp dan tersimpan di bookmark orang berbentuk
 * `turtledivehomestay.com/dashboard.html`. Begitu domain itu menyajikan
 * aplikasi ini, alamat itu harus tetap sampai ke tempat yang benar — bukan ke
 * halaman 404 pada Senin pagi.
 *
 * Sementara, bukan permanen, karena alasan yang sama seperti pengalihan di
 * bawah: pengalihan permanen disimpan peramban lama sekali dan tidak enak
 * ditarik kembali kalau alamatnya ternyata berubah lagi.
 */
const SISTEM_LAMA = [
  "dashboard.html",
  "staff.html",
  "td_monitoring.html",
  "td_activity_log.html",
  "invoiceapp_turtle_v3.html",
  "td_room_availability.html",
  /* Nama aplikasi sebenarnya ikut, karena sebagian orang sudah terlanjur
     menyimpan alamat panjangnya, bukan pemuatnya. */
  "td_dashboard_console_31.html",
  "turtle_staff_system_19_3.html",
  "td_monitoring_app.html",
  "td_activity_log_app.html",
  "invoiceapp_turtle_v3_app.html",
  "invoiceapp_turtle_v3_app_V32_room_occupancy.html",
];

function systemRedirects() {
  return SISTEM_LAMA.map((berkas) => ({
    source: `/${berkas}`,
    destination: `/sistem/${berkas}`,
    permanent: false,
  }));
}

/** @type {NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Ship the server, not the toolchain.
   *
   * `next build` traces which files each route actually loads and, with this
   * set, copies just those into `.next/standalone` together with a small
   * `server.js` that replaces `next start`. The result runs with no
   * `node_modules` install on the far side, which is what makes this
   * deployable somewhere that cannot spare the memory to build.
   *
   * The build itself is unchanged and just as heavy; it simply stops having to
   * happen on the machine that serves the site. That is the whole point: the
   * server the site runs on is a small shared one, and building there is what
   * it cannot do.
   *
   * `server.js` does not serve `public/` or `.next/static` on its own. Both
   * have to be copied in beside it, which is what `npm run package` does. Skip
   * that and the pages render with no photographs and no stylesheet, which
   * looks like a broken build rather than a missing copy step.
   */
  output: "standalone",
  async rewrites() {
    const { beforeFiles, afterFiles } = hostRewrites();
    return { beforeFiles, afterFiles, fallback: [] };
  },
  async redirects() {
    return [...canonicalPathRedirects(), ...pintuDashboard(), ...systemRedirects()];
  },
  async headers() {
    return systemHeaders();
  },
};

export default nextConfig;
