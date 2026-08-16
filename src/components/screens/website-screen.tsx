"use client";

import { useEffect, useState } from "react";

import { fmt } from "@/lib/format";
import { DIVE_KEYS, COPY, DEFAULT_LANG } from "@/lib/web-content";
import type { SiteConfig } from "@/lib/site-config";

/**
 * The website's own settings, edited from inside the manager so the owner has
 * one place to work rather than a repository to open.
 *
 * What it edits is what an owner actually changes: the number and address
 * enquiries reach, and what the dive centre charges. Not the prose. Two
 * languages of copy, with its line breaks and its tone, is edited far better
 * in a code review than in a textarea, and putting it here would mean either
 * half a translation shipping or a translator's job in a form.
 *
 * Saving writes `content/site.json` back to the repository through the GitHub
 * API, which makes Vercel rebuild. That is a minute or so before the change is
 * live, which is why the screen says so rather than pretending the save was
 * instant.
 */

const FIELD =
  "w-full rounded-[10px] border border-line-input bg-surface px-[12px] py-[9px] text-[13.5px] outline-none focus:border-teal";
const LABEL = "flex flex-col gap-[6px] text-[12.5px] text-slate";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const digits = (s: string) => s.replace(/\D/g, "");
const grouped = (n: number) => n.toLocaleString("id-ID");

export interface WebsiteScreenProps {
  /** The signed-in name, recorded on the commit. */
  editor: string;
}

