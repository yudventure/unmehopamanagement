"use client";

import { useState } from "react";

import { PROPERTIES } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import type { Room, Sambungan } from "@/lib/types";

/**
 * Nama yang disarankan saat mengetik, bukan daftar yang membatasi. Situs apa
 * pun yang bisa memberi tautan iCal boleh disambungkan, termasuk agen
 * perjalanan lokal; nama yang diketik dipakai apa adanya.
 */
const SARAN = [
  "Booking.com", "Airbnb", "Agoda", "Expedia", "Tiket.com", "Traveloka", "Trip.com",
  "Hotels.com", "Google Calendar", "Agen perjalanan",
];

export interface SyncScreenProps {
  rooms: Room[];
  sambungan: Sambungan[];
  /** Base tautan ekspor, misalnya https://unmehopamanagement.com. */
  origin: string;
  onAdd: (roomId: string, nama: string, url: string) => Promise<string | null>;
  onRemove: (id: string) => void;
  onUbahUrl: (id: string, url: string) => Promise<string | null>;
  onTokenBaru: (id: string) => void;
  /** Membagikan bacaan satu sambungan ke kamar lain dalam tipe yang sama. Kembali berisi pesan galat, atau null. */
  onKamarLain: (id: string, kamar: string[]) => Promise<string | null>;
  /** Dipanggil sesudah impor daftar pesanan disimpan atau dihapus: memuat ulang buku. */
  onImporBerubah: (pesan: string) => Promise<void>;
  onJalankan: () => void;
  sedangJalan: boolean;
  /** Kamar Turtle dibaca dari sistem lama, yang belum ikut ke tautan ekspor. */
  turtleDariLama: boolean;
}

const KOTAK_ISIAN =
  "rounded-[9px] border border-line-input bg-surface px-[11px] py-[7px] text-[12.5px] outline-none focus:border-teal";
const TOMBOL_KECIL =
  "cursor-pointer rounded-[9px] border border-line-strong bg-surface px-[13px] py-[7px] text-[12.5px] font-medium hover:bg-surface-hover";

function Status({ s }: { s: Sambungan }) {
  if (!s.url)
    return <span className="rounded-full bg-surface-tint px-2 py-[2px] text-[11px] text-slate">Hanya mengirim</span>;
  if (s.galat)
    return <span className="rounded-full bg-danger-soft px-2 py-[2px] text-[11px] text-danger-ink">Gagal dibaca</span>;
  if (!s.berhasil)
    return <span className="rounded-full bg-amber-soft px-2 py-[2px] text-[11px] text-amber-ink">Belum dibaca</span>;
  return <span className="rounded-full bg-teal-soft px-2 py-[2px] text-[11px] text-teal-deep">Tersambung</span>;
}

/**
 * Satu tipe kamar dengan beberapa unit di situs itu, lewat satu tautan: bacaan
 * dibagikan ke kamar yang kosong, bukan ditumpuk di satu kamar sampai terbaca
 * sebagai bentrok.
 */
