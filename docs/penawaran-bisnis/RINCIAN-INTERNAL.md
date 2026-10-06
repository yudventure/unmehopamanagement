# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/penawaran-hosting-bisnis.pdf`. **Berkas ini tidak
ikut ke dalam PDF-nya dan tidak boleh ikut dikirim.** Penawaran yang
memperlihatkan marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Nama paketnya bukan "Business"

Tab-nya yang bernama **Individual & Business**; paket di dalamnya yang memuat
Node.js bernama **Unlimited Web Hosting**. `DEPLOY.md` masih menyebutnya
"Business Web Hosting" karena begitu namanya waktu dokumen itu ditulis. Yang
dipakai di penawaran ini nama yang tertulis di layarnya sekarang, supaya yang
dipesan bukan paket lain.

Yang tertulis di kartunya, 6 Oktober 2026: Node.js, **5 aplikasi web**, 50 GB
NVMe, website tanpa batas, kotak surat tanpa batas per situs gratis 1 tahun,
domain gratis 1 tahun, 15 kredit vibe coding sekali pakai.

## Harga, dan dari mana persisnya

Dari dialog durasi di layar checkout pemilik, yang menampilkan keempatnya
sekaligus:

| Durasi | Promo | Harga coret |
|---|---:|---:|
| 48 bulan, hemat 70% | Rp 38.900 / bln | Rp 129.900 / bln |
| 24 bulan, hemat 65% | Rp 44.900 / bln | Rp 129.900 / bln |
| 12 bulan, hemat 54% | Rp 59.900 / bln | Rp 129.900 / bln |
| 1 bulan | — | Rp 129.900 / bln |
| **Perpanjangan paket** | | **Rp 121.900 / bln** |

Tiga hal yang diselesaikan layar itu, dan dulu masih jadi pertanyaan:

1. **Harga coretnya sama di keempat durasi.** Jadi Rp 129.900/bln berlaku
   untuk ketiga pilihan, tidak perlu dicek per durasi lagi.
2. **Pajaknya 11%, terbukti.** Ringkasan 48 bulan: Rp 1.867.200 +
   Rp 205.392 = Rp 2.072.592, dan 205.392 ÷ 1.867.200 tepat 0,11.
3. **36 bulan tidak dijual.** Pilihannya 1, 12, 24, 48.

Yang dipakai di dokumen **harga normal Rp 129.900/bln**, atas perintah
pemilik. Konservatif dua kali: harga perpanjangan yang sebenarnya
(Rp 121.900) justru **di bawah** angka yang dianggarkan, jadi tagihan
perpanjangan nanti lebih kecil daripada yang dipakai menghitung.

## Bentuk penawarannya: hosting dikunci, pendampingan tahunan

Perintah pemilik: **tahun pertama Rp 9 juta, lanjutannya Rp 6 juta per
tahun, paket tiga tahun Rp 12 juta** — alasannya "setiap hari ada
maintenance atau ada apa apa saya juga yang pusing". Lalu dari tiga jalan
keluar yang ditawarkan, pemilik memilih yang ketiga: **pisahkan hostingnya
dari pendampingannya.**

Jadi bentuknya begini, dan pembagiannya bukan soal selera:

| | Dikunci di muka? | Kenapa |
|---|---|---|
| Hosting, email, domain | **Ya**, seluruh masa paket | Memang dibeli sekaligus di depan ke Hostinger |
| Pengerjaan | **Ya**, sekali | Memang sekali kerja |
| Pendampingan | **Tidak**, ditagih per tahun | Pekerjaan tahun berjalan |

Mengunci tiga tahun pendampingan di harga satu tahun berarti menjanjikan 36
bulan kesiapsiagaan dengan bayaran yang tidak sepadan. Versi sebelum ini
melakukan persis itu, dan angkanya jatuh ke Rp 133 ribu per bulan.

