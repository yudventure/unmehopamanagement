# docs — sumber dokumen PDF

Dua dokumen, satu alat. Tiap folder di sini adalah satu dokumen; `build.mjs`
menyatukannya jadi satu berkas HTML mandiri dan `render.mjs` mencetaknya.

| Folder | Hasil | Isi |
|---|---|---|
| `penawaran/` | `spesifikasi-dan-penawaran.pdf` | 16 halaman. Deploy ke **VPS KVM 2** dan **tiga** nama domain. Harga di dalamnya sudah lengkap |
| `penawaran-bisnis/` | `penawaran-hosting-bisnis.pdf` | 16 halaman. **Paket Unlimited Web Hosting** dan **dua** nama domain sebagai **layanan tahunan** — tiga pilihan masa paket berikut biaya lanjutannya — plus satu halaman branding peta Selat Dampier |

Keduanya A4 tegak dan dipakai untuk hal yang berbeda: yang pertama menawarkan
server yang diurus sendiri, yang kedua menawarkan paket terkelola untuk
aplikasi yang database dan build-nya sudah di luar. Yang kedua juga lebih
baru: dashboard-nya sudah membaca database sungguhan, dan dokumennya
mengatakan begitu.

## Isi satu folder dokumen

| Berkas | Isi |
|---|---|
| `doc.html` | Isi dan susunan tiap halaman. Penanda `__DMSANS__`, `__MONO__`, `__LOGO__`, `__CSS__`, `__SHOT_*__`, dan `__N_*__` diisi saat build |
| `doc.css` | Token warna, tipografi, kartu, tabel, meteran, dan bingkai tangkapan layar. A4 tegak |
| `shots/*.jpg` | Tangkapan layar aplikasi yang sudah berjalan |
| `angka.mjs` | **Opsional.** Semua angka dokumen itu berikut hitungannya. Tiap `__N_nama__` di markup diganti nilainya |
| `RINCIAN-INTERNAL.md` | Perhitungan margin. **Tidak ikut ke PDF dan tidak untuk klien** |

Tiap folder dokumen isinya persis satu `.html` dan satu `.css`; skripnya
mencarinya sendiri, jadi menambah dokumen baru cukup menambah folder.

`build.mjs` dan `render.mjs` dipakai bersama oleh keduanya:

| Berkas | Isi |
|---|---|
| `build.mjs` | Menyatukan font, logo, CSS, tangkapan layar, dan angka jadi satu berkas HTML mandiri. Satu argumen: nama foldernya |
| `render.mjs` | Mencetaknya jadi PDF lewat Chromium, sekaligus memeriksa tidak ada isi yang keluar halaman |

## Cara membangun ulang

