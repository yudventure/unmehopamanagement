"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Mencatat satu kunjungan tiap jalur berganti, lewat beacon ke
 * `/api/kunjungan`. Tidak memasang cookie dan tidak membawa data pribadi:
 * hanya nama situs dan jalurnya. Do Not Track dan Global Privacy Control
 * dihormati di sini dan di server.
 *
 * Jalur yang dikirim adalah alamat yang tampil di peramban, bukan jalur
 * internal: di domain homestay, `/` tetap `/`.
 */
export function PencatatKunjungan({ situs }: { situs: "turtle" | "eddo" }) {
  const jalur = usePathname();
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    try {
      const isi = JSON.stringify({ situs, jalur: window.location.pathname });
      if (!nav.sendBeacon?.("/api/kunjungan", new Blob([isi], { type: "application/json" }))) {
        void fetch("/api/kunjungan", { method: "POST", headers: { "Content-Type": "application/json" }, body: isi, keepalive: true });
      }
    } catch {
      /* Mencatat kunjungan tidak boleh mengganggu halaman. */
    }
  }, [jalur, situs]);
  return null;
}