function BagiKamar({ s, kamarSatuUnit, onSimpan }: { s: Sambungan; kamarSatuUnit: Room[]; onSimpan: (ids: string[]) => Promise<string | null> }) {
  const [ubah, setUbah] = useState(false);
  const [pilih, setPilih] = useState<string[]>(s.kamarLain ?? []);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const nama = (id: string) => kamarSatuUnit.find((r) => r.id === id)?.name ?? id;
  const aktif = s.kamarLain ?? [];
  if (!kamarSatuUnit.length) return null;
  return (
    <div className="rounded-[10px] bg-surface-mute px-[11px] py-[9px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold">Satu tipe kamar, beberapa unit</span>
        {aktif.length > 0 && !ubah && (
          <span className="text-[12px] text-slate">dibagikan ke {aktif.map(nama).join(", ")}</span>
        )}
        {!ubah && (
          <button type="button" onClick={() => { setPilih(aktif); setUbah(true); }} className={`${TOMBOL_KECIL} ml-auto`}>
            {aktif.length ? "Ubah" : "Bagikan ke kamar lain"}
          </button>
        )}
      </div>
      {ubah && (
        <div className="mt-2">
          <p className="text-[12px] leading-[1.5] text-slate">
            Pilih bila tautan ini dari tipe kamar yang punya (atau dulu punya) beberapa unit. Tiap booking yang terbaca ditempatkan di kamar pertama yang kosong: kamar ini dulu, lalu kamar yang dicentang. Bentrok hanya muncul bila semua kamar itu penuh.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {kamarSatuUnit.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 text-[12.5px]">
                <input type="checkbox" checked={pilih.includes(r.id)} onChange={(e) => setPilih((p) => (e.target.checked ? [...p, r.id] : p.filter((x) => x !== r.id)))} />
                {r.name}
              </label>
            ))}
          </div>
          {galat && <div className="mt-1 text-[12px] text-danger-ink">{galat}</div>}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={sibuk}
              onClick={async () => {
                setSibuk(true);
                const g = await onSimpan(pilih);
                setSibuk(false);
                setGalat(g ?? "");
                if (!g) setUbah(false);
              }}
              className="cursor-pointer rounded-[9px] border-none bg-teal px-[15px] py-[8px] text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              {sibuk ? "Menyimpan…" : "Simpan"}
            </button>
            <button type="button" onClick={() => setUbah(false)} className={TOMBOL_KECIL}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Pratinjau {
  tipeUnit: { nama: string; jumlah: number }[];
  dipilih: string;
  jumlah: number;
  berlaku: number;
  batal: number;
  kamar: number;
  multiKamar: number;
  dariTanggal: string | null;
  sampaiTanggal: string | null;
  nilai: number;
  komisi: number;
  acaraIcal: number;
  acaraDigantikan: number;
}

const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

/**
 * Impor daftar pesanan dari ekspor situs itu (Booking.com: Extranet, Pemesanan,
 * unduh .xls). Melengkapi iCal dengan nama tamu, harga, dan jumlah kamar.
 * Pratinjau dulu, simpan sesudah orangnya melihat angkanya.
 */
function ImporPesanan({ s, onBerubah }: { s: Sambungan; onBerubah: (pesan: string) => Promise<void> }) {
  const [buka, setBuka] = useState(false);
  const [berkas, setBerkas] = useState<{ nama: string; isi: string } | null>(null);
  const [tipe, setTipe] = useState("");
  const [p, setP] = useState<Pratinjau | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const kirim = async (isi: string, tipeUnit: string, simpan: boolean) => {
    setSibuk(true);
    setGalat("");
    try {
      const r = await fetch("/api/sinkron/impor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, berkas: isi, tipeUnit, simpan }) });
      const o = (await r.json().catch(() => ({}))) as { pratinjau?: Pratinjau; galat?: string; tersimpan?: number };
      if (!r.ok) {
        setGalat(o.galat ?? `Server menjawab ${r.status}.`);
        return;
      }
      if (o.pratinjau) {
        setP(o.pratinjau);
        if (o.pratinjau.dipilih) setTipe(o.pratinjau.dipilih);
      }
      if (simpan) {
        setBerkas(null);
        setP(null);
        setBuka(false);
        await onBerubah(`${o.tersimpan ?? 0} pesanan ${s.nama} tersimpan dari impor.`);
      }
    } catch {
      setGalat("Tidak bisa menghubungi server.");
    } finally {
      setSibuk(false);
    }
  };

  const pilihBerkas = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) return setGalat("Berkas terlalu besar. Maksimal 6 MB.");
    const r = new FileReader();
    r.onload = () => {
      const isi = String(r.result ?? "");
      setBerkas({ nama: f.name, isi });
      setTipe("");
      setP(null);
      void kirim(isi, "", false);
    };
    r.readAsDataURL(f);
  };

  const hapus = async () => {
    if (!window.confirm(`Hapus impor pesanan ${s.nama}? Nama tamu, harga, dan jumlah kamar dari impor hilang; kalender kembali memakai iCal saja.`)) return;
    setSibuk(true);
    const r = await fetch("/api/sinkron/impor", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) }).catch(() => null);
    setSibuk(false);
    if (r?.ok) await onBerubah("Impor dihapus.");
    else setGalat("Tidak bisa menghapus impor.");
  };

  return (
    <div className="rounded-[10px] bg-surface-mute px-[11px] py-[9px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold">Impor daftar pesanan</span>
        {s.impor ? (
          <span className="text-[12px] text-slate">
            {s.impor.berlaku} pesanan berlaku dari {s.impor.jumlah} ({s.impor.tipeUnit}), diimpor {fmtDateTime(new Date(s.impor.pada))} oleh {s.impor.oleh}
          </span>
        ) : (
          <span className="text-[12px] text-slate-mute">nama tamu, harga, dan jumlah kamar yang tidak dibawa iCal</span>
        )}
        {!buka && (
          <button type="button" onClick={() => setBuka(true)} className={`${TOMBOL_KECIL} ml-auto`}>
            {s.impor ? "Impor ulang" : "Impor berkas"}
          </button>
        )}
        {s.impor && !buka && (
          <button type="button" disabled={sibuk} onClick={() => void hapus()} className="cursor-pointer rounded-[8px] border-none bg-transparent px-2 py-1 text-[12px] text-danger hover:bg-danger-tint">
            Hapus impor
          </button>
        )}
      </div>
      {buka && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-[12px] leading-[1.5] text-slate">
            Di Extranet Booking.com: Pemesanan, pilih rentang tanggal (sertakan yang akan datang), lalu Unduh. Pilih berkas .xls atau .csv itu di sini. Pesanan yang tanggalnya sama dengan acara iCal menggantikannya; pesanan banyak kamar memakai kamar sebanyak itu. Impor ulang memperbarui menurut nomor pemesanan.
          </p>
          <input type="file" accept=".xls,.csv,application/vnd.ms-excel,text/csv" aria-label={`Berkas pesanan ${s.nama}`} onChange={(e) => pilihBerkas(e.target.files?.[0])} className="text-[12.5px]" />
          {sibuk && <p className="text-[12px] text-slate">Membaca…</p>}
          {galat && <p role="alert" className="text-[12px] text-danger-ink">{galat}</p>}
          {p && berkas && (
            <div className="rounded-[10px] border border-line bg-surface px-3 py-2 text-[12.5px] leading-[1.6]">
              {p.tipeUnit.length > 1 && (
                <label className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Tipe unit untuk sambungan ini</span>
                  <select value={tipe} onChange={(e) => { setTipe(e.target.value); void kirim(berkas.isi, e.target.value, false); }} className={KOTAK_ISIAN}>
                    <option value="">Pilih…</option>
                    {p.tipeUnit.map((t) => <option key={t.nama} value={t.nama}>{t.nama} ({t.jumlah})</option>)}
                  </select>
                </label>
              )}
              {p.dipilih ? (
                <>
                  <div><strong>{p.berlaku}</strong> pesanan berlaku ({p.kamar} kamar), {p.batal} batal; {p.dariTanggal} sampai {p.sampaiTanggal}.</div>
                  {p.multiKamar > 0 && <div>{p.multiKamar} pesanan memesan lebih dari satu kamar: kini memblokir kamar sebanyak itu.</div>}
                  <div>Menggantikan {p.acaraDigantikan} dari {p.acaraIcal} acara iCal sambungan ini (tanggal sama persis). Acara lain tetap terbaca.</div>
                  <div>Nilai pesanan berlaku {rp(p.nilai)}, komisi {rp(p.komisi)}.</div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" disabled={sibuk} onClick={() => void kirim(berkas.isi, p.dipilih, true)} className="cursor-pointer rounded-[9px] border-none bg-teal px-[15px] py-[8px] text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50">
                      Simpan impor
                    </button>
                    <button type="button" onClick={() => { setBuka(false); setBerkas(null); setP(null); }} className={TOMBOL_KECIL}>Batal</button>
                  </div>
                </>
              ) : (
                <div className="text-slate">Berkas ini memuat beberapa tipe unit. Pilih yang sesuai dengan sambungan ini.</div>
              )}
            </div>
          )}
          {!p && (
            <div>
              <button type="button" onClick={() => { setBuka(false); setBerkas(null); setGalat(""); }} className={TOMBOL_KECIL}>Batal</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BarisSambungan({
  s, origin, onRemove, onUbahUrl, onTokenBaru, kamarSatuUnit, onKamarLain, onImporBerubah,
}: {
  s: Sambungan;
  origin: string;
  onRemove: () => void;
  onUbahUrl: (url: string) => Promise<string | null>;
  onTokenBaru: () => void;
  kamarSatuUnit: Room[];
  onKamarLain: (ids: string[]) => Promise<string | null>;
  onImporBerubah: (pesan: string) => Promise<void>;
}) {
  const [salin, setSalin] = useState(false);
  const [ubah, setUbah] = useState(false);
  const [url, setUrl] = useState(s.url);
  const [galat, setGalat] = useState("");
  const tautan = `${origin}/api/ical/${s.token}.ics`;

  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface px-[13px] py-[11px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13.5px] font-bold">{s.nama}</span>
        <Status s={s} />
        {s.berhasil && (
          <span className="text-[12px] text-slate-mute">
            {s.jumlah ?? 0} malam terbaca, {fmtDateTime(new Date(s.berhasil))}
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto cursor-pointer rounded-[8px] border-none bg-transparent px-2 py-1 text-[12px] text-danger hover:bg-danger-tint"
        >
          Hapus
        </button>
      </div>
      {s.galat && <div className="text-[12px] text-danger-ink">{s.galat}</div>}

      <div>
        <div className="mb-1 text-[11px] text-slate-mute">Dibaca dari situs itu</div>
        {ubah || !s.url ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… tautan iCal dari situs itu"
              aria-label={`Tautan iCal ${s.nama}`}
              className={`${KOTAK_ISIAN} min-w-[220px] flex-1 font-mono text-[11.5px]`}
            />
            <button
              type="button"
              onClick={async () => {
                const g = await onUbahUrl(url.trim());
                setGalat(g ?? "");
                if (!g) setUbah(false);
              }}
              className="cursor-pointer rounded-[9px] border-none bg-teal px-[15px] py-[8px] text-[12.5px] font-bold text-white hover:bg-teal-deep"
            >
              Simpan dan baca
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 overflow-hidden rounded-[9px] border border-line-input bg-surface-mute px-[11px] py-[7px] font-mono text-[11.5px] text-ellipsis whitespace-nowrap text-slate">
              {s.url}
            </code>
            <button type="button" onClick={() => setUbah(true)} className={TOMBOL_KECIL}>
              Ganti
            </button>
          </div>
        )}
        {galat && <div className="mt-1 text-[12px] text-danger-ink">{galat}</div>}
      </div>

      {s.url && <BagiKamar s={s} kamarSatuUnit={kamarSatuUnit} onSimpan={onKamarLain} />}
      <ImporPesanan s={s} onBerubah={onImporBerubah} />

      <div>
        <div className="mb-1 text-[11px] text-slate-mute">Tempel ke situs itu supaya malam terjual terblokir di sana</div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 overflow-hidden rounded-[9px] border border-line-input bg-surface-mute px-[11px] py-[7px] font-mono text-[11.5px] text-ellipsis whitespace-nowrap text-slate">
            {tautan}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(tautan);
              setSalin(true);
              setTimeout(() => setSalin(false), 1600);
            }}
            className={TOMBOL_KECIL}
          >
            {salin ? "Tersalin" : "Salin"}
          </button>
          <button
            type="button"
            onClick={onTokenBaru}
            title="Buat tautan baru. Tautan lama langsung tidak berlaku."
            className={`${TOMBOL_KECIL} text-slate`}
          >
            Buat tautan baru
          </button>
        </div>
      </div>
    </div>
  );
}

function TambahSambungan({ room, onAdd }: { room: Room; onAdd: SyncScreenProps["onAdd"] }) {
  const [nama, setNama] = useState("");
  const [url, setUrl] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const kirim = async () => {
    if (sibuk) return;
    setSibuk(true);
    const g = await onAdd(room.id, nama.trim(), url.trim());
    setSibuk(false);
    if (g) return setGalat(g);
    setNama("");
    setUrl("");
    setGalat("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={nama}
          onChange={(e) => { setNama(e.target.value); setGalat(""); }}
          list="saran-situs"
          placeholder="Nama situs atau agen"
          aria-label={`Nama situs untuk ${room.name}`}
          className={`${KOTAK_ISIAN} w-[190px]`}
        />
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setGalat(""); }}
          onKeyDown={(e) => e.key === "Enter" && void kirim()}
          placeholder="https://… tautan iCal (boleh kosong bila situs itu hanya membaca)"
          aria-label={`Tautan iCal untuk ${room.name}`}
          className={`${KOTAK_ISIAN} min-w-[220px] flex-1 font-mono text-[11.5px]`}
        />
        <button
          type="button"
          onClick={() => void kirim()}
          disabled={sibuk}
          className="cursor-pointer rounded-[9px] border-none bg-teal px-[15px] py-[8px] text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:cursor-wait disabled:opacity-70"
        >
          {sibuk ? "Menyambung…" : "Sambungkan"}
        </button>
      </div>
      {galat && <div className="mt-1 text-[12px] text-danger-ink">{galat}</div>}
    </div>
  );
}

/**
 * Satu kamar, dilipat menjadi satu baris sampai ada alasan membukanya. Lima
 * belas formulir terbuka sekaligus berarti menggulir ribuan piksel untuk
 * sampai ke kamar yang dicari; barisnya membawa keadaannya, dan formulirnya
 * di belakang.
 */
function BarisKamar({
  room, daftar, origin, onAdd, onRemove, onUbahUrl, onTokenBaru, kamarSatuUnit, onKamarLain, menerima, onImporBerubah,
}: {
  room: Room;
  daftar: Sambungan[];
  kamarSatuUnit: Room[];
  onKamarLain: SyncScreenProps["onKamarLain"];
  onImporBerubah: SyncScreenProps["onImporBerubah"];
  /** Sambungan kamar lain yang membagikan bacaannya ke kamar ini, sebagai kalimat pendek. */
  menerima: string[];
  origin: string;
  onAdd: SyncScreenProps["onAdd"];
  onRemove: (id: string) => void;
  onUbahUrl: SyncScreenProps["onUbahUrl"];
  onTokenBaru: (id: string) => void;
}) {
  const [buka, setBuka] = useState(false);
  const gagal = daftar.filter((s) => s.galat).length;
  return (
    <div className="mt-[6px] first:mt-0">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-[10px] gap-y-1 rounded-[12px] border-none bg-transparent px-4 py-[12px] text-left hover:bg-surface-hover"
      >
        <span className="text-[14px] font-bold">{room.name}</span>
        {!room.active && (
          <span className="rounded-full bg-amber-soft px-[8px] py-[2px] text-[11px] text-amber-ink">Nonaktif</span>
        )}
        <span className={`ml-auto text-[12.5px] ${daftar.length ? "text-ink-soft" : "text-slate-mute"}`}>
          {daftar.length ? `${daftar.length} situs tersambung` : menerima.length ? "" : "belum tersambung"}
          {menerima.length ? `${daftar.length ? "; " : ""}menerima bacaan ${menerima.join(", ")}` : ""}
          {gagal ? `, ${gagal} gagal dibaca` : ""}
        </span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 text-slate ${buka ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Disembunyikan, bukan dilepas: kolom di dalamnya memegang tautan yang
          ditempel dari extranet di tab lain, dan melepasnya membuangnya. */}
      <div hidden={!buka} className="flex flex-col gap-3 px-4 pt-1 pb-4">
        {daftar.map((s) => (
          <BarisSambungan
            key={s.id}
            s={s}
            origin={origin}
            onRemove={() => onRemove(s.id)}
            onUbahUrl={(u) => onUbahUrl(s.id, u)}
            onTokenBaru={() => onTokenBaru(s.id)}
            kamarSatuUnit={kamarSatuUnit}
            onKamarLain={(ids) => onKamarLain(s.id, ids)}
            onImporBerubah={onImporBerubah}
          />
        ))}
        <TambahSambungan room={room} onAdd={onAdd} />
      </div>
    </div>
  );
}

/**
 * Pengelola sinkronisasi kalender ke situs mana pun, lewat iCal. Tiap
 * sambungan terikat ke satu kamar dan satu situs luar, dan punya dua arah:
 * server membaca tautan dari situs itu (malam terisi di sana ikut tampil di
 * kalender dan ikut memeriksa bentrok), dan situs itu membaca tautan ekspor
 * kita (malam terisi di sini terblokir di sana). Situs yang hanya membaca,
 * seperti banyak agen, cukup tanpa tautan impor.
 */
export function SyncScreen({
  rooms, sambungan, origin, onAdd, onRemove, onUbahUrl, onTokenBaru, onKamarLain, onImporBerubah, onJalankan, sedangJalan, turtleDariLama,
}: SyncScreenProps) {
  const props = PROPERTIES.filter((p) => rooms.some((r) => r.prop === p.key));
  const terakhir = sambungan.map((s) => s.berhasil).filter(Boolean).sort().pop();

  return (
    <div>
      <datalist id="saran-situs">
        {SARAN.map((n) => <option key={n} value={n} />)}
      </datalist>

      <div className="mb-1 flex flex-wrap items-end gap-3">
        <div className="text-[22px] font-bold">Sinkronisasi kalender</div>
        <button
          type="button"
          onClick={onJalankan}
          disabled={sedangJalan || sambungan.length === 0}
          className="ml-auto cursor-pointer rounded-[10px] border-none bg-teal px-[16px] py-[9px] text-[13px] font-bold text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sedangJalan ? "Membaca…" : "Sinkronkan sekarang"}
        </button>
      </div>
      <div className="mb-4 max-w-[780px] text-[13.5px] leading-[1.55] text-slate-soft">
        Sambungkan kamar ke situs pemesanan atau agen perjalanan mana pun yang
        memberi tautan iCal, tanpa daftar yang membatasi. <strong>Dibaca</strong>{" "}
        berarti malam yang terjual di sana muncul di kalender ini dan ikut
        diperiksa bentroknya. <strong>Dikirim</strong> berarti situs itu
        membaca tautan ekspor kita, supaya malam yang terjual di sini terblokir
        di sana. Server membaca ulang tiap 15 menit
        {terakhir ? `, bacaan terakhir ${fmtDateTime(new Date(terakhir))}` : ""}.
      </div>

      <div className="mb-6 grid gap-2 rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px] text-[13px] leading-[1.55] text-amber-ink">
        <div><strong>Yang perlu diketahui.</strong> iCal hanya membawa terisi atau kosong. Harga, nama tamu, dan jumlah tamu tidak ikut.</div>
        <div>Situs yang membaca tautan kita punya jeda, dari belasan menit sampai beberapa jam, jadi pesanan ganda masih mungkin. Bentrok yang terlihat di kalender ini harus diselesaikan manual.</div>
        <div>Tidak semua situs memakai iCal. Setahu kami Traveloka dan Tiket.com tidak, dan Booking.com hanya untuk tipe kamar berisi satu unit. Periksa lagi di extranet masing-masing sebelum memasang.</div>
        {turtleDariLama && (
          <div><strong>Kamar Turtle.</strong> Pesanannya dibaca dari sistem lama dan <strong>belum ikut</strong> ke tautan ekspor. Hanya pesanan yang dicatat di dashboard ini yang terkirim. Jangan memasang tautan ekspor Turtle di situs lain sebelum itu diselesaikan.</div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {props.map((p) => (
          <div key={p.key} className="overflow-hidden rounded-[20px] border border-line-soft bg-surface">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="text-[16px] font-bold">{p.name}</div>
              <div className="text-[12.5px] text-slate-soft">{p.location}</div>
              <div className="ml-auto font-mono text-[11.5px] text-slate-mute">
                {sambungan.filter((s) => rooms.some((r) => r.id === s.roomId && r.prop === p.key)).length} sambungan
              </div>
            </div>
            <div className="flex flex-col px-2 pb-2">
              {rooms.filter((r) => r.prop === p.key).map((room) => (
                <BarisKamar
                  key={room.id}
                  room={room}
                  daftar={sambungan.filter((s) => s.roomId === room.id)}
                  origin={origin}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  onUbahUrl={onUbahUrl}
                  onTokenBaru={onTokenBaru}
                  kamarSatuUnit={rooms.filter((r) => r.prop === room.prop && r.id !== room.id)}
                  onKamarLain={onKamarLain}
                  onImporBerubah={onImporBerubah}
                  menerima={sambungan
                    .filter((s) => s.kamarLain?.includes(room.id))
                    .map((s) => `${s.nama} dari ${rooms.find((r) => r.id === s.roomId)?.name ?? "kamar lain"}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
