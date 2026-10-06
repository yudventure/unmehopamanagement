# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/penawaran-hosting-bisnis.pdf`. **Berkas ini tidak
ikut ke dalam PDF-nya dan tidak boleh ikut dikirim.** Penawaran yang
memperlihatkan marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Yang berubah dari `penawaran/`, dan kenapa

| | `penawaran/` (17 Agu 2026) | dokumen ini (6 Okt 2026) |
|---|---|---|
| Tempat menjalankannya | VPS KVM 2, tidak terkelola | Business Web Hosting, terkelola |
| Nama domain | tiga | **dua** |
| Database | dipasang sendiri di VPS | PostgreSQL terkelola, di luar paket, sudah berjalan |
| Dashboard | masih data contoh di browser | **membaca database sungguhan** |
| Deploy | Coolify, dipasang sebagai bagian pekerjaan | GitHub Actions, **sudah berjalan** |
| Jasa | Rp 3.000.000, empat hari | **Rp 2.250.000, tiga hari** |

Dua perintah dari pemilik: **paket hosting bisnis**, dan **dua domain
(Turtle dan Eddo)**, bukan tiga. Domain dashboard dilepas karena dashboard-nya
sudah tinggal di `eddohomestay.com/kelola`.

## Harga paket Bisnis belum ada, dan itu disengaja

`angka.mjs` menulis `BISNIS.perBulan = null`. Harganya tidak tertulis di mana
pun di repositori ini, jaringan keluar dari lingkungan kerja ini diblokir, dan
`docs/README.md` melarang mengambil harga Hostinger dari artikel pihak ketiga
— versi lama dokumen yang satu lagi pernah memakai perkiraan semacam itu dan
angkanya meleset jauh.

Jadi: **buka keranjang atau halaman checkout Hostinger, catat harga coretnya
dan harga bayarnya, lalu isi satu baris di `angka.mjs`.** Harga coret yang
masuk ke dokumen, harga bayar yang masuk ke tabel selisih di bawah.

Selama `null`, dokumennya mencetak pita draf dan isian kosong, jadi tidak ada
cara mengirimnya tanpa sadar.

## Angka yang sudah pasti

| Pos | Harga normal | 24 bulan | Dari mana |
|---|---:|---:|---|
| Business Web Hosting | **belum diisi** | **belum diisi** | keranjang Hostinger |
| Email profesional, 1 kotak surat | Rp 28.900 / bln | Rp 693.600 | keranjang, sama dengan `penawaran/` |
| Dua nama domain, 2 tahun | Rp 209.900 / thn | Rp 839.600 | keranjang, sama dengan `penawaran/` |
| Biaya ICANN, 2 domain × 2 thn | Rp 9.938 | Rp 39.752 | keranjang |
| Pajak 11% | | atas jumlah di atas | layar checkout |
| Jasa pengerjaan | | Rp 2.250.000 | 3 hari × Rp 750 rb |

Sisa saat serah terima **Rp 1.125.000**, yaitu separuh jasa. Uang mukanya
seluruh biaya hosting ditambah separuh jasa, dan angkanya baru ada begitu
harga paketnya diisi.

## Kenapa jasanya turun dari Rp 3.000.000 ke Rp 2.250.000

Tarifnya tidak berubah: tetap **Rp 750.000 per hari**, sama dengan yang
dipakai `penawaran/`. Yang berubah jumlah harinya, dan alasannya bisa
disebutkan satu per satu — ini yang membuat angkanya bisa dipertahankan kalau
ditanya.

Yang hilang dari lingkup empat hari yang lama:

- **Memesan dan mengamankan VPS** — sistem operasi, kunci SSH, firewall,
  pembaruan keamanan otomatis. Di paket terkelola, penyedianya yang
  mengerjakan.
- **Memasang Coolify** — rantai deploy-nya sudah ada dan sudah berjalan lewat
  GitHub Actions.
- **Memasang PostgreSQL di server** — databasenya terkelola dan sudah berdiri.
- **Satu nama domain** — tiga jadi dua.

Yang tetap ada, dan jadi enam bagian di halaman 12: paket dan dua domain;
aplikasi Node dan pemisahan domainnya; email berikut MX, SPF, DKIM;
menyambungkan rantai deploy ke paket ini; menyambungkan database berikut
cadangan dan uji pulih; pemantauan dan serah terima.

**Kalau mau dinaikkan**, naikkan nilai per bagian, jangan tambah pos baru.
Enam bagian yang masing-masing punya hasil yang bisa dicek jauh lebih mudah
dipertahankan daripada satu angka gelondongan.

