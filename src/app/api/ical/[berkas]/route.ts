import { feedSambungan } from "@/lib/server/buku";

/**
 * Kalender ekspor satu sambungan, `/api/ical/<token>.ics`. Dibaca situs
 * pemesanan dan agen perjalanan untuk tahu malam mana yang terisi. Hanya
 * malamnya, tidak pernah nama tamu. Tidak butuh sesi: rahasianya ada di
 * tautannya, yang bisa dibuat ulang dari layar Sinkronisasi.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ berkas: string }> }) {
  const { berkas } = await params;
  const token = berkas.replace(/\.ics$/i, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(token)) return new Response("Tautan kalender tidak dikenal.", { status: 404 });
  let isi: string | null = null;
  try {
    isi = await feedSambungan(token);
  } catch (e) {
    console.error("[sinkron] ekspor kalender", e);
    return new Response("Kalender sedang tidak bisa dibuat.", { status: 503, headers: { "retry-after": "600" } });
  }
  if (!isi) return new Response("Tautan kalender tidak dikenal.", { status: 404 });
  return new Response(isi, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="${token.slice(0, 8)}.ics"`,
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
