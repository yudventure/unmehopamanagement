# docs/pitch — sumber deck spesifikasi

Menghasilkan `docs/spesifikasi-website.pdf`: 13 halaman 16:9, dua bahasa
teknis, untuk menjelaskan apa yang sudah dibangun dan di mana sebaiknya
dijalankan.

| Berkas | Isi |
|---|---|
| `deck.html` | Isi dan susunan tiap halaman. Empat penanda (`__DMSANS__`, `__MONO__`, `__LOGO__`, `__CSS__`) diisi saat build |
| `deck.css` | Token warna, tipografi, kartu, tabel, dan meteran |
| `build.mjs` | Menyatukan font, logo, dan CSS jadi satu berkas HTML mandiri |
| `render.mjs` | Mencetaknya jadi PDF lewat Chromium, sekaligus memeriksa tidak ada isi yang keluar halaman |

## Cara membangun ulang

```bash
npm run build            # sekali, supaya berkas fontnya ada di .next
node docs/pitch/build.mjs
node docs/pitch/render.mjs docs/spesifikasi-website.pdf
```

`render.mjs` butuh Chromium-nya Playwright. Itu **bukan** dependensi aplikasi
dan sengaja tidak dimasukkan ke `package.json`: ini dokumen, bukan bagian dari
produk, dan aplikasinya tidak perlu membawa peramban cuma untuk mencetak PDF.

## Kenapa fontnya diambil dari `.next`

Deck-nya diketik dengan DM Sans dan JetBrains Mono yang sama dengan produknya,
diambil dari hasil build lalu ditanam sebagai base64 di dalam HTML-nya. Tidak
ada yang perlu diunduh saat mencetak, dan hasilnya tidak bisa berubah gara-gara
komputer yang mencetak tidak punya fontnya. `build.mjs` mencari berkasnya lewat
nama keluarga font di CSS hasil build, bukan lewat nama berkas: nama berkasnya
punya hash yang berubah tiap build, nama keluarganya tidak.

## Angka di dalamnya

Semua angka performa di halaman 5, 7, dan 9 **diukur**, bukan diperkirakan:
berat halaman dari build produksi lewat Chromium, waktu dan memori build dari
`npm run build` di mesin ini. Kalau aplikasinya berubah banyak, ukur ulang
sebelum menyebarkan deck-nya lagi.

Harga di halaman 8 dan 9 semuanya **rupiah**. Angka Hostinger adalah daftar
harganya sendiri untuk pasar Indonesia, jadi bukan hasil kurs; Vercel dan
Cloudflare menagih dalam dolar dan dikonversi pada Rp 17.820 per USD, kurs
17 Agustus 2026. Semuanya dari sumber pihak ketiga, karena halaman resmi
Hostinger tidak bisa dibuka dari lingkungan kerja ini, dan deck-nya menyebutkan
itu apa adanya.

Satu hal yang gampang salah dibaca dan sudah ditulis terang-terangan di
halaman 9: **harga bulanan Hostinger itu harga promo untuk komitmen 24 bulan.**
KVM 2 yang sama Rp 151.900 untuk 24 bulan, Rp 180.900 untuk 12 bulan, dan
Rp 252.900 kalau bayar bulanan. Perpanjangan setelah promo lebih tinggi lagi.
Kalau angkanya diperbarui, perbarui juga kurs dan tanggalnya di halaman 8.

`render.mjs` menolak diam-diam: kalau ada isi yang melewati batas halaman, dia
menyebut nomor halamannya sebelum mencetak.

## `render.mjs`

Perlu satu argumen, tempat PDF-nya ditulis. Tanpa argumen dia menulis ke folder
ini, bukan ke `docs/`.
