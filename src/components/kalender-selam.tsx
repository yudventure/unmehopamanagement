"use client";

import { WARNA_AKTIVITAS } from "@/lib/dari-sistem-lama";
import { iso } from "@/lib/format";
import type { SesiLama } from "@/lib/sistem-lama-bentuk";

const HARI = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

/**
 * Kalender jadwal dive center, di bawah kalender kamar: bulan yang sama, satu
 * sel per hari, sesi diving, snorkeling, kursus, trip, dan transport dari
 * sistem lama dengan jumlah tamunya. Kegiatan, bukan menginap, jadi
 * dipisahkan dari kalender kamar supaya keduanya terbaca.
 */
export function KalenderSelam({
  bulan, sesiPerTanggal, today, selectedDate, onPilih, tersambung,
}: {
  bulan: Date;
  sesiPerTanggal: Map<string, SesiLama[]>;
  today: string;
  selectedDate: string | null;
  onPilih: (tanggal: string) => void;
  tersambung: boolean;
}) {
  const y = bulan.getFullYear();
  const m = bulan.getMonth();
  const awal = new Date(y, m, 1).getDay();
  const jumlah = new Date(y, m + 1, 0).getDate();
  const sel: (string | null)[] = [...Array(awal).fill(null), ...Array.from({ length: jumlah }, (_, i) => iso(new Date(y, m, i + 1)))];
  while (sel.length % 7) sel.push(null);
  const bulanIni = [...sesiPerTanggal.entries()].filter(([t]) => t.startsWith(iso(new Date(y, m, 1)).slice(0, 7))).flatMap(([, s]) => s);
  const pax = bulanIni.reduce((n, s) => n + (s.pax ?? 0), 0);

  return (
    <section className="mt-6 rounded-[20px] border border-line-soft bg-surface px-4 py-4" aria-label="Kalender jadwal dive center">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="text-[17px] font-bold">Jadwal dive center</h2>
        <span className="text-[12.5px] text-slate-soft">
          {tersambung ? `${bulanIni.length} sesi bulan ini${pax ? `, ${pax} tamu` : ""}` : "Belum tersambung ke jadwal sistem lama (Pengaturan, sakelar Jadwal dive center)."}
        </span>
        <span className="ml-auto flex flex-wrap gap-2">
          {Object.entries(WARNA_AKTIVITAS).map(([nama, w]) => (
            <span key={nama} className="flex items-center gap-1 text-[11px] text-slate-soft">
              <span className="h-2 w-2 rounded-[3px]" style={{ background: w.dot }} />
              {nama}
            </span>
          ))}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-[14px] border border-line-soft">
          {HARI.map((h) => (
            <div key={h} className="bg-surface-mute px-2 py-[6px] font-mono text-[10.5px] tracking-[.08em] text-slate-mute">{h}</div>
          ))}
          {sel.map((t, i) => {
            if (!t) return <div key={`k${i}`} className="min-h-[84px] border-t border-line-soft bg-surface-soft" />;
            const sesi = sesiPerTanggal.get(t) ?? [];
            const dipilih = t === selectedDate;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onPilih(t)}
                aria-label={`Jadwal dive center ${t}, ${sesi.length} sesi`}
                className={`flex min-h-[84px] cursor-pointer flex-col gap-1 border-t border-l-0 border-r-0 border-b-0 border-line-soft p-[6px] text-left hover:bg-surface-hover ${dipilih ? "bg-teal-tint outline outline-2 -outline-offset-2 outline-teal" : "bg-surface"}`}
              >
                <span className={`text-[12px] font-semibold ${t === today ? "flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white" : ""}`}>{Number(t.slice(8))}</span>
                {sesi.slice(0, 3).map((s, j) => {
                  const w = WARNA_AKTIVITAS[s.aktivitas];
                  return (
                    <span key={j} title={`${s.label}${s.pax ? ` · ${s.pax} tamu` : ""}${s.kamar.length ? ` · ${s.kamar.join(", ")}` : ""}`} className="flex items-center gap-1 truncate rounded-[6px] px-[5px] py-[1px] text-[10.5px] font-semibold" style={{ background: w.bg, color: w.fg }}>
                      <span className="min-w-0 flex-1 truncate">{s.label}</span>
                      {s.pax ? <span className="shrink-0">{s.pax}</span> : null}
                    </span>
                  );
                })}
                {sesi.length > 3 && <span className="text-[10.5px] text-slate-soft underline">+{sesi.length - 3} lagi</span>}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[11.5px] text-slate-mute">Pilih tanggal untuk melihat sesi lengkap, tamu yang menginap, dan catatan jemputannya di panel kanan.</p>
    </section>
  );
}
