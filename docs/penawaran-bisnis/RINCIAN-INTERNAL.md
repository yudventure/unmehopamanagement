# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/penawaran-hosting-bisnis.pdf`. **Berkas ini tidak
ikut ke dalam PDF-nya dan tidak boleh ikut dikirim.** Penawaran yang
memperlihatkan marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Nama paketnya bukan "Business"

Tab-nya yang bernama **Individual & Business**; paket di dalamnya yang memuat
Node.js bernama **Unlimited**. `DEPLOY.md` masih menyebutnya "Business Web
Hosting" karena begitu namanya waktu dokumen itu ditulis. Yang dipakai di
penawaran ini nama yang tertulis di kartunya sekarang, supaya yang dipesan
bukan paket lain.

Yang tertulis di kartunya, 6 Oktober 2026: Node.js, **5 aplikasi web**, 50 GB
NVMe, website tanpa batas, kotak surat tanpa batas per situs gratis 1 tahun,
domain gratis 1 tahun, 15 kredit vibe coding sekali pakai.

## Harga, dan dari mana persisnya

Dari kartu **48 bulan** di layar checkout pemilik, 6 Oktober 2026:

> Paket 48 bln mulai **Rp1.867.200** (harga normal **Rp6.235.200**).
> Biaya perpanjangan **Rp121.900/bln**.

| | per bulan | sumber |
|---|---:|---|
| Harga normal | **Rp 129.900** | Rp 6.235.200 ÷ 48 |
| Harga promo (diskon 70%) | Rp 38.900 | Rp 1.867.200 ÷ 48 |
| Harga perpanjangan | Rp 121.900 | tertulis langsung di kartu |

Yang dipakai di dokumen **harga normal Rp 129.900/bln**, atas perintah
pemilik. Itu konservatif dua kali: harga perpanjangan yang sebenarnya
(Rp 121.900) justru **di bawah** angka yang dianggarkan, jadi tagihan
perpanjangan nanti lebih kecil daripada yang dihitung di sini.

## Dua pilihan yang ditawarkan

| | A · 1 tahun | B · 3 tahun |
|---|---:|---:|
| Paket Unlimited | Rp 1.558.800 | Rp 4.676.400 |
| Kotak surat email | gratis (tahun pertama dari paket) | Rp 693.600 (24 bln) |
| Dua nama domain | Rp 209.900 | Rp 1.049.500 |
| Biaya ICANN | Rp 19.876 | Rp 59.628 |
| Pajak 11% | Rp 196.743 | Rp 712.704 |
| **Ke Hostinger** | **Rp 1.985.319** | **Rp 7.191.832** |
| Jasa pengerjaan | Rp 2.250.000 | Rp 2.250.000 |
| **Total ke klien** | **Rp 4.235.319** | **Rp 9.441.832** |
| Uang muka | Rp 3.110.319 | Rp 8.316.832 |
| Sisa saat serah terima | Rp 1.125.000 | Rp 1.125.000 |

Dua hadiah paketnya ikut dihitung, bukan diabaikan: **kotak surat gratis 12
bulan** dan **satu nama domain gratis 1 tahun**. Keduanya cuma berlaku di
tahun pertama, jadi pilihan A menikmatinya penuh sementara pilihan B
membaginya ke tiga tahun — itu sebabnya **A lebih murah per tahun**
(Rp 1.985.319 lawan Rp 2.397.277 di sisi Hostinger). Halaman 13 mengatakan itu
terang-terangan, dan itu disengaja: klien yang belakangan menghitung sendiri
lalu merasa dibohongi jauh lebih mahal daripada satu paragraf jujur.

Yang dibeli dengan pilihan B bukan penghematan, melainkan harga yang dikunci
dan dua tagihan perpanjangan yang tidak perlu diingat. Jangan jual B sebagai
"lebih hemat".

## Perpanjangan, per tahun, sesudah masa paketnya habis

| Pos | | Per tahun |
|---|---:|---:|
| Paket Unlimited | Rp 121.900 / bln | Rp 1.462.800 |
| Kotak surat email | Rp 28.900 / bln | Rp 346.800 |
| Dua nama domain | Rp 209.900 / thn | Rp 419.800 |
| Biaya ICANN | Rp 9.938 × 2 | Rp 19.876 |
| Pajak 11% | | Rp 247.420 |
| **Jumlah** | | **Rp 2.496.696** |

## Selisih promo, dan apa yang dijanjikan soal itu

Di masa 48 bulan selisihnya besar sekali: normal Rp 6.235.200 lawan promo
Rp 1.867.200, yaitu **Rp 4.368.000 sebelum pajak**, diskon 70%. Untuk masa 12
dan 36 bulan angkanya belum dibaca dari kartunya masing-masing, tapi polanya
jelas: yang benar-benar keluar jauh lebih kecil daripada yang ditagih.

**Dokumennya menyelesaikan itu dengan menyerahkan selisihnya ke klien.**
Halaman 13 punya kartu "Kalau promonya masih berlaku saat dipesan": selisihnya
jadi milik pemilik, kuitansi Hostinger diserahkan apa adanya. Jadi untung
tetap **Rp 2.250.000**, yaitu jasanya saja.

Alasannya praktis, bukan moral saja:

1. Kuitansi Hostinger dijanjikan di halaman 12 dan 16. Menagih Rp 1,99 juta
   untuk sisi Hostinger lalu menyerahkan kuitansi yang jauh lebih kecil bukan
   margin, itu ketahuan di menit pertama serah terima.
