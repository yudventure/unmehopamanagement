"use client";

import { useEffect, useMemo, useState } from "react";

import { sejak, useSistemLama } from "@/components/sistem-lama-data";
import { Pill } from "@/components/ui/pill";
import type { PillColors } from "@/lib/pills";
import {
  type BookingLama,
  type PapanPantau,
  JENDELA_HARI,
  PERMINTAAN,
  diminta,
  jumlahTamu,
  namaTamu,
  papanPantau,
  statusLama,
  teksLadang,
  tanggalTampil,
} from "@/lib/sistem-lama-bentuk";

/**
 * Catatan sistem lama, dipantau dari sini.
 *
 * Semuanya lewat satu GET dan hilang begitu halamannya ditutup. Tidak ada yang
 * disalin ke database kami, tidak ada yang ditulis balik, dan tidak ada tombol
 * di layar ini yang bisa — endpoint di belakangnya tidak punya bentuk untuk
 * menulis. Itu ditulis di layarnya juga, bukan cuma di komentar ini, karena
 * yang membacanya sedang diminta percaya bahwa sistem client aman selama ia
 * mengutak-atik layar ini.
 */

const MINT: PillColors = { bg: "#DCEFE3", fg: "#216B4B" };
const SAND: PillColors = { bg: "#F7EEDD", fg: "#8A6524" };
const STONE: PillColors = { bg: "#F2EBE0", fg: "#6B6357" };

function Kosong() {
  return <span className="text-slate-mute">—</span>;
}

const WARNA_STATUS: Record<string, PillColors> = {
  /* Datang hari ini: yang perlu disiapkan sekarang. */
  arrival: MINT,
  checkout: SAND,
  upcoming: STONE,
  lain: STONE,
};

function Status({ b }: { b: BookingLama }) {
  const st = statusLama(b);
  if (!st) return <Kosong />;
  return <Pill colors={WARNA_STATUS[st.nada] ?? STONE}>{st.label}</Pill>;
}

function Nama({ b }: { b: BookingLama }) {
  const nama = namaTamu(b);
  const orang = jumlahTamu(b);
  return (
    <div className="min-w-0">
      <div className="truncate text-[13.5px] font-semibold">
        {nama || <Kosong />}
      </div>
      <div className="truncate font-mono text-[11px] text-slate-mute">
        {teksLadang(b.confirmationNo) ?? "tanpa nomor"}
        {orang ? ` · ${orang} orang` : ""}
      </div>
    </div>
  );
}

function Kamar({ b }: { b: BookingLama }) {
  const kamar = teksLadang(b.room);
  return kamar ? (
    <span className="text-[12.5px] text-slate-soft">Room {kamar}</span>
  ) : (
    <Kosong />
  );
}

// ------------------------------------------------------------- papan pantau

function Angka({
  nilai,
  label,
  catatan,
}: {
  nilai: number | string;
  label: string;
  catatan?: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-line-soft bg-surface px-4 py-[13px]">
      <div className="text-[22px] leading-[1.1] font-bold">{nilai}</div>
      <div className="mt-[3px] text-[12px] text-slate-soft">{label}</div>
      {catatan && (
        <div className="mt-[2px] text-[11px] text-slate-mute">{catatan}</div>
      )}
    </div>
  );
}

