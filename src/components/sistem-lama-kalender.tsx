"use client";

import { useMemo, useState } from "react";

import { MONTHS, iso, parse } from "@/lib/format";
import {
  type BookingLama,
  kalenderLama,
  namaTamu,
  statusLama,
} from "@/lib/sistem-lama-bentuk";

/**
 * Kalender kamar × malam, isinya seluruhnya dari sistem lama.
 *
 * Kamar jadi baris dan malam jadi kolom, bukan kisi tanggal seperti kalender
 * utama. Itu bentuk yang menjawab pertanyaan yang sebenarnya ditanyakan ke
 * kalender homestay — "kamar mana yang kosong tanggal segini" — dalam satu
 * pandangan, tanpa membuka hari satu per satu.
 *
 * Tidak ada angka uang dan tidak ada persentase okupansi di sini, dan itu
 * batas yang disengaja: daftar kamarnya diturunkan dari kamar yang muncul di
 * booking, bukan dari daftar kamar sungguhan, jadi persentase apa pun akan
 * mengarang penyebutnya. Alasan lengkapnya ada di `kalenderLama`.
 */

/* Warna batang mengikuti status yang sama dengan chip di daftar, supaya satu
   booking tidak berganti arti waktu pindah pandangan. */
const NADA: Record<string, { bg: string; fg: string; garis: string }> = {
  arrival: { bg: "#DCEFE3", fg: "#1B5B3F", garis: "#8FCBAE" },
  checkout: { bg: "#F7EEDD", fg: "#7A5A1F", garis: "#DFC189" },
  upcoming: { bg: "#EDEFF3", fg: "#4A5261", garis: "#C3CAD6" },
  lain: { bg: "#F2EBE0", fg: "#6B6357", garis: "#D6CBB8" },
};

function Batang({
  nama,
  nada,
  kiri,
  kanan,
  judul,
}: {
  nama: string;
  nada: string;
  kiri: boolean;
  kanan: boolean;
  judul: string;
}) {
  const w = NADA[nada] ?? NADA.lain;
  return (
    <div
      title={judul}
      className="flex h-[26px] min-w-0 items-center overflow-hidden px-[7px] text-[11.5px] font-medium"
      style={{
        background: w.bg,
        color: w.fg,
        border: `1px solid ${w.garis}`,
        /* Ujung yang terpotong dibuat siku, supaya kelihatan menginapnya
           menembus batas bulan dan bukan mulai atau berakhir di situ. */
        borderTopLeftRadius: kiri ? 0 : 7,
        borderBottomLeftRadius: kiri ? 0 : 7,
        borderTopRightRadius: kanan ? 0 : 7,
        borderBottomRightRadius: kanan ? 0 : 7,
        borderLeftWidth: kiri ? 0 : 1,
        borderRightWidth: kanan ? 0 : 1,
      }}
    >
      <span className="truncate">
        {kiri ? "‹ " : ""}
        {nama}
        {kanan ? " ›" : ""}
      </span>
    </div>
  );
}

export function SistemLamaKalender({ bookings }: { bookings: BookingLama[] }) {
  const [bulan, setBulan] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const kal = useMemo(
    () => kalenderLama(bookings, bulan.getFullYear(), bulan.getMonth()),
    [bookings, bulan],
  );

  const hariIni = iso(new Date());
  const kolom = kal.hari.length;

  const geser = (n: number) =>
    setBulan((b) => new Date(b.getFullYear(), b.getMonth() + n, 1));

  return (
    <div className="mb-5 overflow-hidden rounded-[20px] border border-line-soft bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-fine px-4 py-[13px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => geser(-1)}
            className="h-[30px] w-[30px] rounded-[9px] border border-line-input bg-surface text-[13px] hover:bg-surface-hover"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => geser(1)}
            className="h-[30px] w-[30px] rounded-[9px] border border-line-input bg-surface text-[13px] hover:bg-surface-hover"
          >
            ›
          </button>
        </div>
        <div className="text-[15px] font-bold">
          {MONTHS[bulan.getMonth()]} {bulan.getFullYear()}
        </div>
        <div className="text-[12px] text-slate-soft">
          {kal.baris.filter((b) => b.kamar !== null).length} kamar terpakai
        </div>
        <div className="ml-auto text-[11.5px] text-slate-mute">
          Kamar dan namanya dari sistem lama
        </div>
      </div>

      {kal.baris.length === 0 ? (
        <div className="px-4 py-[22px] text-[13px] text-slate-soft">
          Tidak ada booking di bulan ini.
        </div>
      ) : (
        /* Digulung mendatar di layar sempit: 30 kolom tidak muat di telepon,
           dan memampatkannya sampai muat membuat batangnya tidak terbaca. */
        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            <div
              className="grid border-b border-line-fine bg-surface-soft"
              style={{
                gridTemplateColumns: `116px repeat(${kolom}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-3 py-[7px] font-mono text-[10.5px] tracking-[.08em] text-slate-mute uppercase">
                Kamar
              </div>
              {kal.hari.map((h) => {
                const d = parse(h);
                const akhirPekan = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={h}
                    className={`py-[7px] text-center font-mono text-[10.5px] ${
                      h === hariIni
                        ? "font-bold text-teal"
                        : akhirPekan
                          ? "text-slate-mute"
                          : "text-slate-soft"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>

            {kal.baris.map((baris) => (
              <div
                key={baris.kamar ?? "tanpa-kamar"}
                className="grid items-center border-b border-line-fine last:border-b-0"
                style={{
                  gridTemplateColumns: `116px repeat(${kolom}, minmax(0, 1fr))`,
                }}
              >
                <div
                  className="flex h-[36px] items-center truncate px-3 text-[12.5px] font-medium"
                  style={{ gridRow: 1, gridColumn: 1 }}
                >
                  {baris.kamar ? (
                    `Room ${baris.kamar}`
                  ) : (
                    <span className="text-[11.5px] leading-[1.25] text-slate-mute">
                      Belum ada kamar
                    </span>
                  )}
                </div>

                {/* Sel kosong dulu, supaya garis harinya tetap tergambar di
                    hari yang tidak terisi. */}
                {kal.hari.map((h) => (
                  <div
                    key={h}
                    className={`h-[36px] border-l border-line-fine ${
                      h === hariIni ? "bg-surface-tint" : ""
                    }`}
                    style={{ gridRow: 1 }}
                  />
                ))}

                {baris.segmen.map((s, i) => {
                  const tamu = namaTamu(s.booking) || "tanpa nama";
                  const st = statusLama(s.booking);
                  const kolomMulai = kal.hari.indexOf(s.mulai);
                  if (kolomMulai < 0) return null;
                  return (
                    <div
                      key={`${s.mulai}-${i}`}
                      className="flex min-w-0 items-center px-[1px]"
                      style={{
                        gridRow: 1,
                        gridColumn: `${kolomMulai + 2} / span ${s.malam}`,
                      }}
                    >
                      <Batang
                        nama={tamu}
                        nada={st?.nada ?? "lain"}
                        kiri={s.terpotongKiri}
                        kanan={s.terpotongKanan}
                        judul={`${tamu} · ${s.malam} malam${
                          st ? ` · ${st.label}` : ""
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {kal.tanpaTanggal > 0 && (
        <div className="border-t border-line-fine bg-amber-soft/40 px-4 py-[11px] text-[12.5px] leading-[1.55] text-amber-ink">
          {kal.tanpaTanggal} booking tidak tergambar karena tanggalnya tidak
          berbentuk YYYY-MM-DD. Semuanya tetap ada di daftar di bawah.
        </div>
      )}
    </div>
  );
}