| | A · 1 tahun | B · 2 tahun | C · 3 tahun |
|---|---:|---:|---:|
| Ke Hostinger, seluruh masa | Rp 1.985.319 | Rp 4.588.576 | Rp 7.191.832 |
| Pengerjaan + pendampingan thn 1 | Rp 7.014.681 | Rp 5.911.424 | Rp 4.808.168 |
| **Dibayar di muka** | **Rp 9.000.000** | **Rp 10.500.000** | **Rp 12.000.000** |
| Uang muka 70% / sisa 30% | 6.300.000 / 2.700.000 | 7.350.000 / 3.150.000 | 8.400.000 / 3.600.000 |
| Pendampingan tahun berikutnya | — | 1× Rp 3.503.304 | 2× Rp 3.503.304 |
| **Jumlah selama masa paket** | **Rp 9.000.000** | **Rp 14.003.304** | **Rp 19.006.608** |
| Biaya per tahun | Rp 9.000.000 | Rp 7.001.652 | Rp 6.335.536 |
| Kalau tanpa mengunci | Rp 9.000.000 | Rp 15.000.000 | Rp 21.000.000 |
| Hemat buat klien | — | Rp 996.696 | Rp 1.993.392 |
| Biaya lanjutan penuh mulai | tahun ke-2 | tahun ke-3 | tahun ke-4 |

Biaya per tahun tetap menurun dari A ke C, jadi C tetap pilihan yang paling
masuk akal — tapi sekarang potongannya wajar, bukan bagi-bagi.

**Rp 10,5 juta untuk 2 tahun adalah titik tengah yang saya isi sendiri**,
bukan angka pemilik. Pemilik baru menyebut 9 juta dan 12 juta. Ubah di
`PERIODE[1].harga`.

## Biaya lanjutan Rp 6 juta per tahun, dibuka

| Pos | | Per tahun |
|---|---:|---:|
| Paket Unlimited, harga perpanjangan | Rp 121.900 / bln | Rp 1.462.800 |
| Kotak surat email | Rp 28.900 / bln | Rp 346.800 |
| Dua nama domain | Rp 209.900 / thn | Rp 419.800 |
| Biaya ICANN | Rp 9.938 × 2 | Rp 19.876 |
| Pajak 11% | | Rp 247.420 |
| **Ke Hostinger** | | **Rp 2.496.696** |
| **Pendampingan** | **Rp 291.942 / bln** | **Rp 3.503.304** |
| **Jumlah** | | **Rp 6.000.000** |

**Rp 3.503.304 itu satu angka yang dipakai di dua tempat**, dan di
`angka.mjs` ia memang satu konstanta (`DAMPING`): tarif tahun berjalan di
dalam masa paket, dan bagian pendampingan di biaya lanjutan. Bedanya cuma
hostingnya — di dalam masa paket hostingnya sudah dibayar, jadi tidak
ditagih lagi.

## Berapa yang benar-benar masuk ke pengerja

| | Jasa selama masanya | Per bulan |
|---|---:|---:|
| A · 1 tahun | Rp 7.014.681 | Rp 584.557 |
| B · 2 tahun | Rp 9.414.728 | Rp 392.280 |
| C · 3 tahun | Rp 11.814.776 | Rp 328.188 |
| Klien bayar tahunan, 3 thn | Rp 14.021.289 | Rp 389.480 |

C masih di bawah jalur tahunan, **tapi selisihnya tinggal Rp 2.206.513**
untuk tiga tahun, bukan Rp 9,2 juta seperti versi sebelumnya. Rp 328 ribu
per bulan untuk kesiapsiagaan harian masih bisa dipertahankan, dan itu
harga yang dibayar untuk mendapat klien yang terkunci tiga tahun.

Kalau mau lebih rapat lagi, yang dinaikkan **harga di muka pilihan C**, bukan
tarif pendampingannya — tarif itu dipakai di dua tempat dan menaikkannya
ikut menaikkan biaya lanjutan yang sudah disebut Rp 6 juta ke pemilik.

## Pendampingan itu janji kerja

Baris pendampingan di halaman 12, 13, dan 14 bukan hiasan harga. Isinya, apa
adanya: situs tidak menjawab, dashboard error, email tidak sampai —
ditangani; pembaruan keamanan paket dan versi Node; pemulihan dari cadangan;
satu pemeriksaan menyeluruh tiap tahun berikut laporan tertulis; dan
perpanjangan diingatkan serta dibantu.

Kalau itu tidak akan dikerjakan, harga ini tidak boleh dipakai seperti ini.

