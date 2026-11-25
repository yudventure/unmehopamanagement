"use client";

import { useCallback, useEffect, useState } from "react";

interface Keadaan {
  sistemLamaAktif: boolean;
  jadwalLamaAktif?: boolean;
  sistemLamaSiap: boolean;
  diubahOleh: string | null;
  diubahPada: string | null;
  bolehUbah: boolean;
}

/**
 * Sakelar sistem lama: menyala berarti dashboard membaca booking dan jadwal
 * Turtle dari sistem staf lama (Apps Script); mati berarti Turtle memakai data
 * dashboard sendiri dan sistem lama tidak dipanggil sama sekali.
 *
 * Yang bisa membaliknya: developer dan pemilik. General manager melihat saja. Yang lain
 * melihat keadaannya saja. Membalik memuat ulang halaman, supaya semua layar
 * membaca dari sumber yang baru, bukan dari salinan yang sudah di memori.
 */
export function SakelarSistemLama({ ringkas = false }: { ringkas?: boolean }) {
  const [k, setK] = useState<Keadaan | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  const muat = useCallback(async () => {
    try {
      const r = await fetch("/api/pengaturan", { cache: "no-store" });
      if (r.ok) setK(await r.json());
    } catch {
      /* Sakelar yang tidak termuat tidak boleh merusak layar di sekitarnya. */
    }
  }, []);
  useEffect(() => void muat(), [muat]);

  const balik = async (kunci: "sistemLamaAktif" | "jadwalLamaAktif" = "sistemLamaAktif") => {
    if (!k || sibuk) return;
    const baru = !(k[kunci] ?? true);
    if (kunci === "sistemLamaAktif" && !baru && !window.confirm("Matikan booking sistem lama di kalender? Turtle akan memakai data dashboard sendiri. Jadwal dive center tetap tampil bila sakelarnya menyala. Tidak ada data yang dihapus.")) return;
    setSibuk(true);
    setGalat("");
    try {
      const r = await fetch("/api/pengaturan", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [kunci]: baru }) });
      if (!r.ok) {
        const o = (await r.json().catch(() => ({}))) as { galat?: string };
        setGalat(o.galat ?? "Tidak bisa mengubah sakelar.");
        setSibuk(false);
        return;
      }
      window.location.reload();
    } catch {
      setGalat("Tidak bisa menghubungi server.");
      setSibuk(false);
    }
  };

  if (!k) return null;
  const status = !k.sistemLamaAktif ? "Dimatikan" : k.sistemLamaSiap ? "Menyala" : "Menyala, tapi belum diatur di server";

  return (
    <div className={`rounded-3xl bg-white ring-1 ring-panel-garis ${ringkas ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Sistem lama Turtle</p>
          <p className="mt-1 text-[0.9375rem] font-bold text-panel-utama">Booking sistem lama di kalender</p>
          <p className="mt-1 text-[1.0625rem] font-bold text-panel-utama">{status}</p>
          <p className="mt-1 text-[0.875rem] leading-[1.5] text-panel-utama/75">
            {k.sistemLamaAktif
              ? "Booking dan jadwal Turtle dibaca dari sistem staf lama (Apps Script). Kamar Turtle di dashboard mengikuti sistem itu."
              : (k.jadwalLamaAktif ?? true) ? "Kalender Turtle memakai data dashboard sendiri; booking sistem lama tidak dipakai di kalender. Sistem lama masih dibaca untuk jadwal dive center dan pencocokan. Tidak ada data yang dihapus." : "Turtle memakai data dashboard sendiri, dan sistem lama tidak dipanggil sama sekali. Tidak ada data yang dihapus; menyalakannya lagi membaca sistem lama seperti semula."}
          </p>
          {k.diubahOleh && k.diubahPada && (
            <p className="mt-1 text-[0.75rem] text-panel-utama/60">
              Terakhir diubah oleh {k.diubahOleh}, {new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jayapura", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(k.diubahPada)).replace(":", ".")} WIT.
            </p>
          )}
          {!k.bolehUbah && <p className="mt-1 text-[0.75rem] text-panel-utama/60">Hanya developer dan pemilik yang bisa mengubahnya.</p>}
          {galat && <p className="mt-2 text-[0.8125rem] font-medium text-panel-merah">{galat}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={k.sistemLamaAktif}
          aria-label="Sistem lama"
          disabled={!k.bolehUbah || sibuk}
          onClick={() => void balik("sistemLamaAktif")}
          className={`relative mt-1 h-7 w-12 shrink-0 cursor-pointer rounded-full border-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${k.sistemLamaAktif ? "bg-panel-aksen" : "bg-panel-garis"}`}
        >
          <span className={`absolute top-[3px] size-[22px] rounded-full bg-white shadow transition-all ${k.sistemLamaAktif ? "left-[23px]" : "left-[3px]"}`} />
        </button>
      </div>
      <div className="mt-4 flex items-start gap-4 border-t border-panel-garis pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-bold text-panel-utama">Jadwal dive center dari sistem lama</p>
          <p className="mt-1 text-[0.8125rem] leading-[1.5] text-panel-utama/75">
            {(k.jadwalLamaAktif ?? true) || k.sistemLamaAktif
              ? "Jadwal diving, snorkeling, kursus, trip, dan transport dibaca dari sistem lama dan tampil di kalender, juga dipakai untuk mencocokkan pesanan Booking.com dengan sistem lama. Booking-nya tidak dipakai di kalender kecuali sakelar di atas menyala."
              : "Jadwal dive center tidak dibaca."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={(k.jadwalLamaAktif ?? true) || k.sistemLamaAktif}
          aria-label="Jadwal dive center dari sistem lama"
          disabled={!k.bolehUbah || sibuk || k.sistemLamaAktif}
          title={k.sistemLamaAktif ? "Selalu menyala selama booking sistem lama dipakai." : undefined}
          onClick={() => void balik("jadwalLamaAktif")}
          className={`relative mt-1 h-7 w-12 shrink-0 cursor-pointer rounded-full border-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${(k.jadwalLamaAktif ?? true) || k.sistemLamaAktif ? "bg-panel-aksen" : "bg-panel-garis"}`}
        >
          <span className={`absolute top-[3px] size-[22px] rounded-full bg-white shadow transition-all ${(k.jadwalLamaAktif ?? true) || k.sistemLamaAktif ? "left-[23px]" : "left-[3px]"}`} />
        </button>
      </div>
    </div>
  );
}