2. Harga Hostinger bisa dicek siapa pun dalam sepuluh detik, dan diskonnya
   dipasang 70% di layar depan.
3. Harga normal tetap dasar anggaran yang benar untuk perpanjangan.

**Kalau memang mau selisihnya ditahan**, kartunya harus diganti dan janji
kuitansi di halaman 12 dan 16 dicabut. Bilang saja, nanti diubah. Yang tidak
boleh adalah dokumen yang menjanjikan satu hal sementara tagihannya berkata
lain.

## Jasa Rp 2.250.000

Tarifnya sama dengan `penawaran/`: **Rp 750.000 per hari**. Yang berubah
jumlah harinya, empat jadi tiga, dan alasannya bisa disebutkan satu per satu.

Hilang dari lingkup empat hari yang lama:

- **Memesan dan mengamankan VPS** — sistem operasi, kunci SSH, firewall,
  pembaruan otomatis. Di paket terkelola, penyedianya yang mengerjakan.
- **Memasang Coolify** — rantai deploy sudah ada dan sudah berjalan lewat
  GitHub Actions.
- **Memasang PostgreSQL di server** — databasenya terkelola dan sudah berdiri.
- **Satu nama domain** — tiga jadi dua.

Tetap ada, dan jadi enam bagian di halaman 12: paket dan dua domain; aplikasi
Node dan pemisahan domainnya; email berikut MX, SPF, DKIM; menyambungkan
rantai deploy; menyambungkan database berikut cadangan dan uji pulih;
pemantauan dan serah terima.

**Kalau mau dinaikkan**, naikkan nilai per bagian, jangan tambah pos baru.

| Kalau dinaikkan ke | Per hari | Total A | Total B |
|---|---:|---:|---:|
| Rp 2.250.000 | Rp 750 rb | Rp 4.235.319 | Rp 9.441.832 |
| Rp 3.000.000 | Rp 1 jt | Rp 4.985.319 | Rp 10.191.832 |
| Rp 3.750.000 | Rp 1,25 jt | Rp 5.735.319 | Rp 10.941.832 |

Catatan: di pilihan A, jasa adalah **lebih dari separuh** total yang dilihat
klien, beda sekali dengan `penawaran/` yang Rp 16 juta-nya didominasi biaya
VPS. Menaikkan jasa di sini terasa langsung. Kalau klien menawar, yang lebih
aman ditawarkan bukan potongan jasa melainkan pilihan A alih-alih B.

## Yang perlu dijaga supaya untungnya tidak tergerus

- **Lingkupnya berhenti di hosting dan dua alamat.** Menyimpan perubahan
  booking, akun per orang, dan sinkronisasi iCal ada di halaman 15 sebagai
  "tidak termasuk".
- **Foto dan isi Eddo Homestay urusan pemilik.**
- **Optimasi foto Turtle tidak termasuk**, dan disebut di halaman 15 berikut
  angkanya (4,66 MB turun ke kisaran 1,63 MB).
- **Garansi 14 hari sengaja sempit**: hanya kerusakan dari pekerjaan ini.
- **Perawatan bulanan tidak dijanjikan apa pun.**

## Empat hal yang harus dicek sebelum dokumennya dikirim

1. **Harga normal di kartu 12 bulan.** Rp 129.900/bln itu harga coret di kartu
   **48 bulan**. Hostinger memasang harga coret yang berbeda untuk tiap masa
   paket, dan masa yang lebih pendek biasanya lebih mahal per bulan. Buka
   kartu 12 bulan, baca harga coretnya, lalu ubah satu baris:
   `PERIODE[0].perBulan` di `angka.mjs`. Kalau tidak dicek, kolom pilihan A
   bisa terlalu murah.
2. **Apakah masa 36 bulan memang ada.** Di layar yang terpotret pilihannya ada
   empat dan yang terbuka 48 bulan. Kalau 36 bulan tidak ada di daftarnya,
   putuskan dulu: tawarkan 48 bulan sebagai pilihan B, atau beli 24 + 12.
   Jangan diamkan — dokumennya menjanjikan "3 tahun".
3. **Apakah hadiahnya berlaku di masa 12 bulan.** Domain gratis 1 tahun dan
   kotak surat gratis 1 tahun terbaca di kartu 48 bulan. Keduanya ikut
   dihitung di kolom A; kalau ternyata cuma untuk masa panjang, kolom A naik
   sekitar Rp 556 ribu sebelum pajak.
4. **Status `turtlehomestay.com`.** `eddohomestay.com` sudah terdaftar dan
   sudah dipakai — `scripts/package.mjs` menyebutnya domain aktif saat
   mengemas. Nama satunya belum dipastikan; kalau sudah terdaftar, barisnya
   jadi perpanjangan, dan domain gratis dari paket tidak terpakai.

## Kenapa ada halaman branding Dampier

Diminta pemilik, dan kebetulan itu halaman terkuat di dokumen ini: ia
satu-satunya yang memperlihatkan kerja yang tidak bisa ditiru dengan template.
Petanya digambar dari data batas desa dan gazetir pulau nasional, dan
generatornya menolak menulis berkasnya kalau nama pulaunya tidak cocok dengan
daftar resmi — aturan yang sudah sekali menangkap kekeliruan nyata (Friwen
yang ternyata Pulau Kurai).

Peta Selat Dampier sendiri **belum dipasang di halaman mana pun** atas
keputusan pemilik. Halaman 7 mengatakan itu apa adanya. Jangan ubah
kalimatnya jadi seolah-olah sudah tayang.