Satu hal yang justru jadi lebih baik dengan pemisahan ini: **pendampingan
boleh tidak diperpanjang**, oleh kedua pihak. Klien yang merasa tidak perlu
bisa berhenti di tahun kedua; pengerja yang kewalahan bisa tidak
menawarkannya lagi. Yang tidak bisa dilepas cuma tagihan Hostinger-nya, dan
itu memang bukan tagihan pengerja.

## Selisih promo, dan apa yang dijanjikan soal itu

Promo yang sedang berjalan, dari layar yang sama:

| Durasi | Normal | Promo | Selisih sebelum pajak |
|---|---:|---:|---:|
| 12 bulan | Rp 1.558.800 | Rp 718.800 | Rp 840.000 |
| 24 bulan | Rp 3.117.600 | Rp 1.077.600 | Rp 2.040.000 |
| 36 bulan (24+12) | Rp 4.676.400 | Rp 1.796.400 | Rp 2.880.000 |

**Dokumennya menyerahkan selisih itu ke klien.** Halaman 13 menyatakannya:
selisihnya milik pemilik, kuitansi Hostinger diserahkan apa adanya. Jadi
yang jadi penghasilan pengerja tetap baris pengerjaan dan pendampingan saja
— dan kalau promonya berlaku, potongannya mengurangi tagihan klien, bukan
menambah margin.

Alasannya praktis, bukan moral saja:

1. Kuitansi Hostinger dijanjikan di halaman 12 dan 16. Menagih Rp 1,99 juta
   untuk sisi Hostinger lalu menyerahkan kuitansi Rp 0,9 juta bukan margin,
   itu ketahuan di menit pertama serah terima.
2. Diskonnya dipasang 54–70% di layar depan Hostinger; siapa pun bisa
   mengeceknya dalam sepuluh detik.
3. Harga normal tetap dasar anggaran yang benar untuk perpanjangan.

**Kalau memang mau selisihnya ditahan**, kartunya harus diganti dan janji
kuitansi di halaman 12 dan 16 dicabut. Bilang saja, nanti diubah. Yang tidak
boleh adalah dokumen yang menjanjikan satu hal sementara tagihannya berkata
lain.

## Lingkup pengerjaan, dan apa yang hilang dari penawaran VPS

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
pemantauan dan serah terima. Tiga hari kerja.

**Kalau angkanya mau diubah**, ubah `PERIODE[].harga` atau `LANJUT` di
`angka.mjs`; totalnya, per tahunnya, uang mukanya, sisanya, pembanding
tahunannya, dan hematnya ikut sendiri.

## Yang perlu dijaga supaya untungnya tidak tergerus

- **Lingkupnya berhenti di hosting dan dua alamat.** Menyimpan perubahan
  booking, akun per orang, dan sinkronisasi iCal ada di halaman 15 sebagai
  "tidak termasuk".
- **Foto dan isi Eddo Homestay urusan pemilik.**
- **Optimasi foto Turtle tidak termasuk**, dan disebut di halaman 15 berikut
  angkanya (4,66 MB turun ke kisaran 1,63 MB).
- **Pendampingan bukan pengembangan.** Ia menjaga yang sudah ada tetap
  jalan; fitur baru dihitung terpisah, dan halaman 12 mengatakannya.
- **Sesudah masa paketnya habis**, pendampingan masuk ke biaya lanjutan
  Rp 6 juta per tahun dan boleh tidak diambil — halaman 14 menjelaskan apa
  yang hilang kalau tidak.

## Dua hal yang masih harus dicek sebelum dokumennya dikirim

Daftar ini dulu empat; dialog durasi di layar checkout menyelesaikan dua di
antaranya (harga coret per durasi, dan ketersediaan masa 36 bulan).

1. **Apakah hadiahnya berlaku di masa 12 bulan.** Domain gratis 1 tahun dan
   kotak surat gratis 1 tahun terbaca di kartu paketnya, tapi kartu itu
   terbuka pada 48 bulan. Keduanya ikut dihitung di kolom A; kalau ternyata
   cuma untuk masa panjang, kolom A naik sekitar Rp 556 ribu sebelum pajak.
2. **Status `turtlehomestay.com`.** `eddohomestay.com` sudah terdaftar dan
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
