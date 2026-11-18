"use client";

import { useEffect, useMemo, useState } from "react";

import { DiveVideo, DiveVideoSlot } from "@/components/web/dive-video";
import { fmt } from "@/lib/format";
import { COPY, DEFAULT_LANG, PRICE_GROUPS, diveCards } from "@/lib/web-content";
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

/**
 * The paragraph that explains a control, folded until someone wants it.
 *
 * Every card here opened with its explanation and reached its fields
 * underneath, which turned the screen into a document with inputs in it: five
 * paragraphs stood between the top of the page and the first thing that could
 * be typed into. The prose is good and none of it is being deleted — it is
 * simply read once, on the first visit, while the fields are what the second
 * visit and every one after it came for.
 *
 * `<details>` rather than a state flag, because the browser already has this
 * control: it opens on click, it opens on Enter, it is announced as expandable
 * without any `aria-` of ours, and Ctrl+F opens it to reach the text inside —
 * which is the one behaviour a hand-rolled version reliably loses, and the one
 * that matters most for a paragraph that names an environment variable
 * somebody is searching for.
 */
function Explain({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mb-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-[6px] text-[12.5px] text-slate-mute hover:text-slate [&::-webkit-details-marker]:hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0 group-open:rotate-180"
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Penjelasan
      </summary>
      <div className="mt-[10px] max-w-[760px] text-[12.5px] leading-[1.55] text-slate-soft">
        {children}
      </div>
    </details>
  );
}

/**
 * The address to send to whoever is waiting to see the work.
 *
 * A site closed for work is closed to the person it belongs to as well, and
 * that is backwards — the changes are theirs to look at and sign off. The way
 * through already existed; what did not was any way to get hold of it without
 * opening the server panel and reading an environment variable, which is not
 * a thing to ask of somebody standing on a jetty with a phone.
 *
 * ## What it hands over, said plainly
 *
 * The link carries the token itself, so it is a key and not an invitation:
 * anyone it is forwarded to gets in too, and there is no way to withdraw it
 * from one person. Taking it back means changing `PREVIEW_TOKEN` on the
 * server, which locks out everybody at once, the owner included. That is worth
 * a sentence on the screen rather than a surprise later, because the natural
 * thing to do with a link is paste it into a group chat.
 *
 * The full address is shown rather than masked. A button that copies something
 * different from what is on screen is a small lie, and the one moment it
 * matters is the moment somebody is checking whether they are about to send
 * the right thing to a guest.
 */
function ShareLink({
  url,
  configured,
  siteLabel,
  closed,
}: {
  url?: string;
  configured: boolean;
  siteLabel: string;
  closed: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!configured || !url) {
    return (
      <div className="mt-4 rounded-[14px] border border-line bg-surface-mute px-4 py-[13px] text-[12.5px] leading-[1.55] text-slate-soft">
        <strong className="font-semibold text-ink">
          Belum ada link untuk klien.
        </strong>{" "}
        Tanpa <code className="font-mono">PREVIEW_TOKEN</code> tidak ada link
        yang bisa dikirim, dan tidak ada siapa pun yang bisa melewati halaman
        tunggu. Pasang tokennya, muat ulang halaman ini, dan linknya muncul di
        sini.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-line bg-surface-mute px-4 py-[13px]">
      <div className="mb-[2px] text-[13.5px] font-medium text-ink">
        Link untuk klien
      </div>
      <div className="mb-[10px] text-[12.5px] leading-[1.5] text-slate-soft">
        {closed
          ? `Kirimkan ini supaya klien bisa melihat ${siteLabel} yang sedang ditutup. Yang membukanya melihat situs aslinya, bukan halaman tunggu.`
          : `${siteLabel} sedang terbuka untuk umum, jadi klien belum butuh ini. Linknya tetap bekerja nanti kalau situsnya ditutup lagi.`}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 overflow-hidden rounded-[9px] border border-line-input bg-surface px-[11px] py-[7px] font-mono text-[11.5px] text-ellipsis whitespace-nowrap text-ink-soft">
          {url}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="cursor-pointer rounded-[9px] border border-line-strong bg-surface px-[13px] py-[7px] text-[12.5px] font-medium hover:bg-surface-hover"
        >
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>

      <div className="mt-[10px] text-[12px] leading-[1.5] text-slate-soft">
        Link ini adalah kuncinya, bukan undangan: siapa pun yang diteruskan
        link ini ikut bisa masuk, dan tidak ada cara mencabutnya dari satu orang
        saja. Menariknya kembali berarti mengganti{" "}
        <code className="font-mono">PREVIEW_TOKEN</code> di panel server, dan
        itu mengunci semua orang sekaligus, Anda termasuk.
      </div>
    </div>
  );
}

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
  turtle: (c) => [c.sites?.turtle, c.founded, c.divePrices, c.diveVideo],
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
  /**
   * Mengunci layar ke satu situs, dari menu unit (Turtle atau Eddo). Kosong
   * berarti kedua situs dengan tab seperti dulu, untuk peran yang mengurus
   * keduanya tanpa melalui unit.
   */
  situs?: PublicSite;
}

