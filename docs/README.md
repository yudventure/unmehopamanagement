# docs — sumber dokumen PDF

Menghasilkan `docs/spesifikasi-dan-penawaran.pdf`: 16 halaman A4 tegak,
spesifikasi teknis dan penawaran harga deploy dalam **satu dokumen**. Halaman
1 sampai 10 menjelaskan apa yang sudah dibangun, memperlihatkannya, dan di mana
sebaiknya dijalankan; halaman 11 sampai 16 lingkup pekerjaan, biaya, batasan,
dan tanda tangan.

| Berkas | Isi |
|---|---|
| `penawaran/doc.html` | Isi dan susunan tiap halaman. Penanda `__DMSANS__`, `__MONO__`, `__LOGO__`, `__CSS__`, dan `__SHOT_*__` diisi saat build |
| `penawaran/doc.css` | Token warna, tipografi, kartu, tabel, meteran, dan bingkai tangkapan layar. A4 tegak |
| `penawaran/shots/*.jpg` | Tangkapan layar aplikasi yang sudah berjalan, dipakai di halaman 3 sampai 6 |
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

Semua angka performa di halaman 8 dan 9 **diukur**, bukan diperkirakan: berat
halaman dari build produksi lewat Chromium, waktu dan memori build dari
`npm run build` di mesin ini. Kalau aplikasinya berubah banyak, ukur ulang
sebelum menyebarkan dokumennya lagi.

Harga di halaman 12 dan 13 adalah **harga normal Hostinger, bukan harga
promo**, atas permintaan pemilik. Angkanya diambil dari harga coret di layar
Hostinger sendiri: KVM 2 Rp 407.900 per bulan, email Rp 28.900 per bulan, nama
domain Rp 209.900 per tahun. Semuanya diambil 24 bulan, jadi kedua halaman itu
menyebut angka yang sama, dan itu memang gunanya: anggaran yang tidak berubah
saat promonya habis.

Harga promo yang sedang berlaku jauh lebih murah, dan selisihnya besar. Halaman
12 menyelesaikan itu dengan menyatakan selisihnya jadi milik pemilik dan
kuitansi Hostinger diserahkan apa adanya. Kalau kalimat itu diubah, janji
kuitansi di halaman 11 dan 16 harus ikut diubah, atau dokumennya jadi
menjanjikan dua hal yang bertentangan. Rinciannya ada di
`penawaran/RINCIAN-INTERNAL.md`.

Tiga nama domain, bukan dua: `turtlehomestay.com` untuk situs publik Turtle,
`unmehoppa.com` untuk dashboard, dan satu lagi untuk situs publik Eddo
Homestay di `/eddo`, yang nama pastinya belum dipilih.

**Kalau nanti diperbarui, ambil dari keranjang atau halaman checkout Hostinger,
dan catat mana yang harga coret dan mana yang harga bayar.** Jangan dari
artikel pihak ketiga: versi lama dokumen ini memakai perkiraan Rp 436 rb per
bulan dari sumber yang saling bertentangan, dan angka itu meleset jauh.

## Tangkapan layarnya asli

Halaman 3 sampai 6 memperlihatkan aplikasi yang sudah berjalan, diambil dari
build produksi lewat Chromium di 1440x900 dan 390x844, bukan gambar rancangan.
Dikecilkan ke 1020px (layar lebar) dan 470px (ponsel) lalu disimpan sebagai
JPEG mutu 84 memakai canvas Chromium sendiri, karena di lingkungan ini tidak
ada ImageMagick, sharp, atau PIL. Tiga belas berkas, sekitar 1,1 MB.

`build.mjs` menukar `__SHOT_nama__` di markup dengan isi `shots/nama.jpg`.
Dua arahnya diperiksa dan dua-duanya menggagalkan build: penanda yang tidak
punya berkas, dan berkas yang tidak dipakai halaman mana pun. Dokumen yang
buktinya diam-diam hilang tetap bisa dicetak, dan tercetak salah.

Kalau aplikasinya berubah tampilannya, ambil ulang. Skrip pengambilannya tidak
ikut disimpan karena butuh server yang sedang jalan; yang disimpan hasilnya,
supaya dokumennya bisa dibangun ulang tanpa menjalankan aplikasinya.

## `render.mjs` menolak diam-diam

Yang diperiksa bukan cuma isi yang keluar batas halaman, tapi juga isi yang
**lebih tinggi dari ruang `.body`**, yang **naik menimpa judul**, atau yang
**turun menabrak footer**. Yang pertama itu yang paling gampang lolos:
halamannya `overflow: hidden`, jadi isi yang kelebihan tidak tumpah ke luar di
tempat yang kelihatan, dia cuma terpotong diam-diam di bawah. Itu yang
menangkap halaman tangkapan layar waktu barisnya masih kelewat tinggi. Kalau
ketemu, nomor halaman dan alasannya disebut dan PDF-nya tidak ditulis.

Perlu dua argumen: nama folder dan tempat PDF-nya ditulis.
