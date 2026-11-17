import "server-only";

/**
 * Pembatas percobaan di memori: berapa kali satu kunci dicoba dalam satu
 * jendela. Cukup untuk satu server Node; hilang saat restart, yang untuk
 * pembatas login adalah kompromi yang wajar.
 */
const catatan = new Map<string, { sampai: number; n: number }>();

export function catat(kunci: string, jendelaMs: number): number {
  const sekarang = Date.now();
  const ada = catatan.get(kunci);
  if (!ada || ada.sampai <= sekarang) {
    catatan.set(kunci, { sampai: sekarang + jendelaMs, n: 1 });
    return 1;
  }
  ada.n += 1;
  return ada.n;
}

export function alamatPeminta(req: Request): string {
  const f = req.headers.get("x-forwarded-for");
  return (f ? f.split(",")[0] : req.headers.get("x-real-ip") || "lokal").trim();
}
