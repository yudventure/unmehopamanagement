# docs — sumber dokumen PDF

> Dokumen kedua, **proposal harga**, sumbernya ada di `docs/proposal/`. Cara
> membangunnya sama persis, cuma ganti nama foldernya.

Menghasilkan `docs/spesifikasi-website.pdf`: 13 halaman 16:9, dua bahasa
teknis, untuk menjelaskan apa yang sudah dibangun dan di mana sebaiknya
dijalankan.

| Berkas | Isi |
|---|---|
| `pitch/deck.html` | Isi dan susunan tiap halaman. Empat penanda (`__DMSANS__`, `__MONO__`, `__LOGO__`, `__CSS__`) diisi saat build |
| `pitch/deck.css` | Token warna, tipografi, kartu, tabel, dan meteran. 16:9 |
| `proposal/doc.html`, `proposal/doc.css` | Proposal harga, A4 tegak, palet yang sama |
| `proposal/RINCIAN-INTERNAL.md` | Perhitungan margin. **Tidak ikut ke PDF dan tidak untuk klien** |
| `../build.mjs` | Menyatukan font, logo, dan CSS jadi satu berkas HTML mandiri. Satu argumen: nama foldernya |
| `../render.mjs` | Mencetaknya jadi PDF lewat Chromium, sekaligus memeriksa tidak ada isi yang keluar halaman |

Tiap folder dokumen isinya persis satu `.html` dan satu `.css`; skripnya
mencarinya sendiri, jadi menambah dokumen baru cukup menambah folder.

## Cara membangun ulang

```bash
npm run build            # sekali, supaya berkas fontnya ada di .next
node docs/build.mjs pitch
node docs/render.mjs pitch docs/spesifikasi-website.pdf
```

Proposal harganya:

```bash
node docs/build.mjs proposal
node docs/render.mjs proposal docs/proposal-harga-deploy.pdf
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

Harga di halaman 8 dan 9 semuanya **rupiah**, dan semuanya **harga
perpanjangan, bukan harga promo**. Harga promo cuma berlaku satu periode
pertama, jadi bukan angka yang dipakai menyusun anggaran tahunan, dan sengaja
tidak ditampilkan sama sekali. Dikonversi pada Rp 17.820 per USD, kurs
17 Agustus 2026.

**Seberapa jauh angka itu bisa dipercaya, dan ini penting kalau nanti
diperbarui.** Halaman resmi Hostinger diblokir dari lingkungan kerja ini, jadi
semuanya dari sumber pihak ketiga, dan sumber-sumber itu **saling bertentangan**
soal perpanjangan: satu menyebut KVM 2 diperpanjang di $19,49, satu lagi
$24,49, satu lagi bilang perpanjangan ada di kisaran $8,99 sampai $10,99. Yang
dipakai di deck adalah angka yang disebut berpasangan dengan harga promonya
sendiri, karena itu yang paling mungkin dibaca dari satu tabel yang sama.
KVM 4 dikosongkan karena tidak ketemu angkanya sama sekali.

Deck-nya menyebut ketidakpastian itu di halamannya, bukan menyembunyikannya di
balik angka yang kelihatan pasti. Kalau nanti diperbarui, ambil dari halaman
checkout Hostinger sendiri, dan perbarui kurs beserta tanggalnya di halaman 8.

`render.mjs` menolak diam-diam. Yang diperiksa bukan cuma isi yang keluar batas
halaman, tapi juga isi yang **naik menimpa judul** atau **turun menabrak
footer**. Yang kedua itu yang paling gampang lolos: `.body` dipusatkan di ruang
sisa, jadi slide yang isinya kepenuhan tidak tumpah keluar halaman, dia merangkak
ke atas sampai baris pertama tabel sejajar dengan judulnya. Masih di dalam
halaman, tetap tidak terbaca. Kalau ketemu, nomor halaman dan alasannya disebut
dan PDF-nya tidak ditulis.

## `render.mjs`

Perlu satu argumen, tempat PDF-nya ditulis. Tanpa argumen dia menulis ke folder
ini, bukan ke `docs/`.