function DaftarRingkas({
  judul,
  kosong,
  items,
}: {
  judul: string;
  kosong: string;
  items: { b: BookingLama; kanan?: React.ReactNode }[];
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line-soft bg-surface">
      <div className="flex items-center gap-2 border-b border-line-fine px-4 py-[11px]">
        <div className="text-[13px] font-bold">{judul}</div>
        <div className="ml-auto font-mono text-[11px] text-slate-mute">
          {items.length}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-[15px] text-[12.5px] text-slate-soft">
          {kosong}
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map(({ b, kanan }, i) => (
            <div
              key={teksLadang(b.confirmationNo) ?? `r-${i}`}
              className="flex items-center gap-3 border-b border-line-fine px-4 py-[11px] last:border-b-0"
            >
              <Nama b={b} />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <Kamar b={b} />
                {kanan}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Papan({ papan }: { papan: PapanPantau }) {
  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Angka nilai={papan.datangHariIni.length} label="Datang hari ini" />
        <Angka nilai={papan.pulangHariIni.length} label="Pulang hari ini" />
        <Angka
          nilai={papan.sedangMenginap.length}
          label="Sedang menginap"
          catatan={
            papan.tamuDiTempat === null
              ? "jumlah orang belum dicatat"
              : `${papan.tamuDiTempat} orang`
          }
        />
        <Angka
          nilai={papan.datangNanti.length}
          label={`Datang ${JENDELA_HARI} hari ke depan`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DaftarRingkas
          judul="Datang hari ini"
          kosong="Tidak ada kedatangan hari ini."
          items={papan.datangHariIni.map((b) => ({ b }))}
        />
        <DaftarRingkas
          judul="Pulang hari ini"
          kosong="Tidak ada kepulangan hari ini."
          items={papan.pulangHariIni.map((b) => ({ b }))}
        />
      </div>

      <DaftarRingkas
        judul={`Menyusul, ${JENDELA_HARI} hari ke depan`}
        kosong={`Belum ada kedatangan dalam ${JENDELA_HARI} hari ke depan.`}
        items={papan.datangNanti.map(({ booking, hari }) => ({
          b: booking,
          kanan: (
            <Pill colors={STONE}>
              {hari === 1 ? "besok" : `${hari} hari lagi`}
            </Pill>
          ),
        }))}
      />

      {papan.tanpaTanggal.length > 0 && (
        <div className="rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px] text-[12.5px] leading-[1.55] text-amber-ink">
          <strong>
            {papan.tanpaTanggal.length} booking tidak masuk hitungan di atas
          </strong>{" "}
          karena tanggalnya tidak berbentuk YYYY-MM-DD, jadi tidak bisa
          dipastikan jatuh di hari yang mana. Sengaja tidak ditebak:
          &ldquo;02/10&rdquo; bisa 2 Oktober dan bisa 10 Februari, dan
          menebaknya berarti menjemput orang di hari yang salah. Semuanya tetap
          ada di daftar di bawah, tanggalnya ditampilkan apa adanya.
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- layar

export function SistemLamaScreen() {
  const { jawaban, waktu, sibuk, muat } = useSistemLama();
  const [cari, setCari] = useState("");

  /* Jamnya sendiri, supaya "baru saja" berubah jadi "2 menit lalu" tanpa
     menunggu data berikutnya datang. Tanpa ini, layar yang gagal menarik
     ulang akan terus menulis "baru saja" selamanya — kalimat yang paling
     menyesatkan justru waktu ia berhenti benar. */
  const [sekarang, setSekarang] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const bookings = useMemo(() => jawaban?.bookings ?? [], [jawaban]);
  const papan = useMemo(() => papanPantau(bookings), [bookings]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      [
        namaTamu(b),
        teksLadang(b.confirmationNo) ?? "",
        teksLadang(b.room) ?? "",
        teksLadang(b.whatsapp) ?? "",
      ].some((f) => f.toLowerCase().includes(q)),
    );
  }, [bookings, cari]);

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Sistem lama</div>
      <div className="mb-4 max-w-[760px] text-[13.5px] leading-[1.55] text-slate-soft">
        Bookingan yang sudah masuk di sistem staf Turtle yang sekarang, dibaca
        langsung dari sana dan disegarkan sendiri — booking yang masuk di sana
        muncul di sini tanpa perlu menekan apa pun. Bacaan saja:{" "}
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
          onClick={() => void muat(true)}
          disabled={sibuk}
          className="h-[38px] rounded-[10px] border border-line-input bg-surface px-4 text-[13px] font-medium hover:bg-surface-hover disabled:opacity-50"
        >
          {sibuk ? "Membaca…" : "Baca ulang"}
        </button>
        {jawaban?.ok && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-[6px] text-[12px] text-slate-soft">
              <span className="h-[7px] w-[7px] rounded-full bg-teal" />
              Menyegarkan sendiri tiap menit — terakhir dibaca{" "}
              {sejak(waktu, sekarang)}
            </div>
            <div className="font-mono text-[11px] text-slate-mute">
              adminList · {jawaban.ms ?? 0} ms
            </div>
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
        <>
          <Papan papan={papan} />

          <div className="overflow-hidden rounded-[20px] border border-line-soft bg-surface">
            <div className="flex flex-wrap items-center gap-3 border-b border-line-fine px-4 py-[13px]">
              <div className="text-[13.5px] font-bold">
                {tersaring.length === bookings.length
                  ? `Semua ${bookings.length} booking`
                  : `${tersaring.length} dari ${bookings.length} booking`}
              </div>
              {papan.jumlahDibatalkan > 0 && (
                <div className="text-[12px] text-slate-mute">
                  {papan.jumlahDibatalkan} dibatalkan, tidak ikut dihitung di
                  papan
                </div>
              )}
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
                {tersaring.map((b, i) => {
                  const minta = PERMINTAAN.filter((p) => diminta(b[p.key]));
                  return (
                    <div
                      key={teksLadang(b.confirmationNo) ?? `baris-${i}`}
                      className="grid grid-cols-1 gap-x-4 gap-y-[6px] border-b border-line-fine px-4 py-[13px] last:border-b-0 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.9fr)]"
                    >
                      <Nama b={b} />
                      <div className="min-w-0 text-[12.5px] text-slate-soft">
                        {tanggalTampil(b.checkIn) || <Kosong />}
                        <span className="text-slate-mute"> → </span>
                        {tanggalTampil(b.checkOut) || <Kosong />}
                      </div>
                      <div className="min-w-0 truncate">
                        <Kamar b={b} />
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
                })}
              </div>
            )}
          </div>
        </>
      )}

      {!jawaban && (
        <div className="rounded-[20px] border border-line-soft bg-surface px-4 py-[22px] text-[13px] text-slate-soft">
          Membaca sistem lama…
        </div>
      )}
    </div>
  );
}
