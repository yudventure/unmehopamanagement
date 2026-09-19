"use client";

import { useEffect, useMemo, useState } from "react";

import { fmt } from "@/lib/format";
import { DIVE_KEYS, COPY, DEFAULT_LANG } from "@/lib/web-content";
import type { SiteConfig } from "@/lib/site-config";
import type { PublicSite } from "@/lib/site-domains";

/**
 * The website's own settings, edited from inside the manager so the owner has
 * one place to work rather than a repository to open.
 *
 * What it edits is what an owner actually changes: the number and address
 * enquiries reach, what the dive centre charges, and whether the site is up.
 * Not the prose. Two languages of copy, with its line breaks and its tone, is
 * edited far better in a code review than in a textarea, and putting it here
 * would mean either half a translation shipping or a translator's job in a
 * form.
 *
 * Saving writes `content/site.json` back to the repository through the GitHub
 * API, which makes the host rebuild. That is a minute or so before the change
 * live, which is why the screen says so rather than pretending the save was
 * instant.
 *
 * The sections are behind sub-tabs, which means most of what the owner has
 * edited is off-screen when they press Save. Two things follow from that and
 * both are here: Save writes the whole file whatever tab is showing, and a tab
 * carrying an unsaved edit is marked, so nothing is quietly left behind.
 */

const FIELD =
  "w-full rounded-[10px] border border-line-input bg-surface px-[12px] py-[9px] text-[13.5px] outline-none focus:border-teal";
const LABEL = "flex flex-col gap-[6px] text-[12.5px] text-slate";
const NOTE = "mb-4 text-[12.5px] leading-[1.5] text-slate-soft";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

/* One tab per public site. They used to be one tab per *kind* of setting,
   which made sense when there was one site and became a trap when there were
   two: the contact card showed both homestays at once, and picking the wrong
   row meant changing the other property's number. Sorted by property, the
   thing you are editing is named at the top of the screen. */
type TabKey = PublicSite;

const TABS: { key: TabKey; label: string }[] = [
  { key: "eddo", label: "Eddo Homestay" },
  { key: "turtle", label: "Turtle Dive" },
];

/* Turtle carries a dive centre and a founding year; Eddo carries neither.
   Asked rather than assumed, so adding a third property is one line here
   instead of a hunt through the render. */
const HAS_DIVING: Record<TabKey, boolean> = { turtle: true, eddo: false };

/* Printed inside sentences, so it reads as the property's name rather than as
   a key: "tombol Kirim di website Eddo Homestay". */
const LABEL_OF: Record<TabKey, string> = {
  eddo: "Eddo Homestay",
  turtle: "Turtle Dive",
};

/** Which tab owns which part of the file, so "changed" can be per tab. */
/* What each tab owns, so "changed" can be marked per tab. Turtle's tab also
   owns the two settings that belong to the dive centre rather than to a site. */
const OWNS: Record<TabKey, (c: SiteConfig) => unknown> = {
  eddo: (c) => c.sites?.eddo,
  turtle: (c) => [c.sites?.turtle, c.founded, c.divePrices],
};

/* The two public sites, named here so every tab that lists them lists them
   in the same order and with the same labels. */
const PUBLIC_SITES: { key: PublicSite; label: string }[] = [
  { key: "turtle", label: "Turtle Dive Homestay" },
  { key: "eddo", label: "Eddo Homestay" },
];

const digits = (s: string) => s.replace(/\D/g, "");
const grouped = (n: number) => n.toLocaleString("id-ID");

export interface WebsiteScreenProps {
  /** The signed-in name, recorded on the commit. */
  editor: string;
}

