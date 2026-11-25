"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { Booking } from "@/lib/types";

/**
 * Catatan jemputan per booking, seperti di sistem lama: perlu dijemput atau
 * tidak, dan jam serta tempatnya. Disimpan terpisah dari booking-nya
 * (`/api/catatan-tamu`), jadi bisa dicatat untuk tamu Booking.com dan iCal
 * yang booking-nya sendiri tidak bisa diubah di sini.
 */
export interface Jemput {
  jemput: "ya" | "tidak";
  catatan: string;
  oleh: string;
  pada: string;
}

interface Konteks {
  peta: Record<string, Jemput>;
  bolehUbah: boolean;
  simpan: (b: Booking, jemput: "ya" | "tidak" | null, catatan: string) => Promise<string | null>;
}

const KonteksJemput = createContext<Konteks>({ peta: {}, bolehUbah: false, simpan: async () => null });

export function PenyediaJemput({ bolehUbah, aktif, children }: { bolehUbah: boolean; aktif: boolean; children: React.ReactNode }) {
  const [peta, setPeta] = useState<Record<string, Jemput>>({});
  useEffect(() => {
    if (!aktif) return;
    let batal = false;
    const muat = () =>
      fetch("/api/catatan-tamu", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((o: { catatan?: Record<string, Jemput> } | null) => {
          if (!batal && o?.catatan) setPeta(o.catatan);
        })
        .catch(() => undefined);
    void muat();
    const t = setInterval(muat, 60_000);
    return () => {
      batal = true;
      clearInterval(t);
    };
  }, [aktif]);

  const simpan: Konteks["simpan"] = async (b, jemput, catatan) => {
    try {
      const r = await fetch("/api/catatan-tamu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: b.id, roomId: b.roomId, jemput, catatan }),
      });
      if (!r.ok) {
        const o = (await r.json().catch(() => ({}))) as { galat?: string };
        return o.galat ?? "Tidak bisa menyimpan catatan jemputan.";
      }
      setPeta((p) => {
        const baru = { ...p };
        if (jemput) baru[b.id] = { jemput, catatan, oleh: "", pada: new Date().toISOString() };
        else delete baru[b.id];
        return baru;
      });
      return null;
    } catch {
      return "Tidak bisa menghubungi server.";
    }
  };

  return <KonteksJemput.Provider value={{ peta, bolehUbah, simpan }}>{children}</KonteksJemput.Provider>;
}

export const useJemput = () => useContext(KonteksJemput);

/** Lencana kecil: "Jemput" (dengan jam/tempat bila ada) atau "Tanpa jemput". Tidak tampil bila belum dicatat. */
export function LencanaJemput({ id, lengkap = false }: { id: string; lengkap?: boolean }) {
  const { peta } = useJemput();
  const j = peta[id];
  if (!j) return null;
  return j.jemput === "ya" ? (
    <span title={j.catatan || undefined} className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-amber-100 px-2 py-[1px] text-[11px] font-bold text-amber-900">
      Jemput{lengkap && j.catatan ? `: ${j.catatan}` : ""}
    </span>
  ) : (
    <span className="rounded-full bg-surface-tint px-2 py-[1px] text-[11px] font-semibold text-slate">Tanpa jemput</span>
  );
}

/** Bagian di rincian booking: pilih perlu dijemput atau tidak, dan catatan jam/tempat. */
export function AturJemput({ booking }: { booking: Booking }) {
  const { peta, bolehUbah, simpan } = useJemput();
  const ada = peta[booking.id];
  const [catatan, setCatatan] = useState(ada?.catatan ?? "");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  useEffect(() => setCatatan(peta[booking.id]?.catatan ?? ""), [booking.id, peta]);

  const pilih = async (j: "ya" | "tidak" | null) => {
    setSibuk(true);
    setGalat((await simpan(booking, j, j === "ya" ? catatan : "")) ?? "");
    setSibuk(false);
  };
  const tombol = (aktif: boolean) =>
    `cursor-pointer rounded-[10px] border px-3 py-[7px] text-[12.5px] font-semibold disabled:opacity-50 ${aktif ? "border-teal bg-teal text-white" : "border-line-strong bg-surface text-ink-soft hover:bg-surface-hover"}`;

  return (
    <div className="rounded-[14px] border border-line-soft bg-surface-mute px-3 py-3">
      <div className="mb-2 text-[12.5px] font-bold">Jemputan</div>
      {bolehUbah ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={sibuk} onClick={() => void pilih("ya")} className={tombol(ada?.jemput === "ya")}>Perlu dijemput</button>
            <button type="button" disabled={sibuk} onClick={() => void pilih("tidak")} className={tombol(ada?.jemput === "tidak")}>Tidak perlu</button>
            {ada && <button type="button" disabled={sibuk} onClick={() => void pilih(null)} className="cursor-pointer border-none bg-transparent px-1 text-[12px] text-slate-soft underline">Belum tahu</button>}
          </div>
          {ada?.jemput === "ya" && (
            <div className="mt-2 flex gap-2">
              <input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                maxLength={200}
                placeholder="Jam dan tempat, mis. Waisai 14.00, kapal cepat"
                aria-label="Catatan jemputan"
                className="min-w-0 flex-1 rounded-[9px] border border-line-input bg-surface px-[10px] py-[6px] text-[12.5px] outline-none focus:border-teal"
              />
              <button type="button" disabled={sibuk || catatan === (ada.catatan ?? "")} onClick={() => void pilih("ya")} className="cursor-pointer rounded-[9px] border-none bg-teal px-3 text-[12.5px] font-bold text-white disabled:opacity-50">Simpan</button>
            </div>
          )}
        </>
      ) : (
        <div className="text-[12.5px] text-slate">{ada ? (ada.jemput === "ya" ? `Perlu dijemput${ada.catatan ? `: ${ada.catatan}` : ""}` : "Tidak perlu dijemput") : "Belum dicatat."}</div>
      )}
      {galat && <div className="mt-2 text-[12px] text-danger-ink">{galat}</div>}
    </div>
  );
}