```bash
npm run build            # sekali, supaya berkas fontnya ada di .next
node docs/build.mjs penawaran
node docs/render.mjs penawaran docs/spesifikasi-dan-penawaran.pdf

node docs/build.mjs penawaran-bisnis
node docs/render.mjs penawaran-bisnis docs/penawaran-hosting-bisnis.pdf
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

### Yang diukur

Semua angka performa **diukur, bukan diperkirakan**: berat halaman dari build
produksi lewat Chromium, waktu dan memori build dari `npm run build` di mesin
ini. Kalau aplikasinya berubah banyak, ukur ulang sebelum menyebarkan
dokumennya lagi. Angka di `penawaran-bisnis/` diukur 6 Oktober 2026 dan
berbeda dari angka di `penawaran/`, yang lebih tua; itu bukan ketidakcocokan
yang perlu dirapikan, itu dua pengukuran pada dua tanggal.

### Harga, dan dari mana boleh diambil

Harga di kedua dokumen adalah **harga normal Hostinger, bukan harga promo**,
atas permintaan pemilik. Angkanya diambil dari harga coret di layar Hostinger
sendiri: KVM 2 Rp 407.900 per bulan, email Rp 28.900 per bulan, nama domain
Rp 209.900 per tahun. Semuanya diambil 24 bulan, dan itu memang gunanya:
anggaran yang tidak berubah saat promonya habis.

Harga promo yang sedang berlaku jauh lebih murah, dan selisihnya besar.
`penawaran/` menyelesaikan itu dengan menyatakan selisihnya jadi milik pemilik
dan kuitansi Hostinger diserahkan apa adanya. Kalau kalimat itu diubah, janji
kuitansi di halaman 11 dan 16 harus ikut diubah, atau dokumennya jadi
menjanjikan dua hal yang bertentangan. Rinciannya ada di tiap
`RINCIAN-INTERNAL.md`.

**Kalau nanti diperbarui, ambil dari keranjang atau halaman checkout Hostinger,
dan catat mana yang harga coret dan mana yang harga bayar.** Jangan dari
artikel pihak ketiga: versi lama dokumen ini memakai perkiraan Rp 436 rb per
bulan dari sumber yang saling bertentangan, dan angka itu meleset jauh.

### Paket mana, dan harga mana

Paket yang dipakai `penawaran-bisnis/` bernama **Unlimited Web Hosting**.
`DEPLOY.md` masih menyebutnya "Business Web Hosting" karena begitu namanya
waktu itu; sekarang "Individual & Business" adalah nama tab-nya, dan paket di
dalamnya yang memuat Node.js bernama Unlimited. Dokumen memakai nama yang
tertulis di kartunya, supaya yang dipesan bukan paket lain.

Angkanya dari dialog durasi di layar checkout pemilik, 6 Oktober 2026, yang
menampilkan keempat durasi sekaligus:

| Durasi | Promo | Harga coret |
|---|---:|---:|
| 48 bulan, hemat 70% | Rp 38.900 / bln | Rp 129.900 / bln |
| 24 bulan, hemat 65% | Rp 44.900 / bln | Rp 129.900 / bln |
| 12 bulan, hemat 54% | Rp 59.900 / bln | Rp 129.900 / bln |
| 1 bulan | — | Rp 129.900 / bln |
| Perpanjangan paket | | Rp 121.900 / bln |

**Harga coretnya sama di keempat durasi**, jadi Rp 129.900/bln dipakai untuk
ketiga pilihan di dokumen tanpa perlu diperiksa per durasi. Pajaknya juga
terbukti di layar yang sama: ringkasan 48 bulan menulis Rp 1.867.200 plus
Rp 205.392, dan itu tepat 11%.

**Hostinger tidak menjual 36 bulan** — pilihannya 1, 12, 24, 48. Masa 3 tahun
di dokumen dibeli sebagai 24 + 12, yang di harga normal jumlahnya sama persis.
Halaman 13 mengatakan itu, bukan menyembunyikannya.

### Harga paketnya dipatok, bukan dijumlahkan

`penawaran-bisnis/` bukan penawaran bangun-lalu-pergi; ia **layanan
tahunan**, karena pemiliknya yang menerima telepon kalau ada apa-apa:

```
Tahun pertama                      Rp  9.000.000   PERIODE[0].harga
Tiap tahun sesudahnya              Rp  6.000.000   LANJUT
Atau: tiga tahun dikunci di depan  Rp 12.000.000   PERIODE[2].harga
```

Harga paketnya **angka bulat yang dipatok**, bukan hasil penjumlahan pos.
Bagian Hostinger tetap dirinci sampai rupiah di halaman 13 dan kuitansinya
tetap diserahkan; sisanya terbaca apa adanya sebagai pengerjaan dan
pendampingan. Jadi `angka.mjs` menghitung bagian Hostinger, lalu
**menguranginya dari harga paket**, bukan sebaliknya.

Halaman 14 membuka biaya lanjutannya jadi dua: Rp 2.496.696 ke Hostinger
dan Rp 3.503.304 pendampingan. Itu satu-satunya tempat angka pendampingan
muncul sebagai angka, dan `LANJUT` yang menentukannya.

Kalau angkanya diubah, baca dulu bagian **"Yang harus dibaca pemilik
sebelum mengirim dokumen ini"** di `penawaran-bisnis/RINCIAN-INTERNAL.md`:
paket tiga tahun mengikat 36 bulan pendampingan dengan bayaran jauh di
bawah tarif perpanjangan, dan itu keputusan, bukan kebetulan.

### Pita draf

Kalau satu masa paket di `PERIODE` harganya `null`, tiap angka yang
bergantung padanya tercetak sebagai isian kosong dan sampul berikut kedua
halaman harga membawa pita **"Draf — belum boleh dikirim"**. Mengisi harganya
lalu membangun ulang membuat pitanya hilang sendiri; tidak ada yang perlu
diingat untuk dihapus.

## `angka.mjs`: kenapa angkanya tidak ditulis di markup

Angka di halaman harga hampir semuanya turunan: harga per bulan dikali masa
paket, pajak atas jumlahnya, uang muka yang isinya satu pos penuh plus separuh
pos lain. Diketik satu-satu di markup, itu sebelas kesempatan untuk salah, dan
yang salah adalah yang tidak ada yang menjumlahkan ulang. Dengan `angka.mjs`
masukannya di satu tempat, hitungannya terjadi sekali, dan mengubah harga
adalah mengubah harga — bukan mengubah halaman.

Diperiksa dua arah, sama seperti tangkapan layar: penanda tanpa nilai akan
tercetak sebagai `__N_total__` di dokumen yang ditandatangani orang, dan nilai
yang tidak dipakai halaman mana pun berarti ada angka yang dipindah atau
diganti namanya dengan kembarannya tertinggal. Dua-duanya menggagalkan build.

## Tangkapan layarnya asli

Halaman tampilan memperlihatkan aplikasi yang sudah berjalan, diambil dari
build produksi lewat Chromium di 1440x900 dan 390x844, bukan gambar rancangan.
Dikecilkan ke 1020px (layar lebar) dan 470px (ponsel) lalu disimpan sebagai
JPEG mutu 84 memakai canvas Chromium sendiri, karena di lingkungan ini tidak
ada ImageMagick, sharp, atau PIL.

Tangkapan layar dashboard di `penawaran-bisnis/` diambil dari dashboard yang
membaca **Postgres lokal berisi data demo**, bukan dari data contoh di browser,
dan bukan dari database pemilik. Halaman 5 menyebutnya terang-terangan,
termasuk bahwa tarif Rp 1.550.000 yang terbaca di formulir berasal dari data
demo itu.

Dua layar sengaja **tidak** dipotret: tab Website dan layar pratinjau. Keduanya
memuat alamat email pemilik, nomor WhatsApp-nya, dan sebuah URL pratinjau
berikut tokennya. Dokumen yang dikirim ke orang lain tidak perlu membawa
satu pun dari itu.

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
menangkap halaman tangkapan layar waktu barisnya masih kelewat tinggi, dan
halaman branding waktu kedua petanya masih kelewat besar. Kalau ketemu, nomor
halaman dan alasannya disebut dan PDF-nya tidak ditulis.

Perlu dua argumen: nama folder dan tempat PDF-nya ditulis.