| Kalau dinaikkan ke | Per hari |
|---|---:|
| Rp 2.250.000 | Rp 750 rb |
| Rp 3.000.000 | Rp 1 jt |
| Rp 3.750.000 | Rp 1,25 jt |

Catatan jujur ke diri sendiri: total yang dilihat klien di dokumen ini
kemungkinan besar **jauh lebih kecil** daripada Rp 16 juta di `penawaran/`,
karena paket bersama jauh lebih murah daripada VPS 24 bulan. Jadi kenaikan
jasa di sini lebih terasa di persentase total daripada di dokumen yang satu
lagi. Pertimbangkan itu sebelum menurunkannya lagi.

## Selisih promo, kalau nanti sudah tahu harganya

Isi tabel ini begitu kedua angka dari keranjang dicatat. Polanya sama dengan
`penawaran/`: yang ditagih harga normal, yang keluar harga promo, dan
**selisihnya diserahkan ke klien** lewat kartu "Kalau promonya masih berlaku
saat dipesan" di halaman 13.

| Pos | Normal | Promo sekarang | Selisih |
|---|---:|---:|---:|
| Business Web Hosting, 24 bln | belum diisi | belum diisi | |
| Email, 24 bln | Rp 693.600 | belum dicek | |
| Domain, 2 × 2 thn | Rp 839.600 | belum dicek | |

Alasannya tetap yang itu, dan tetap praktis, bukan moral saja: kuitansinya
dijanjikan di halaman 12 dan 16. Menagih satu angka lalu menyerahkan kuitansi
yang jauh lebih kecil bukan margin, itu ketahuan di menit pertama serah
terima. **Kalau memang mau selisihnya ditahan**, kartunya harus diganti dan
janji kuitansinya dicabut — bilang saja, nanti diubah. Yang tidak boleh adalah
dokumen yang menjanjikan satu hal sementara tagihannya berkata lain.

## Yang perlu dijaga supaya untungnya tidak tergerus

- **Lingkupnya berhenti di hosting dan dua alamat.** Menyimpan perubahan
  booking, akun per orang, dan sinkronisasi iCal ada di halaman 15 sebagai
  "tidak termasuk". Kalau itu ikut dikerjakan tanpa penawaran baru, jasanya
  habis di hari pertama tahap berikutnya.
- **Foto dan isi Eddo Homestay urusan pemilik.** Kalau pemilik minta kita yang
  memotret atau menulis ulang teks kamarnya, itu jam kerja di luar penawaran
  ini.
- **Optimasi foto Turtle tidak termasuk**, dan itu disebut di halaman 15
  berikut angkanya (4,66 MB turun ke kisaran 1,63 MB). Itu pos tersendiri
  kalau diminta.
- **Garansi 14 hari sengaja sempit**: hanya kerusakan yang datang dari
  pekerjaan ini.
- **Perawatan bulanan tidak dijanjikan apa pun.**

## Dua hal yang harus dicek sebelum dokumennya dikirim

1. **Harga paket Bisnis sudah diisi**, dan pita drafnya sudah hilang dari
   halaman 1, 13, dan 16. Kalau pitanya masih ada, dokumennya belum jadi.
2. **Status `turtlehomestay.com`.** `eddohomestay.com` sudah terdaftar dan
   sudah dipakai — `scripts/package.mjs` menyebutnya sebagai domain aktif saat
   mengemas. Yang belum dipastikan nama satunya: kalau sudah terdaftar,
   barisnya jadi perpanjangan; kalau belum, cek ketersediaannya sebelum
   ditandatangani, karena harga di tabel mengasumsikan nama itu bisa diambil.

## Kenapa ada halaman branding Dampier

Diminta pemilik, dan kebetulan itu halaman terkuat di dokumen ini: ia satu-
satunya yang memperlihatkan kerja yang tidak bisa ditiru dengan template.
Petanya digambar dari data batas desa dan gazetir pulau nasional, dan
generatornya menolak menulis berkasnya kalau nama pulaunya tidak cocok dengan
daftar resmi — aturan yang sudah sekali menangkap kekeliruan nyata (Friwen
yang ternyata Pulau Kurai).

Peta Selat Dampier sendiri **belum dipasang di halaman mana pun** atas
keputusan pemilik. Halaman 7 mengatakan itu apa adanya. Jangan ubah
kalimatnya jadi seolah-olah sudah tayang.
