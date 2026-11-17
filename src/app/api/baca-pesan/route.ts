import { NextResponse } from "next/server";

import { akunMasuk, bolehCatat, galat, tidakAda } from "@/lib/server/akses";
import { alamatPeminta, catat } from "@/lib/server/batas";
import { catatGalat } from "@/lib/server/galat";
import { kunciAnthropic } from "@/lib/server/kunci";

/**
 * Membaca screenshot pesan booking (misalnya WhatsApp dari Stay Raja Ampat)
 * menjadi baris pesanan yang masih harus diperiksa orangnya.
 *
 * Pembacanya model bahasa dengan kemampuan gambar. Karena itu:
 *
 *  - **Mati sampai kuncinya diisi**, dari layar Pengaturan atau `ANTHROPIC_API_KEY`. Tanpa kunci, jawabannya
 *    503 yang menjelaskan, bukan hasil palsu.
 *  - **Gambar dikirim ke layanan itu** untuk dibaca (berisi nama dan nomor
 *    tamu), dan setiap pembacaan dikenai biaya di akun pemilik kunci. Layar
 *    mengatakan itu sebelum tombolnya ditekan.
 *  - Hasilnya tidak disimpan. Ia dikembalikan sebagai usulan, dan hanya
 *    menjadi pesanan setelah orangnya memeriksa dan menyimpannya.
 *  - Model diminta mengisi `null` untuk yang tidak terbaca, tidak menebak.
 *
 * Hanya akun yang boleh mencatat pesanan. Dibatasi 20 pembacaan per 10 menit
 * per akun.
 *
 * `ANTHROPIC_API_URL` dan `BACA_PESAN_MODEL` opsional (uji dengan layanan
 * tiruan; model lain).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATAS_BYTE = 5 * 1024 * 1024;
const JENIS = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface Usulan {
  guest: string;
  checkIn: string;
  checkOut: string;
  pax: number | null;
  room: string;
  catatan: string;
  total: number | null;
}

const TGL = /^\d{4}-\d{2}-\d{2}$/;
const teks = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

function rapikan(o: unknown): Usulan | null {
  if (!o || typeof o !== "object") return null;
  const x = o as Record<string, unknown>;
  const checkIn = TGL.test(teks(x.checkIn, 10)) ? teks(x.checkIn, 10) : "";
  const checkOutMentah = TGL.test(teks(x.checkOut, 10)) ? teks(x.checkOut, 10) : "";
  if (!checkIn && !checkOutMentah) return null;
  const pax = Number(x.pax);
  const total = Number(x.total);
  return {
    guest: teks(x.guest, 80),
    checkIn,
    checkOut: checkOutMentah > checkIn ? checkOutMentah : "",
    pax: Number.isFinite(pax) && pax > 0 && pax < 40 ? Math.round(pax) : null,
    room: teks(x.room, 40),
    catatan: teks(x.catatan, 300),
    total: Number.isFinite(total) && total > 0 ? Math.round(total) : null,
  };
}

export async function POST(req: Request) {
  const akun = await akunMasuk();
  if (!akun || !bolehCatat(akun)) return tidakAda();

  const { kunci } = await kunciAnthropic();
  if (!kunci) {
    return NextResponse.json(
      {
        galat:
          "Pembaca screenshot belum diaktifkan di server (kuncinya belum diisi). Tempel teks pesannya saja, atau minta pemilik mengisinya di Pengaturan.",
      },
      { status: 503 },
    );
  }

  if (catat(`baca:${akun.email}`, 10 * 60 * 1000) > 20) return galat("Terlalu banyak pembacaan. Tunggu sebentar.", 429);

  const o = (await req.json().catch(() => ({}))) as { gambar?: unknown; jenis?: unknown; hariIni?: unknown; kamar?: unknown };
  const jenis = teks(o.jenis, 30);
  const data = typeof o.gambar === "string" ? o.gambar.replace(/^data:[^,]*,/, "") : "";
  if (!JENIS.includes(jenis) || !data) return galat("Gambar tidak sah. Pakai PNG, JPG, WebP, atau GIF.");
  if (Math.ceil((data.length * 3) / 4) > BATAS_BYTE) return galat("Gambar terlalu besar. Maksimal 5 MB.", 413);
  const hariIni = TGL.test(teks(o.hariIni, 10)) ? teks(o.hariIni, 10) : new Date().toISOString().slice(0, 10);
  const kamar = Array.isArray(o.kamar) ? o.kamar.map((k) => teks(k, 40)).filter(Boolean).slice(0, 60) : [];

  const perintah =
    `Ini screenshot pesan booking penginapan (misalnya WhatsApp). Hari ini ${hariIni}.\n` +
    "Keluarkan HANYA satu larik JSON, tanpa teks lain, berisi satu objek per pesanan yang tertulis jelas:\n" +
    '[{"guest": nama tamu atau null, "checkIn": "YYYY-MM-DD" atau null, "checkOut": "YYYY-MM-DD" atau null, ' +
    '"pax": jumlah tamu atau null, "room": nama kamar persis dari daftar atau null, "catatan": ringkasan satu kalimat, ' +
    '"total": total rupiah sebagai angka atau null}].\n' +
    "Aturan: jangan menebak. Yang tidak tertulis jelas diisi null. Tanggal tanpa tahun memakai tahun terdekat setelah hari ini. " +
    "Bila screenshot bukan soal booking, keluarkan [].\n" +
    (kamar.length ? `Daftar nama kamar yang ada: ${kamar.join(", ")}.` : "");

  let jawaban: Response;
  try {
    jawaban = await fetch(`${process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": kunci, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: process.env.BACA_PESAN_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: jenis, data } },
              { type: "text", text: perintah },
            ],
          },
        ],
      }),
    });
  } catch {
    await catatGalat("Pembaca screenshot", "Tidak bisa menghubungi layanan pembaca (jaringan atau waktu habis).");
    return galat("Tidak bisa menghubungi pembaca screenshot. Coba lagi sebentar.", 502);
  }
  if (!jawaban.ok) {
    await catatGalat("Pembaca screenshot", jawaban.status === 401 ? "Kunci API pembaca screenshot ditolak. Ganti kuncinya di Pengaturan." : jawaban.status === 429 ? "Pembaca screenshot kena batas pemakaian atau saldo kuncinya habis." : `Layanan pembaca menjawab ${jawaban.status}.`);
    return galat(jawaban.status === 401 ? "Kunci pembaca screenshot ditolak. Minta pemilik menggantinya di Pengaturan." : `Pembaca screenshot menjawab ${jawaban.status}.`, 502);
  }

  const hasil = (await jawaban.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
  const isi = hasil?.content?.find((c) => c.type === "text")?.text ?? "";
  const potong = /\[[\s\S]*\]/.exec(isi)?.[0];
  let larik: unknown = [];
  try {
    larik = potong ? JSON.parse(potong) : [];
  } catch {
    return galat("Isi screenshot tidak bisa dibaca. Coba tempel teksnya.", 422);
  }
  const baris = (Array.isArray(larik) ? larik : []).map(rapikan).filter((b): b is Usulan => b !== null).slice(0, 30);
  return NextResponse.json({ baris });
}
