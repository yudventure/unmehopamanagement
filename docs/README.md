# docs — sumber dokumen PDF

Menghasilkan `docs/spesifikasi-dan-penawaran.pdf`: 12 halaman A4 tegak,
spesifikasi teknis dan penawaran harga deploy dalam **satu dokumen**. Halaman
1 sampai 6 menjelaskan apa yang sudah dibangun dan di mana sebaiknya
dijalankan; halaman 7 sampai 12 lingkup pekerjaan, biaya, batasan, dan tanda
tangan.

| Berkas | Isi |
|---|---|
| `penawaran/doc.html` | Isi dan susunan tiap halaman. Empat penanda (`__DMSANS__`, `__MONO__`, `__LOGO__`, `__CSS__`) diisi saat build |
| `penawaran/doc.css` | Token warna, tipografi, kartu, tabel, dan meteran. A4 tegak |
| `penawaran/RINCIAN-INTERNAL.md` | Perhitungan margin. **Tidak ikut ke PDF dan tidak untuk klien** |
| `build.mjs` | Menyatukan font, logo, dan CSS jadi satu berkas HTML mandiri. Satu argumen: nama foldernya |
| `render.mjs` | Mencetaknya jadi PDF lewat Chromium, sekaligus memeriksa tidak ada isi yang keluar halaman |

Tiap folder dokumen isinya persis satu `.html` dan satu `.css`; skripnya
mencarinya sendiri, jadi menambah dokumen baru cukup menambah folder.

## Cara membangun ulang

```bash
npm run build            # sekali, supaya berkas fontnya ada di .next
node docs/build.mjs penawaran
node docs/render.mjs penawaran docs/spesifikasi-dan-penawaran.pdf
```

`render.mjs` butuh Chromium-nya Playwright. Itu **bukan** dependensi aplikasi
dan sengaja tidak dimasukkan ke `package.json`: ini dokumen, bukan bagian dari
produk, dan aplikasinya tidak perlu membawa peramban cuma untuk mencetak PDF.

## Kenapa fontnya diambil dari `.next`

Dokumennya diketik dengan DM Sans dan JetBrains Mono yang sama dengan
produknya, diambil dari hasil build lalu ditanam sebagai base64 di dalam
HTML-nya. Tidak ada yang perlu diunduh saat mencetak, dan hasilnya tidak bisa
berubah gara-gara komputer yang mencetak tidak punya fontnya. `build.mjs`
mencari berkasnya lewat nama keluarga font di CSS hasil build, bukan lewat nama
berkas: nama berkasnya punya hash yang berubah tiap build, nama keluarganya
tidak.

## Angka di dalamnya

Semua angka performa di halaman 4 dan 5 **diukur**, bukan diperkirakan: berat
halaman dari build produksi lewat Chromium, waktu dan memori build dari
`npm run build` di mesin ini. Kalau aplikasinya berubah banyak, ukur ulang
sebelum menyebarkan dokumennya lagi.

Harga di halaman 8 **disalin apa adanya dari dua keranjang belanja Hostinger**,
termasuk pajaknya. Pesanan pertama servernya (Rp 3.806.856), pesanan kedua nama
domain situs publik berikut email profesionalnya (Rp 704.226); dua-duanya cocok
dengan total di keranjangnya masing-masing. Tidak ada konversi mata uang di mana
pun: semuanya sudah rupiah dari sumbernya. Harga promo tidak dipakai sebagai
dasar anggaran tahunan; yang ditampilkan sebagai coretan cuma harga daftarnya,
supaya potongannya terlihat.

Halaman 9 memisahkan dengan tegas mana yang pasti dan mana yang perkiraan. Dua
harga perpanjangan tertulis di keranjangnya sendiri dan diberi tanda "harga
pasti": KVM 2 **Rp 271.900 per bulan** dan email **Rp 19.900 per bulan**.
Perpanjangan backup harian dan nama domain dashboard tidak ditampilkan di sana,
jadi dihitung memakai harga yang berlaku sekarang dan ditandai `±`.
turtlehomestay.com sudah dibayar tiga tahun di muka, jadi barisnya Rp 0 sampai
tahun keempat.

**Kalau nanti diperbarui, ambil dari keranjang atau halaman checkout Hostinger,
jangan dari artikel pihak ketiga.** Versi sebelumnya memakai perkiraan
Rp 436 rb per bulan dari sumber pihak ketiga yang saling bertentangan, dan
angka itu meleset jauh. Keranjang aslinya juga yang mengoreksi lokasi server
(Malaysia, bukan Singapura) dan nama domainnya (`turtlehomestay.com`, bukan
`turtledivehomestay.com`).

## `render.mjs` menolak diam-diam

Yang diperiksa bukan cuma isi yang keluar batas halaman, tapi juga isi yang
**naik menimpa judul** atau **turun menabrak footer**. Yang kedua itu yang
paling gampang lolos: `.body` dipusatkan di ruang sisa, jadi halaman yang
isinya kepenuhan tidak tumpah keluar halaman, dia merangkak ke atas sampai
baris pertama tabel sejajar dengan judulnya. Masih di dalam halaman, tetap
tidak terbaca. Kalau ketemu, nomor halaman dan alasannya disebut dan PDF-nya
tidak ditulis.

Perlu dua argumen: nama folder dan tempat PDF-nya ditulis.