export function WebsiteScreen({ editor }: WebsiteScreenProps) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  /* Whether the server has the GitHub token and password it needs. Until it
     does the form is read-only rather than a Save that quietly does nothing. */
  const [writable, setWritable] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.config);
        setWritable(Boolean(d.writable));
      })
      .catch(() =>
        setStatus({ kind: "error", message: "Gagal memuat pengaturan." }),
      );
  }, []);

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
      setStatus({ kind: "saved" });
      setPassword("");
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

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Website</div>
      <div className="mb-5 max-w-[760px] text-[13.5px] leading-[1.55] text-slate-soft">
        Pengaturan halaman publik di <code className="font-mono">/turtle</code>.
        Menyimpan akan menulis ulang berkas isi website di GitHub, lalu Vercel
        membangun ulang situsnya. Perubahan biasanya terlihat sekitar satu menit
        setelah disimpan, bukan seketika.
      </div>

      {!writable && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px]">
          <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-amber-shade" />
          <div className="text-[13px] leading-[1.55] text-amber-ink">
            <strong>Belum bisa menyimpan dari sini.</strong> Server butuh tiga
            variabel di Vercel: <code className="font-mono">GITHUB_TOKEN</code>{" "}
            (fine-grained, izin Contents: read and write untuk repo ini),{" "}
            <code className="font-mono">GITHUB_REPO</code> berisi{" "}
            <code className="font-mono">yudventure/unmehopamanagement</code>,
            dan <code className="font-mono">CMS_PASSWORD</code> yang akan
            ditanyakan sebelum menyimpan. Isian di bawah tetap bisa dilihat.
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <section className="rounded-[20px] border border-line-soft bg-surface px-5 py-[18px]">
          <div className="mb-1 text-[15px] font-bold">Kontak</div>
          <div className="mb-4 text-[12.5px] leading-[1.5] text-slate-soft">
            Nomor WhatsApp dipakai tombol Kirim di website. Email publik tampil
            di footer. Email owner tidak tampil di mana pun; ke alamat itulah
            pesan dari website dikirim.
          </div>
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
            <label className={LABEL}>
              WhatsApp (angka saja, kode negara di depan)
              <input
                value={config.contact.whatsapp}
                onChange={(e) =>
                  patch({
                    contact: {
                      ...config.contact,
                      whatsapp: digits(e.target.value),
                    },
                  })
                }
                inputMode="numeric"
                placeholder="628…"
                className={`${FIELD} font-mono`}
              />
            </label>
            <label className={LABEL}>
              Email publik
              <input
                value={config.contact.email}
                onChange={(e) =>
                  patch({
                    contact: { ...config.contact, email: e.target.value },
                  })
                }
                className={FIELD}
              />
            </label>
            <label className={LABEL}>
              Email owner (penerima pesan)
              <input
                value={config.contact.ownerEmail}
                onChange={(e) =>
                  patch({
                    contact: { ...config.contact, ownerEmail: e.target.value },
                  })
                }
                className={FIELD}
              />
            </label>
          </div>
        </section>

        <section className="rounded-[20px] border border-line-soft bg-surface px-5 py-[18px]">
          <div className="mb-1 text-[15px] font-bold">Tahun berdiri</div>
          <div className="mb-4 text-[12.5px] leading-[1.5] text-slate-soft">
            Dipakai di halaman profil <code className="font-mono">/turtle/about</code>,
            untuk kalimat &ldquo;dive center berdiri sekian tahun setelah
            homestay&rdquo;. Selama masih kosong, halamannya cuma menyebut dive
            center-nya berdiri belakangan tanpa menyebut tahun — itu disengaja.
            Tahun yang dikarang akan bertahan bertahun-tahun di sana.
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

        <section className="rounded-[20px] border border-line-soft bg-surface px-5 py-[18px]">
          <div className="mb-1 text-[15px] font-bold">Harga paket selam</div>
          <div className="mb-4 text-[12.5px] leading-[1.5] text-slate-soft">
            Nama dan keterangan tiap paket ada di kode; yang bisa diubah di sini
            angkanya. Harga kamar tidak ada di halaman ini karena diambil
            langsung dari Properti &amp; Kamar, supaya website dan dashboard
            tidak pernah berbeda.
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
        </section>

        <section className="rounded-[20px] border border-line-soft bg-surface px-5 py-[18px]">
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
              className={`rounded-[10px] border-none px-5 py-[11px] text-[13.5px] font-bold text-white ${
                !writable || status.kind === "saving" || !password
                  ? "cursor-not-allowed bg-line-input text-slate-mute"
                  : "cursor-pointer bg-teal hover:bg-teal-deep"
              }`}
            >
              {status.kind === "saving" ? "Menyimpan…" : "Simpan & terbitkan"}
            </button>

            {status.kind === "saved" && (
              <span className="text-[13px] text-teal-deep">
                Tersimpan. Vercel sedang membangun ulang; cek situsnya sekitar
                satu menit lagi.
              </span>
            )}
            {status.kind === "error" && (
              <span className="text-[13px] text-danger-ink">
                {status.message}
              </span>
            )}
          </div>

          {config.updatedAt && (
            <div className="mt-4 border-t border-line-fine pt-3 font-mono text-[11.5px] text-slate-mute">
              Terakhir disimpan {new Date(config.updatedAt).toLocaleString("id-ID")}
              {config.updatedBy ? ` oleh ${config.updatedBy}` : ""}
            </div>
          )}
        </section>

        <section className="rounded-[20px] border border-line-soft bg-surface-mute px-5 py-[18px]">
          <div className="mb-2 text-[15px] font-bold">
            Pesan dari website masuk ke email
          </div>
          <div className="max-w-[760px] text-[13px] leading-[1.6] text-slate">
            Setiap pesan dari tombol Kirim di website dikirim ke{" "}
            <strong>{config.contact.ownerEmail}</strong>, lengkap dengan nama,
            WhatsApp, email, rencana tanggal, jumlah orang, dan catatan tamu.
            Tombol balas di email langsung tertuju ke alamat tamunya.
            <br />
            <br />
            Pesannya tidak disimpan di aplikasi ini. Tidak ada database, dan
            kotak masuk email sudah menjadi tempat yang tepat untuk sesuatu yang
            perlu dibalas. Server butuh dua variabel di Vercel:{" "}
            <code className="font-mono">RESEND_API_KEY</code> dari resend.com
            dan <code className="font-mono">ENQUIRY_FROM</code> berisi alamat
            pengirim di domain yang sudah diverifikasi di sana. Selama keduanya
            belum ada, tombol Kirim di website otomatis beralih membuka
            WhatsApp, jadi tidak ada pesan yang hilang.
          </div>
          <div className="mt-4 text-[12.5px] text-slate-soft">
            Contoh harga yang sedang tayang: Fun Dive 2 tank{" "}
            {fmt(config.divePrices.fun2 ?? 0)}.
          </div>
        </section>
      </div>
    </div>
  );
}