export function WebsiteScreen({ editor }: WebsiteScreenProps) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  /* What the server last gave us, kept so a tab can say it has been touched.
     Replaced on a successful save, which is what clears the marks. */
  const [saved, setSaved] = useState<SiteConfig | null>(null);
  /* Whether the server has the GitHub token and password it needs. Until it
     does the form is read-only rather than a Save that quietly does nothing. */
  const [writable, setWritable] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [tab, setTab] = useState<TabKey>("eddo");

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.config);
        setSaved(d.config);
        setWritable(Boolean(d.writable));
      })
      .catch(() =>
        setStatus({ kind: "error", message: "Gagal memuat pengaturan." }),
      );
  }, []);

  /* Compared as JSON rather than field by field: the shapes are small, and a
     new field added to the config should start being watched on its own
     without anyone remembering to add it here. */
  const dirty = useMemo(() => {
    const out = {} as Record<TabKey, boolean>;
    for (const { key } of TABS) {
      out[key] =
        !!config &&
        !!saved &&
        JSON.stringify(OWNS[key](config)) !== JSON.stringify(OWNS[key](saved));
    }
    return out;
  }, [config, saved]);

  const dirtyCount = TABS.filter((t) => dirty[t.key]).length;

  /* Which public sites are currently behind a holding page. Computed rather
     than read off the shared switch, so the banner names the site that is
     actually closed instead of implying both always are. */
  const closedSites = config
    ? PUBLIC_SITES.filter(({ key }) => {
        const own = config.sites?.[key]?.maintenance;
        return typeof own === "boolean" ? own : config.maintenance;
      })
    : [];

  if (!config) {
    return (
      <div>
        <div className="mb-1 text-[22px] font-bold">Website</div>
        <div className="text-[13.5px] text-slate-soft">Memuat…</div>
      </div>
    );
  }

  const patch = (next: Partial<SiteConfig>) =>
    setConfig({ ...config, ...next });

  /* Writes one field inside one site's overrides without disturbing the rest
     of the tree. Spread at every level rather than mutating, because two of
     these can be edited before a single Save. */
  const patchSite = (site: PublicSite, next: Record<string, unknown>) =>
    patch({
      sites: {
        ...(config.sites ?? {}),
        [site]: { ...(config.sites?.[site] ?? {}), ...next },
      },
    });

  const patchSiteContact = (site: PublicSite, field: string, v: string) =>
    patchSite(site, {
      contact: { ...(config.sites?.[site]?.contact ?? {}), [field]: v },
    });

  const patchSiteSocial = (site: PublicSite, field: string, v: string) =>
    patchSite(site, {
      social: { ...(config.sites?.[site]?.social ?? {}), [field]: v },
    });

  /* What is stored for this site, not what it falls back to. The form edits the
     site's own values, so showing an inherited one as if it were typed here
     would make a blank field look filled. */
  const siteContact = (site: PublicSite) =>
    (config.sites?.[site]?.contact ?? {}) as Record<string, string>;
  const siteSocial = (site: PublicSite) =>
    (config.sites?.[site]?.social ?? {}) as Record<string, string>;
  const siteClosed = (site: PublicSite) => {
    const own = config.sites?.[site]?.maintenance;
    return typeof own === "boolean" ? own : config.maintenance;
  };

  const save = async () => {
    setStatus({ kind: "saving" });
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, config, by: editor }),
    }).catch(() => null);

    if (!res) {
      setStatus({ kind: "error", message: "Tidak bisa menghubungi server." });
      return;
    }
    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        config?: SiteConfig;
      };
      setStatus({ kind: "saved" });
      setPassword("");
      /* Take the server's copy, not ours: it carries the timestamp and the
         editor's name, and matching it is what clears the changed marks. */
      if (body.config) {
        setConfig(body.config);
        setSaved(body.config);
      } else {
        setSaved(config);
      }
      return;
    }
    const { error } = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    setStatus({
      kind: "error",
      message:
        error === "unauthorised"
          ? "Kata sandi salah."
          : error === "not-configured"
            ? "Server belum punya token GitHub. Lihat catatan di bawah."
            : error === "bad-config"
              ? "Ada isian yang belum benar."
              : "Gagal menyimpan. Coba lagi.",
    });
  };

  const copy = COPY[DEFAULT_LANG];
  const card = "rounded-[20px] border border-line-soft bg-surface px-5 py-[18px]";

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Website</div>
      <div className="mb-5 max-w-[760px] text-[13.5px] leading-[1.55] text-slate-soft">
        Pengaturan situs publik, satu tab per properti. Menyimpan menulis ulang
        berkas isi website di GitHub, lalu server membangun ulang situsnya.
        Perubahan biasanya terlihat sekitar satu menit setelah disimpan, bukan
        seketika.
      </div>

      {!writable && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px]">
          <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-amber-shade" />
          <div className="text-[13px] leading-[1.55] text-amber-ink">
            <strong>Belum bisa menyimpan dari sini.</strong> Server butuh tiga
            variabel: <code className="font-mono">GITHUB_TOKEN</code>{" "}
            (fine-grained, izin Contents: read and write untuk repo ini),{" "}
            <code className="font-mono">GITHUB_REPO</code> berisi{" "}
            <code className="font-mono">yudventure/unmehopamanagement</code>,
            dan <code className="font-mono">CMS_PASSWORD</code> yang akan
            ditanyakan sebelum menyimpan. Isian di bawah tetap bisa dilihat.
          </div>
        </div>
      )}

      {closedSites.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-danger-line bg-danger-tint px-4 py-[13px]">
          <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-danger" />
          <div className="text-[13px] leading-[1.55] text-danger-deep">
            <strong>
              Mode perbaikan menyala:{" "}
              {closedSites.map((s) => s.label).join(" dan ")}.
            </strong>{" "}
            {dirty[tab]
              ? "Belum berlaku sampai disimpan."
              : "Halamannya sedang menampilkan halaman tunggu, bukan situsnya."}{" "}
            Dashboard ini tidak terpengaruh.
          </div>
        </div>
      )}

      {/* Sub-tabs. The sections used to be one long scroll, which meant
          hunting for a price by eye every time. */}
      <div
        role="tablist"
        aria-label="Bagian pengaturan website"
        className="scrollbar-none mb-4 flex gap-[6px] overflow-x-auto"
      >
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 cursor-pointer items-center gap-[7px] rounded-[11px] border-none px-[14px] py-[9px] text-[13px] whitespace-nowrap ${
                on
                  ? "bg-teal font-bold text-white"
                  : "bg-surface-tint text-ink-soft hover:bg-surface-hover"
              }`}
            >
              {t.label}
              {/* Marks a tab holding an edit that is not in the file yet. With
                  five sections behind tabs, four of them are always off-screen
                  when Save is pressed. */}
              {dirty[t.key] && (
                <span
                  title="Ada perubahan yang belum disimpan"
                  className={`h-[7px] w-[7px] rounded-full ${
                    on ? "bg-white" : "bg-amber-shade"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {/* Kontak, media sosial dan status berlaku untuk situs yang sedang
            dibuka. `tab` itu situsnya, jadi tidak ada baris "situs mana" yang
            bisa terlewat dibaca sebelum mengetik. */}
        <>
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Kontak</div>
            <div className={NOTE}>
              Nomor WhatsApp dipakai tombol Kirim di website {LABEL_OF[tab]}.
              Email publik tampil di footernya. Email owner tidak tampil di mana
              pun; ke alamat itulah pesan dari website ini dikirim.
            </div>
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
              {(
                [
                  ["whatsapp", "WhatsApp (angka saja, kode negara di depan)", "628…"],
                  ["email", "Email publik", ""],
                  ["ownerEmail", "Email owner (penerima pesan)", ""],
                ] as const
              ).map(([field, label, ph]) => (
                <label key={field} className={LABEL}>
                  {label}
                  <input
                    value={siteContact(tab)[field] ?? ""}
                    onChange={(e) =>
                      patchSiteContact(
                        tab,
                        field,
                        field === "whatsapp"
                          ? digits(e.target.value)
                          : e.target.value,
                      )
                    }
                    inputMode={field === "whatsapp" ? "numeric" : undefined}
                    placeholder={ph}
                    className={`${FIELD}${field === "whatsapp" ? " font-mono" : ""}`}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-line-soft bg-surface-mute px-5 py-[18px]">
            <div className="mb-2 text-[15px] font-bold">
              Pesan dari website masuk ke email
            </div>
            <div className="max-w-[760px] text-[13px] leading-[1.6] text-slate">
              Setiap pesan dari tombol Kirim di website {LABEL_OF[tab]} dikirim
              ke <strong>{siteContact(tab).ownerEmail || "(belum diisi)"}</strong>,
              lengkap dengan nama, WhatsApp, email, rencana tanggal, jumlah
              orang, dan catatan tamu. Tombol balas di email langsung tertuju ke
              alamat tamunya.
              <br />
              <br />
              Pesannya tidak disimpan di aplikasi ini. Tidak ada database, dan
              kotak masuk email sudah menjadi tempat yang tepat untuk sesuatu
              yang perlu dibalas. Server butuh dua variabel:{" "}
              <code className="font-mono">RESEND_API_KEY</code> dari resend.com
              dan <code className="font-mono">ENQUIRY_FROM</code> berisi alamat
              pengirim di domain yang sudah diverifikasi di sana. Selama
              keduanya belum ada, tombol Kirim di website otomatis beralih
              membuka WhatsApp, jadi tidak ada pesan yang hilang.
            </div>
          </section>
        </>

        {(
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Media sosial</div>
            <div className={NOTE}>
              Tempel URL lengkap profil {LABEL_OF[tab]}, mis.{" "}
              <code className="font-mono">https://instagram.com/namaakun</code>.
              Dikosongkan pun tidak apa-apa: ikonnya tetap tampil, cuma jadi
              penanda redup yang tidak bisa diklik.
            </div>
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
              {(
                [
                  ["instagram", "Instagram", "https://instagram.com/…"],
                  ["facebook", "Facebook", "https://facebook.com/…"],
                  ["tiktok", "TikTok", "https://tiktok.com/@…"],
                ] as const
              ).map(([key, label, ph]) => (
                <label key={key} className={LABEL}>
                  {label}
                  <input
                    value={siteSocial(tab)[key] ?? ""}
                    onChange={(e) =>
                      patchSiteSocial(tab, key, e.target.value.trim())
                    }
                    placeholder={ph}
                    className={FIELD}
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {HAS_DIVING[tab] && (
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Tahun berdiri</div>
            <div className={NOTE}>
              Dipakai di halaman profil{" "}
              <code className="font-mono">/turtle/about</code>, untuk kalimat
              &ldquo;dive center berdiri sekian tahun setelah homestay&rdquo;,
              dan tahun homestay juga dipakai di footer (&ldquo;Raja Ampat ·
              sejak …&rdquo;). Selama masih kosong, halamannya cuma menyebut
              dive center-nya berdiri belakangan tanpa menyebut tahun, dan
              footernya cuma menulis &ldquo;Raja Ampat&rdquo;. Itu disengaja:
              tahun yang dikarang akan bertahan bertahun-tahun di sana.
            </div>
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              {(
                [
                  ["homestay", "Homestay berdiri"],
                  ["diveCenter", "Dive center berdiri"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className={LABEL}>
                  {label}
                  <input
                    value={config.founded?.[key] ?? ""}
                    onChange={(e) => {
                      const v = digits(e.target.value).slice(0, 4);
                      patch({
                        founded: {
                          ...(config.founded ?? {
                            homestay: null,
                            diveCenter: null,
                          }),
                          [key]: v ? Number(v) : null,
                        },
                      });
                    }}
                    inputMode="numeric"
                    placeholder="mis. 2016"
                    className={`${FIELD} font-mono`}
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {HAS_DIVING[tab] && (
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Harga paket selam</div>
            <div className={NOTE}>
              Nama dan keterangan tiap paket ada di kode; yang bisa diubah di
              sini angkanya. Harga kamar tidak ada di halaman ini karena
              diambil langsung dari Properti &amp; Kamar, supaya website dan
              dashboard tidak pernah berbeda.
            </div>
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {DIVE_KEYS.map((key) => (
                <label key={key} className={LABEL}>
                  {copy.dive.packages[key].name}
                  <span className="flex items-center gap-[7px]">
                    <span className="text-[12px] text-slate-mute">Rp</span>
                    <input
                      value={grouped(config.divePrices[key] ?? 0)}
                      onChange={(e) =>
                        patch({
                          divePrices: {
                            ...config.divePrices,
                            [key]: Number(digits(e.target.value)) || 0,
                          },
                        })
                      }
                      inputMode="numeric"
                      className={`${FIELD} text-right font-mono`}
                    />
                  </span>
                  <span className="text-[11.5px] text-slate-mute">
                    {copy.dive.packages[key].unit}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 border-t border-line-fine pt-3 text-[12.5px] text-slate-soft">
              Contoh harga yang sedang tayang: Fun Dive 2 tank{" "}
              {fmt(config.divePrices.fun2 ?? 0)}.
            </div>
          </section>
        )}

        {(
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Mode perbaikan</div>
            <div className={NOTE}>
              Saklar ini cuma menutup {LABEL_OF[tab]}. Keduanya dikerjakan
              bergantian, jadi menutup yang satu untuk diperbaiki tidak boleh
              ikut menutup yang sedang menerima tamu. Halaman yang ditutup
              diganti halaman tunggu berisi nama homestay, nomor WhatsApp, dan
              email, dua bahasa. Dashboard ini tidak ikut mati, jadi kamu tetap
              bisa bekerja.
              <br />
              <br />
              Menutup situs tidak berarti ikut mengunci diri sendiri. Kamu
              tinggal menekan tombol di bawah. Untuk orang lain yang tidak punya
              akses dashboard ini, kirimkan{" "}
              <code className="font-mono">/preview?token=…</code>.
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-line bg-surface-mute px-4 py-[13px]">
              <input
                type="checkbox"
                checked={siteClosed(tab)}
                onChange={(e) => patchSite(tab, { maintenance: e.target.checked })}
                className="mt-[3px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--color-teal)]"
              />
              <span>
                <span className="block text-[13.5px] font-medium">
                  Tutup {LABEL_OF[tab]}
                </span>
                <span className="mt-[2px] block text-[12.5px] leading-[1.5] text-slate-soft">
                  Sekarang: {siteClosed(tab) ? "ditutup" : "terbuka"}.
                </span>
              </span>
            </label>

            {/* The way in, for the person already signed in here.
                `/preview?token=…` is still what you send to somebody who is
                not, but nobody standing in the dashboard should have to go and
                look a token up. The route reads it on the server and hands the
                browser the cookie; the token itself never reaches this page,
                which is why this is a link to a route rather than a link this
                screen builds.

                `target="_blank"` on purpose: the dashboard is where the switch
                is, and sending somebody away from it to look at the result
                means a trip back to change their mind. */}
            <a
              href={`/api/preview?site=${tab}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-[11px] text-[13px] font-medium text-ink no-underline transition-colors hover:border-line-strong hover:bg-surface-hover hover:no-underline"
            >
              <span aria-hidden="true">↗</span>
              Lihat {LABEL_OF[tab]}
              {siteClosed(tab) && (
                <span className="text-[12px] font-normal text-slate-soft">
                  walau sedang ditutup
                </span>
              )}
            </a>

            {siteClosed(tab) && (
              <div className="mt-2 text-[12px] leading-[1.55] text-slate-soft">
                Butuh <code className="font-mono">PREVIEW_TOKEN</code> terpasang
                di server. Belum terpasang, tombol ini tetap membawa ke halaman
                tunggu, dan <code className="font-mono">/api/health</code>{" "}
                menyebutnya kosong.
              </div>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px]">
              <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-amber-shade" />
              <div className="text-[12.5px] leading-[1.55] text-amber-ink">
                <strong>Butuh sekitar satu menit, tidak seketika.</strong>{" "}
                Saklar ini disimpan ke berkas yang sama dengan harga dan kontak,
                dan situsnya dibangun ulang dulu sebelum berubah. Jadi ini alat
                untuk perbaikan yang direncanakan, bukan untuk mematikan situs
                buru-buru. Mematikannya kembali juga makan waktu yang sama, jadi
                nyalakan sesudah siap mengerjakan, bukan sebelumnya.
              </div>
            </div>

            <div className="mt-4 text-[12.5px] leading-[1.55] text-slate-soft">
              Tulisan di halaman tunggunya ada di kode (
              <code className="font-mono">web-content.ts</code>, kunci{" "}
              <code className="font-mono">maintenance</code>), dua bahasa,
              supaya tidak ada versi yang cuma terisi satu bahasa. Nomor dan
              email yang tampil di sana diambil dari Kontak di atas.
            </div>
          </section>
        )}

        {/* Save sits outside the tabs on purpose: it writes the whole file,
            not the tab that happens to be open. */}
        <section className={card}>
          <div className="flex flex-wrap items-end gap-4">
            <label className={`${LABEL} w-full max-w-[260px]`}>
              Kata sandi CMS
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={FIELD}
              />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={!writable || status.kind === "saving" || !password}
              /* `text-white` used to sit in the shared half of this string, so
                 the disabled state painted white on a light grey fill and
                 measured 1.44:1. The colour belongs to each state, not to
                 both: a disabled control still has to be readable, otherwise
                 nobody can tell what it is they cannot press. */
              className={`rounded-[10px] border-none px-5 py-[11px] text-[13.5px] font-semibold ${
                !writable || status.kind === "saving" || !password
                  ? "cursor-not-allowed bg-surface-tint text-slate-mute"
                  : "cursor-pointer bg-teal text-white hover:bg-teal-deep"
              }`}
            >
              {status.kind === "saving" ? "Menyimpan…" : "Simpan & terbitkan"}
            </button>

            {status.kind === "saved" && (
              <span className="text-[13px] text-teal-deep">
                Tersimpan. Servernya sedang membangun ulang; cek situsnya
                sekitar satu menit lagi.
              </span>
            )}
            {status.kind === "error" && (
              <span className="text-[13px] text-danger-ink">
                {status.message}
              </span>
            )}
          </div>

          <div className="mt-4 border-t border-line-fine pt-3 text-[12.5px] leading-[1.5] text-slate-soft">
            {dirtyCount > 0 ? (
              <>
                Menyimpan menerbitkan <strong>semua tab sekaligus</strong>, bukan
                yang sedang terbuka saja. Yang belum tersimpan sekarang:{" "}
                {TABS.filter((t) => dirty[t.key])
                  .map((t) => t.label)
                  .join(", ")}
                .
              </>
            ) : (
              <>
                Menyimpan menerbitkan semua tab sekaligus. Belum ada perubahan
                yang menunggu.
              </>
            )}
          </div>

          {config.updatedAt && (
            <div className="mt-3 border-t border-line-fine pt-3 font-mono text-[11.5px] text-slate-mute">
              Terakhir disimpan{" "}
              {new Date(config.updatedAt).toLocaleString("id-ID")}
              {config.updatedBy ? ` oleh ${config.updatedBy}` : ""}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
