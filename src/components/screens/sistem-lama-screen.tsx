"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Pill } from "@/components/ui/pill";
import type { PillColors } from "@/lib/pills";
import type { BookingLama } from "@/lib/sistem-lama";

/**
 * The old Turtle system's records, shown here.
 *
 * Everything on this screen arrives over one GET and leaves again when the
 * page closes. Nothing is copied into our database, nothing is written back,
 * and there is no button here that could — the endpoint behind it has no
 * shape for a write. That is stated on the screen too, not only in this
 * comment, because the person reading it is being asked to trust that the
 * client's live system is safe while they poke at it.
 *
 * Fields are drawn defensively. The shape below was read off the old
 * dashboard's own rendering code rather than a schema, so a booking may be
 * missing anything at all. Missing reads as "—". Nothing is filled in.
 */

interface Jawaban {
  ok: boolean;
  siap: boolean;
  pesan: string | null;
  ms?: number;
  bookings?: BookingLama[];
}

/* Repeated from `sistem-lama.ts` rather than imported: that module is
   server-only, and importing a type from it would be fine while importing it
   by habit later would not. */
function namaTamu(b: BookingLama): string {
  for (const c of [b.guestName, b.name, b.nama]) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function jumlahTamu(b: BookingLama): number | null {
  const daftar = b.guestNamesList;
  if (Array.isArray(daftar)) return daftar.length || null;
  if (typeof daftar === "string" && daftar.trim()) {
    return daftar.split(/[\n,;]+/).filter((s) => s.trim()).length || null;
  }
  const kap = Number(b.capacity);
  return Number.isFinite(kap) && kap > 0 ? kap : null;
}

function diminta(nilai: unknown): boolean {
  if (typeof nilai === "boolean") return nilai;
  if (typeof nilai === "number") return nilai > 0;
  if (typeof nilai === "string") {
    const v = nilai.trim().toLowerCase();
    return v !== "" && v !== "0" && v !== "no" && v !== "false" && v !== "-";
  }
  return false;
}

/** The date as the old Sheet wrote it, tidied only when it is recognisable. */
function tanggal(nilai: unknown): string {
  if (typeof nilai !== "string" || !nilai.trim()) return "";
  const teks = nilai.trim();
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(teks);
  if (!cocok) return teks;
  const d = new Date(`${cocok[1]}-${cocok[2]}-${cocok[3]}T00:00:00`);
  if (Number.isNaN(d.getTime())) return teks;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PERMINTAAN: { key: keyof BookingLama; label: string }[] = [
  { key: "reqDiving", label: "Diving" },
  { key: "reqSnorkeling", label: "Snorkeling" },
  { key: "reqTryDive", label: "Try dive" },
  { key: "reqSSICourse", label: "Kursus SSI" },
  { key: "reqTransport", label: "Transport" },
  { key: "reqExcursion", label: "Excursion" },
  { key: "reqExtraBed", label: "Extra bed" },
];

/* Same warm family as `pills.ts`; repeated here because those helpers take a
   `BookingStatus`, and nothing the old system sends is one. */
const MINT: PillColors = { bg: "#DCEFE3", fg: "#216B4B" };
const CLAY: PillColors = { bg: "#FBE3DA", fg: "#B04A3A" };
const STONE: PillColors = { bg: "#F2EBE0", fg: "#6B6357" };

function Kosong() {
  return <span className="text-slate-mute">—</span>;
}

function Status({ b }: { b: BookingLama }) {
  const teks =
    (typeof b.displayStatus === "string" && b.displayStatus.trim()) ||
    (typeof b.status === "string" && b.status.trim()) ||
    "";
  if (!teks) return <Kosong />;

  /* Matched on the words the old system happens to use rather than on a
     status list, because it has no list we have read. An unrecognised status
     still gets a chip — stone — instead of being dropped. */
  const v = teks.toLowerCase();
  const warna =
    v.includes("cancel") || v.includes("no show")
      ? CLAY
      : v.includes("in") && !v.includes("out")
        ? MINT
        : STONE;

  return <Pill colors={warna}>{teks}</Pill>;
}

function BarisBooking({ b }: { b: BookingLama }) {
  const nama = namaTamu(b);
  const orang = jumlahTamu(b);
  const minta = PERMINTAAN.filter((p) => diminta(b[p.key]));

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-[6px] border-b border-line-fine px-4 py-[13px] last:border-b-0 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.9fr)]">
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold">
          {nama || <Kosong />}
        </div>
        <div className="truncate font-mono text-[11px] text-slate-mute">
          {typeof b.confirmationNo === "string" && b.confirmationNo
            ? b.confirmationNo
            : "tanpa nomor"}
          {orang ? ` · ${orang} orang` : ""}
        </div>
      </div>

      <div className="min-w-0 text-[12.5px] text-slate-soft">
        {tanggal(b.checkIn) || <Kosong />}
        <span className="text-slate-mute"> → </span>
        {tanggal(b.checkOut) || <Kosong />}
      </div>

      <div className="min-w-0 truncate text-[12.5px] text-slate-soft">
        {typeof b.room === "string" && b.room.trim() ? (
          `Room ${b.room}`
        ) : (
          <Kosong />
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-start gap-[5px]">
        <Status b={b} />
        {minta.map((p) => (
          <Pill key={String(p.key)} colors={STONE}>
            {p.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}

export function SistemLamaScreen() {
  const [jawaban, setJawaban] = useState<Jawaban | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [cari, setCari] = useState("");

  const muat = useCallback(async () => {
    setSibuk(true);
    try {
      const res = await fetch("/api/sistem-lama", { cache: "no-store" });
      if (res.status === 404) {
        setJawaban({
          ok: false,
          siap: false,
          pesan: "Sesi Anda sudah habis. Masuk lagi untuk membacanya.",
        });
        return;
      }
      setJawaban((await res.json()) as Jawaban);
    } catch {
      setJawaban({
        ok: false,
        siap: true,
        pesan: "Tidak bisa menghubungi server ini sendiri.",
      });
    } finally {
      setSibuk(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const bookings = useMemo(() => jawaban?.bookings ?? [], [jawaban]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const ladang = [
        namaTamu(b),
        typeof b.confirmationNo === "string" ? b.confirmationNo : "",
        typeof b.room === "string" ? b.room : "",
        typeof b.whatsapp === "string" ? b.whatsapp : "",
      ];
      return ladang.some((f) => f.toLowerCase().includes(q));
    });
  }, [bookings, cari]);

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Sistem lama</div>
      <div className="mb-4 max-w-[760px] text-[13.5px] leading-[1.55] text-slate-soft">
        Apa yang sudah tercatat di sistem staf Turtle yang sekarang, dibaca
        langsung dari sana dan ditampilkan di sini. Bacaan saja:{" "}
        <strong>tidak ada satu pun yang diubah, ditambah, atau dihapus</strong>{" "}
        di sistem lamanya, dan tidak ada tombol di layar ini yang bisa.
      </div>

      <div className="mb-5 flex items-start gap-[12px] rounded-[14px] border border-line-soft bg-surface-soft px-4 py-[13px]">
        <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-slate-mute" />
        <div className="text-[13px] leading-[1.55] text-slate-soft">
          Datanya tetap tinggal di Google Sheet milik client. Yang ada di sini
          cuma salinan sesaat di layar — tutup halamannya, hilang. Sistem
          lamanya terus jalan seperti biasa selama layar ini dibuka.
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void muat()}
          disabled={sibuk}
          className="h-[38px] rounded-[10px] border border-line-input bg-surface px-4 text-[13px] font-medium hover:bg-surface-hover disabled:opacity-50"
        >
          {sibuk ? "Membaca…" : "Baca ulang"}
        </button>
        {jawaban?.ok && (
          <div className="font-mono text-[11px] text-slate-mute">
            adminList · {jawaban.ms ?? 0} ms
          </div>
        )}
      </div>

      {jawaban && !jawaban.siap && (
        <div className="rounded-[16px] border border-amber-soft bg-amber-soft/40 px-5 py-[18px]">
          <div className="mb-2 text-[14px] font-bold text-amber-ink">
            Belum disambungkan
          </div>
          <div className="mb-3 text-[13px] leading-[1.6] text-amber-ink">
            {jawaban.pesan ??
              "Alamat dan password sistem lama belum diisi di server."}
          </div>
          <div className="text-[13px] leading-[1.6] text-amber-ink">
            Isi dua variabel ini di panel Hostinger, lalu buka lagi layar ini:
          </div>
          <pre className="mt-2 overflow-x-auto rounded-[10px] bg-surface px-[13px] py-[11px] font-mono text-[11.5px] text-slate-soft">
            {
              "SISTEM_LAMA_URL=https://script.google.com/macros/s/…/exec\nSISTEM_LAMA_PASSWORD=…"
            }
          </pre>
          <div className="mt-3 text-[12.5px] leading-[1.6] text-amber-ink">
            Passwordnya tinggal di server dan tidak pernah ikut terkirim ke
            peramban, karena sistem lama menaruh password di dalam alamat —
            begitu nilainya sampai di browser, siapa pun yang membuka devtools
            memegang kunci sistem yang <em>bisa</em> menulis.
          </div>
        </div>
      )}

      {jawaban && jawaban.siap && !jawaban.ok && (
        <div className="rounded-[16px] border border-danger-line bg-danger-tint px-5 py-[18px]">
          <div className="mb-1 text-[14px] font-bold text-danger-deep">
            Belum bisa dibaca
          </div>
          <div className="text-[13px] leading-[1.6] text-danger-ink">
            {jawaban.pesan ?? "Tidak ada keterangan dari sistem lama."}
          </div>
        </div>
      )}

      {jawaban && jawaban.ok && (
        <div className="overflow-hidden rounded-[20px] border border-line-soft bg-surface">
          <div className="flex flex-wrap items-center gap-3 border-b border-line-fine px-4 py-[13px]">
            <div className="text-[13.5px] font-bold">
              {tersaring.length === bookings.length
                ? `${bookings.length} booking`
                : `${tersaring.length} dari ${bookings.length} booking`}
            </div>
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              aria-label="Cari di catatan sistem lama"
              placeholder="Cari di catatan sistem lama…"
              className="ml-auto h-[34px] w-full min-w-[200px] rounded-[9px] border border-line-input bg-surface px-[11px] text-[12.5px] outline-none focus:border-teal sm:w-[280px]"
            />
          </div>

          {tersaring.length === 0 ? (
            <div className="px-4 py-[22px] text-[13px] text-slate-soft">
              {bookings.length === 0
                ? "Sistem lama menjawab, tapi daftarnya kosong."
                : "Tidak ada yang cocok dengan pencarian itu."}
            </div>
          ) : (
            <div className="flex flex-col">
              {tersaring.map((b, i) => (
                <BarisBooking
                  key={
                    (typeof b.confirmationNo === "string" &&
                      b.confirmationNo) ||
                    `baris-${i}`
                  }
                  b={b}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!jawaban && (
        <div className="rounded-[20px] border border-line-soft bg-surface px-4 py-[22px] text-[13px] text-slate-soft">
          Membaca sistem lama…
        </div>
      )}
    </div>
  );
}
