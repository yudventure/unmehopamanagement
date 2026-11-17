import "server-only";

type Bentuk = "sandbox" | "produksi" | "tidak-dikenal";

export function bentukServer(k: string): Bentuk {
  if (k.startsWith("SB-")) return "sandbox";
  if (k.startsWith("Mid-server-")) return "produksi";
  return "tidak-dikenal";
}
export function bentukKlien(k: string): Bentuk {
  if (k.startsWith("SB-Mid-client-")) return "sandbox";
  if (k.startsWith("Mid-client-")) return "produksi";
  return "tidak-dikenal";
}
export const akhir = (k: string) => (k.length >= 8 ? k.slice(-4) : "");


/** Hal yang bertabrakan pada kunci Midtrans, ditulis sebagai kalimat untuk pemilik. */
export function peringatanMidtrans(server: string, klien: string, produksi: boolean): string[] {
  const bs = server ? bentukServer(server) : null;
  const bk = klien ? bentukKlien(klien) : null;
  const w: string[] = [];
  if (bs === "sandbox" && produksi) w.push("Server key sandbox dipakai dengan mode produksi. Midtrans akan menolaknya.");
  if (bs === "produksi" && !produksi) w.push("Server key produksi dipakai dengan mode sandbox. Midtrans akan menolaknya.");
  if (bk && bs && bk !== "tidak-dikenal" && bs !== "tidak-dikenal" && bk !== bs) w.push("Client key dan server key berasal dari lingkungan yang berbeda (sandbox dan produksi).");
  if (server && !klien) w.push("Client key belum terisi, jadi tombol bayar tidak tampil di situs.");
  if (!server && klien) w.push("Server key belum terisi, jadi pembayaran akan ditolak walau tombolnya tampil.");
  return w;
}