export function WebsiteScreen({ editor, situs }: WebsiteScreenProps) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  /* What the server last gave us, kept so a tab can say it has been touched.
     Replaced on a successful save, which is what clears the marks. */
  const [saved, setSaved] = useState<SiteConfig | null>(null);
  /* Whether the server has the GitHub token and password it needs. Until it
     does the form is read-only rather than a Save that quietly does nothing. */
  const [writable, setWritable] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [tab, setTab] = useState<TabKey>(situs ?? "eddo");
  /* Pindah antar unit di menu mempertahankan layar ini tetap terpasang, jadi
     draf yang belum disimpan tidak hilang; hanya situsnya yang berganti. */
  useEffect(() => {
    if (situs) setTab(situs);
  }, [situs]);
  /* The share links, per site. Null until the answer arrives; an object with
     `configured: false` once it has and there is no token on the server. Kept
     apart from `config` because it comes from somewhere else and for a
     different reason: that file is public, and this is not. */
  const [preview, setPreview] = useState<{
    configured: boolean;
    links: Partial<Record<PublicSite, string>>;
  } | null>(null);

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

  /* Its own request, on its own endpoint, because the token in it must never
     ride along in a response anyone can ask for. A 401 lands here as "not
     configured", which is the right thing to show: either way there is no link
     to hand out. */
  useEffect(() => {
    fetch("/api/preview-link")
      .then((r) => (r.ok ? r.json() : { configured: false, links: {} }))
      .then(setPreview)
      .catch(() => setPreview({ configured: false, links: {} }));
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
      body: JSON.stringify({ sandi: password, config, by: editor }),
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
        error === "wrong-password"
          ? "Kata sandi akun Anda salah."
          : error === "too-many"
            ? "Terlalu banyak percobaan. Tunggu beberapa menit."
            : error === "unauthorised"
              ? "Sesi Anda berakhir atau tidak berhak menyimpan. Masuk lagi."
              : error === "not-configured"
                ? "Server belum punya token GitHub. Lihat catatan di bawah."
                : error === "bad-config"
                  ? "Ada isian yang belum benar."
                  : error === "forbidden"
                    ? "Anda hanya bisa mengubah bagian website yang menjadi milik Anda."
                    : "Gagal menyimpan. Coba lagi.",
    });
  };

  const copy = COPY[DEFAULT_LANG];
  /* The same join the website uses, so a field here is labelled with the
     heading of the card it changes rather than with a key. */
  const cards = diveCards(copy);
  const card = "rounded-[20px] border border-line-soft bg-surface px-5 py-[18px]";

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">
        {situs ? `Website ${LABEL_OF[situs]}` : "Website"}
      </div>
      <div className="mb-3 max-w-[760px] text-[13.5px] leading-[1.55] text-slate-soft">
        {situs
          ? `Pengaturan situs publik ${LABEL_OF[situs]}.`
          : "Pengaturan situs publik, satu tab per properti."}
      </div>
      <div className="mb-5">
        <Explain>
          Menyimpan menulis ulang berkas isi website di GitHub, lalu server
          membangun ulang situsnya. Perubahan biasanya terlihat sekitar satu
          menit setelah disimpan, bukan seketika.
        </Explain>
      </div>

      {!writable && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px]">
          <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-amber-shade" />
          <div className="text-[13px] leading-[1.55] text-amber-ink">
            <strong>Belum bisa menyimpan dari sini.</strong> Server butuh dua
            variabel: <code className="font-mono">GITHUB_TOKEN</code>{" "}
            (fine-grained, izin Contents: read and write untuk repo ini),{" "}
            <code className="font-mono">GITHUB_REPO</code> berisi{" "}
            <code className="font-mono">yudventure/unmehopamanagement</code>.
            Isian di bawah tetap bisa dilihat.
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
        {TABS.filter((t) => !situs || t.key === situs).map((t) => {
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
            <Explain>
              Nomor WhatsApp dipakai tombol Kirim di website {LABEL_OF[tab]}.
              Email publik tampil di footernya. Email owner tidak tampil di mana
              pun; ke alamat itulah pesan dari website ini dikirim.
            </Explain>
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
            {/* The address is the whole point of the card and the only part of
                it that changes, so it stays out where it can be checked at a
                glance. The rest is how it works, which is read once. */}
            <div className="mb-3 max-w-[760px] text-[13px] leading-[1.6] text-slate">
              Pesan dari tombol Kirim di website {LABEL_OF[tab]} dikirim ke{" "}
              <strong>{siteContact(tab).ownerEmail || "(belum diisi)"}</strong>.
            </div>
            <Explain>
              Isinya lengkap: nama, WhatsApp, email, rencana tanggal, jumlah
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
            </Explain>
          </section>
        </>

        {(
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Media sosial</div>
            <Explain>
              Tempel URL lengkap profil {LABEL_OF[tab]}, mis.{" "}
              <code className="font-mono">https://instagram.com/namaakun</code>.
              Dikosongkan pun tidak apa-apa: ikonnya tetap tampil, cuma jadi
              penanda redup yang tidak bisa diklik.
            </Explain>
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
            <Explain>
              Dipakai di halaman profil{" "}
              <code className="font-mono">/turtle/about</code>, untuk kalimat
              &ldquo;dive center berdiri sekian tahun setelah homestay&rdquo;,
              dan tahun homestay juga dipakai di footer (&ldquo;Raja Ampat ·
              sejak …&rdquo;). Selama masih kosong, halamannya cuma menyebut
              dive center-nya berdiri belakangan tanpa menyebut tahun, dan
              footernya cuma menulis &ldquo;Raja Ampat&rdquo;. Itu disengaja:
              tahun yang dikarang akan bertahan bertahun-tahun di sana.
            </Explain>
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
            <div className="mb-1 text-[15px] font-bold">Harga selam</div>
            <Explain>
              Nama dan keterangan tiap baris ada di kode; yang bisa diubah di
              sini angkanya. Tiap baris di sini adalah satu kartu di halaman
              selam, dengan urutan dan kelompok yang sama persis. Angka nol
              berarti &quot;tanya harga&quot; di situs, bukan gratis — jadi
              baris yang belum ada harganya jangan diisi nol pura-pura.
              Harga bungalow tidak ada di halaman ini karena diambil langsung
              dari Properti &amp; Kamar, supaya website dan dashboard tidak
              pernah berbeda.
            </Explain>
            {/* Grouped exactly as the website groups them, from the same
                list: every row of the family's 2025 price list is a card on
                the dive page now, so a field here is a card there, in the
                same order, under the same heading. A field left at nol is
                not free — the page asks instead of quoting, which is what
                carries the one line on the family's own list that came
                through unreadable. */}
            {PRICE_GROUPS.map((group) => (
              <div key={group} className="mt-5 first:mt-2">
                <div className="mb-[10px] text-[14px] font-bold">
                  {copy.dive.list.groups[group]}
                </div>
                <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
                  {cards
                    .filter((c) => c.group === group)
                    .map((c) => (
                      <label key={c.key} className={LABEL}>
                        {c.name}
                        <span className="flex items-center gap-[7px]">
                          <span className="text-[12px] text-slate-mute">
                            Rp
                          </span>
                          <input
                            value={grouped(config.divePrices[c.key] ?? 0)}
                            onChange={(e) =>
                              patch({
                                divePrices: {
                                  ...config.divePrices,
                                  [c.key]: Number(digits(e.target.value)) || 0,
                                },
                              })
                            }
                            inputMode="numeric"
                            className={`${FIELD} text-right font-mono`}
                          />
                        </span>
                        <span className="text-[11.5px] text-slate-mute">
                          {c.unit}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            ))}

            <div className="mt-6 border-t border-line-fine pt-3 text-[12.5px] text-slate-soft">
              Contoh harga yang sedang tayang: dua fun dive satu pagi{" "}
              {fmt(config.divePrices.fun2 ?? 0)}.
            </div>
          </section>
        )}

        {HAS_DIVING[tab] && (
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">
              Video di halaman selam
            </div>
            <Explain>
              Klip yang muncul tepat di atas bar &quot;Cek ketersediaan&quot;.
              Bisa diisi dua macam: tempel tautan YouTube (youtube.com/watch,
              youtu.be, atau Shorts), atau tulis nama berkas video yang ada di
              folder <code>public/</code>, misalnya <code>/dive.mp4</code>.
              Kalau tautannya YouTube, yang dimuat cuma gambar sampulnya —
              videonya baru betul-betul dimuat setelah tamu menekan tombol
              putar, jadi halaman ini tidak jadi berat untuk yang tidak
              menontonnya. Kalau kotak ini dikosongkan, tidak ada apa-apa yang
              digambar di sana: lebih baik tidak ada video daripada ada kotak
              hitam kosong.
            </Explain>
            <label className={LABEL}>
              Tautan YouTube atau nama berkas
              <input
                value={config.diveVideo ?? ""}
                onChange={(e) => patch({ diveVideo: e.target.value })}
                placeholder="https://youtu.be/… atau /dive.mp4"
                inputMode="url"
                className={FIELD}
              />
            </label>
            {(config.diveVideo ?? "").trim() && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => patch({ diveVideo: "" })}
                  className="cursor-pointer rounded-[10px] border border-danger bg-transparent px-4 py-2 text-[13px] font-semibold text-danger hover:bg-danger hover:text-white"
                >
                  Hapus video
                </button>
                <span className="text-[12.5px] text-slate-soft">
                  Mengosongkan kotak di atas. Videonya baru hilang dari situs
                  setelah Anda menekan Simpan &amp; terbitkan.
                </span>
              </div>
            )}

            {/* The same component the website draws, with what is being
                typed. An owner filling this in should be looking at the
                thing itself rather than at a text field and a promise —
                and a link that turns out to be a playlist or a channel is
                worth finding out about here rather than after a deploy. */}
            <div className="mt-4">
              <div className="mb-[10px] text-[12.5px] text-slate">
                Yang akan dilihat tamu
              </div>
              {(config.diveVideo ?? "").trim() ? (
                <DiveVideo
                  key={config.diveVideo}
                  src={config.diveVideo}
                  label={copy.dive.videoLabel}
                  play={copy.dive.videoPlay}
                  soon="Tidak bisa dimuat. Periksa nama berkasnya, atau tempel tautan YouTube."
                />
              ) : (
                <DiveVideoSlot text="Belum ada video. Tempel tautan YouTube atau nama berkas di atas, lalu Simpan." />
              )}
            </div>
          </section>
        )}

        {(
          <section className={card}>
            <div className="mb-1 text-[15px] font-bold">Mode perbaikan</div>
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

            {/* Beside the button, not somewhere else in the card. Both answer
                the same question — how does anyone see this while it is shut —
                and they differ only in who is asking: the button is for
                whoever is signed in here, this is for whoever is not. Split
                apart, the second one reads as a repeat of the first. */}
            <ShareLink
              url={preview?.links[tab]}
              configured={Boolean(preview?.configured)}
              siteLabel={LABEL_OF[tab]}
              closed={siteClosed(tab)}
            />

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

            {/* Below the switch and the warning, because by the time this
                matters the switch has already been found. */}
            <div className="mt-4">
              <Explain>
                Saklar ini cuma menutup {LABEL_OF[tab]}. Keduanya dikerjakan
                bergantian, jadi menutup yang satu untuk diperbaiki tidak boleh
                ikut menutup yang sedang menerima tamu. Dashboard ini tidak ikut
                mati, jadi kamu tetap bisa bekerja.
                <br />
                <br />
                Menutup situs tidak berarti ikut mengunci diri sendiri. Kamu
                tinggal menekan tombol Lihat di atas; tokennya dibaca di server
                dan tidak pernah sampai ke halaman ini. Untuk orang lain yang
                tidak punya akses dashboard, salin link di bawah tombol itu.
                <br />
                <br />
                Halaman yang ditutup diganti halaman tunggu berisi nama
                homestay, nomor WhatsApp, dan email, dua bahasa. Tulisannya ada
                di kode (<code className="font-mono">web-content.ts</code>,
                kunci <code className="font-mono">maintenance</code>), supaya
                tidak ada versi yang cuma terisi satu bahasa. Nomor dan email
                yang tampil di sana diambil dari Kontak di atas.
                <br />
                <br />
                Yang mengerjakan situsnya tetap bisa melihat aslinya lewat{" "}
                <code className="font-mono">/preview?token=…</code>, jadi
                menutup situs tidak berarti ikut mengunci diri sendiri.
              </Explain>
            </div>
          </section>
        )}

        {/* Save sits outside the tabs on purpose: it writes the whole file,
            not the tab that happens to be open. */}
        <section className={card}>
          <div className="flex flex-wrap items-end gap-4">
            <label className={`${LABEL} w-full max-w-[260px]`}>
              Kata sandi akun Anda
              <input
                type="password"
                autoComplete="current-password"
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
