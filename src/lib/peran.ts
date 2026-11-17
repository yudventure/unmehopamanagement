/**
 * Peran akun dashboard (pola Fantasea, `lib/peran.ts`).
 *
 * - developer dan pemilik: akses penuh, termasuk mengatur akun orang lain.
 * - admin: melihat semua properti dan angka keuangan, tanpa mengatur akun.
 * - staf: kalender, input booking, dan pembayaran di properti yang diizinkan.
 *   Tanpa angka rupiah.
 *
 * Peran yang tidak dikenal dianggap staf: gagal ke arah yang paling sempit.
 */
export type Peran = "developer" | "pemilik" | "admin" | "staf";
export const PERAN: Peran[] = ["developer", "pemilik", "admin", "staf"];

export const LABEL_PERAN: Record<Peran, string> = {
  developer: "Developer",
  pemilik: "Pemilik",
  admin: "Admin",
  staf: "Staf",
};

export const rapikanPeran = (v: unknown): Peran =>
  PERAN.includes(v as Peran) ? (v as Peran) : "staf";

/** Boleh menambah akun, mengubah peran, dan menonaktifkan orang lain. */
export const aksesPenuh = (p: Peran) => p === "developer" || p === "pemilik";

/** Melihat semua properti dan angka rupiah, seperti "Owner" di tampilan. */
export const tampilanOwner = (p: Peran) => p !== "staf";
