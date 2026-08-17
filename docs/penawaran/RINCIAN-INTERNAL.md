# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/spesifikasi-dan-penawaran.pdf`. **Berkas ini tidak
ikut ke dalam PDF-nya dan tidak boleh ikut dikirim.** Penawaran yang
memperlihatkan marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Dari mana Rp 3.000.000 itu datang

| Pos | Masuk | Keluar |
|---|---:|---:|
| Jasa pengerjaan | Rp 3.000.000 | — |
| Hostinger, diteruskan apa adanya | Rp 4.511.082 | Rp 4.511.082 |
| **Total ke klien** | **Rp 7.511.082** | |
| **Untung bersih** | | **Rp 3.000.000** |

Rincian sisi Hostinger-nya, semuanya disalin dari dua keranjang belanja.

Pesanan pertama, server:

| Pos | Per bulan | Dibayar |
|---|---:|---:|
| KVM 2, 12 bulan | Rp 180.900 | Rp 2.170.800 |
| Backup harian otomatis, 12 bulan | Rp 104.900 | Rp 1.258.800 |
| Nama domain dashboard, 1 tahun | gratis | Rp 0 |
| Pajak 11% | | Rp 377.256 |
| **Jumlah** | | **Rp 3.806.856** |

Pesanan kedua, domain situs publik dan email:

| Pos | Catatan | Dibayar |
|---|---|---:|
| turtlehomestay.com, 3 tahun | daftar Rp 629.700 | Rp 529.700 |
| Biaya ICANN | pungutan wajib | Rp 9.938 |
| Email profesional, 12 bulan, 1 kotak surat | Rp 7.900/bln, daftar Rp 28.900/bln | Rp 94.800 |
| Proteksi privasi WHOIS | gratis | Rp 0 |
| Pajak 11% | | Rp 69.788 |
| **Jumlah** | | **Rp 704.226** |

Kedua angka jumlah itu sama persis dengan total di keranjangnya masing-masing,
jadi kalau nanti keranjangnya berubah, yang perlu dicocokkan cuma dua angka ini.

Servernya **diteruskan apa adanya**, tidak di-markup, dan dokumennya bilang
begitu terang-terangan lengkap dengan janji menyerahkan kuitansi Hostinger.
Itu keputusan yang disengaja, bukan kelupaan:

1. Harga Hostinger bisa dicek siapa pun dalam sepuluh detik. Markup di pos yang
   segampang itu diperiksa cuma merusak kepercayaan pada angka yang lain.
2. Harga perpanjangan tahun kedua bergerak naik cukup jauh (lihat di bawah).
   Menaruh margin di pos yang harganya bisa bergerak berarti margin yang bisa
   ikut bergerak. Margin duduk di jasa, yang harganya kita sendiri yang tentukan.
3. Kalau nanti kliennya minta beli servernya sendiri, untungnya **tetap
   Rp 3.000.000**, tidak berubah sepeser pun. Tidak ada yang perlu dihitung ulang.

## Pembayarannya sudah aman dari sisi arus kas

Uang muka Rp 6.011.082 = seluruh biaya Hostinger (Rp 4.511.082) + separuh jasa
(Rp 1.500.000). Artinya **tidak ada uang sendiri yang ditalangi**: Hostinger
menagih penuh di depan, dan uang mukanya sudah menutup itu sebelum ada tagihan
yang jatuh. Sisa Rp 1.500.000 masuk saat serah terima.

Perhatikan domainnya diambil **tiga tahun sekaligus**. Itu menaikkan uang muka
sekarang, tapi menghilangkan satu tagihan perpanjangan di tahun kedua dan
ketiga. Kalau kliennya keberatan dengan uang muka yang besar, durasi domain
boleh diturunkan ke satu tahun; itu tidak menyentuh untung sama sekali, cuma
memindahkan biaya klien ke tahun depan dengan harga per tahun yang lebih mahal.

Kalau uang mukanya ditawar turun, yang boleh turun cuma bagian jasanya. Bagian
Hostinger-nya jangan pernah dipotong dari uang muka, karena itu berarti
menalangi server orang lain dari kantong sendiri.

## Apakah Rp 3.000.000 itu wajar

Lingkupnya kira-kira **tiga sampai empat hari kerja** untuk orang yang sudah
paham: pesan dan amankan VPS, Coolify, dua domain plus TLS, deploy dan
pemisahan domain, PostgreSQL, cadangan ke luar server berikut uji pulih,
pemantauan, lalu serah terima berikut dokumennya. Dokumennya menjanjikan
**empat hari kerja**, jadi hitung empat, bukan tiga.

Itu sekitar **Rp 750 ribu per hari**. Untuk pekerjaan infrastruktur di
Indonesia, itu wajar sampai agak murah. Kalau mau dinaikkan, naikkan **nilai
per bagian di halaman 7**, jangan menambah pos baru: enam bagian yang
masing-masing punya hasil yang bisa dicek jauh lebih mudah dipertahankan
daripada satu angka gelondongan.

Ruang naik yang masih aman, kalau memang diperlukan:

| Kalau dinaikkan ke | Per hari | Total ke klien | Kesannya |
|---|---:|---:|---|
| Rp 3.000.000 | Rp 750 rb | Rp 7.511.082 | sekarang, aman |
| Rp 4.000.000 | Rp 1 jt | Rp 8.511.082 | masih wajar, perlu lingkupnya dibaca |
| Rp 5.000.000 | Rp 1,25 jt | Rp 9.511.082 | mulai perlu portofolio atau SLA |

Perhatikan bahwa angka yang dilihat klien sudah Rp 7,5 juta karena biaya
Hostinger-nya ikut di dalam satu total. Menaikkan jasa ke Rp 5 juta membuat
totalnya menembus Rp 9,5 juta, dan di angka segitu wajar kalau klien mulai
minta perbandingan. Naiknya pelan-pelan saja.

**Satu pekerjaan baru masuk tanpa menaikkan harga.** Pesanan kedua membawa
email profesional, jadi bagian 3 sekarang termasuk memasang catatan MX, SPF,
dan DKIM. Itu tambahan sekitar setengah sampai satu jam, dan sengaja diserap
karena DNS-nya memang sedang dipegang di bagian yang sama. Yang **tidak**
diserap: memindahkan email lama, membuat kotak surat kedua, dan menyusun tanda
tangan email. Ketiganya sudah ditulis di halaman 10 sebagai tidak termasuk.

## Yang perlu dijaga supaya untungnya tidak tergerus

- **Lingkupnya berhenti di deploy.** Database, sistem masuk, dan sinkronisasi
  iCal ada di halaman 10 sebagai "tidak termasuk". Kalau itu ikut dikerjakan
  tanpa penawaran baru, tiga juta itu habis di hari pertama tahap berikutnya.
- **Garansi 14 hari sengaja sempit**: hanya kerusakan yang datang dari
  pekerjaan ini. Permintaan yang mengubah lingkup, pengaturan yang diubah pihak
  lain, dan gangguan dari sisi Hostinger dikecualikan secara tertulis.
- **Perawatan bulanan tidak dijanjikan apa pun.** Pemantauan dan cadangan
  dipasang lalu berjalan sendiri. Kalau kliennya mau ada yang berjaga, itu
  kesepakatan baru dengan angka baru.
- **Pengisian konten bukan pekerjaan kita.** Nomor WhatsApp, email, enam harga
  selam, dua tahun berdiri, dan tiga tautan sosial diisi sendiri lewat tab
  Website. Kalau diminta mengisikan, itu jam kerja yang tidak ada di penawaran.
- **Harga perpanjangan domain dashboard belum diketahui.** Rp 1.113.900 itu
  harga daftar tahun pertama di keranjang pertama, dipakai sebagai perkiraan dan
  ditandai ± di halaman 9. Jangan pernah menyebutnya sebagai harga yang kita
  janjikan. Kalau nanti ternyata jauh lebih mahal, halaman 9 sudah menyiapkan
  jalan keluarnya: alamat itu cuma dipakai pemilik dan staf, jadi boleh diganti.

## Kalau kliennya minta turun harga

Jangan potong nilai jasanya. Yang bisa ditawarkan tanpa mengurangi untung:

1. **Klien beli servernya sendiri.** Angka yang dilihat turun dari Rp 7.511.082
   ke Rp 3.000.000, terlihat seperti turun 60%, dan untungnya utuh. Konsekuensinya
   kuitansi dan akun Hostinger jadi urusan klien, dan itu memang lebih rapi.
2. **Backup harian dimatikan.** Menghemat Rp 1.258.800 setahun plus pajaknya.
   Cadangan database ke luar Hostinger tetap dipasang, jadi bukan berarti tidak
   ada cadangan sama sekali. Ini pengurangan yang jujur, bukan pemotongan mutu.
3. **Domainnya diambil satu tahun, bukan tiga.** Memangkas uang muka sekitar
   Rp 390 ribu. Harga per tahunnya jadi lebih mahal, jadi ini menunda biaya,
   bukan menghematnya, dan itu harus dibilang terus terang.
4. **Email profesionalnya dilepas.** Menghemat Rp 94.800 setahun. Kecil, dan
   ini yang paling terakhir ditawarkan: alamat email berakhiran nama domain
   sendiri jauh lebih meyakinkan buat tamu daripada alamat Gmail, dan itu
   justru salah satu hal yang bikin situsnya kelihatan serius.

Yang **jangan** ditawarkan: memangkas bagian 5 (cadangan berikut uji pulih)
atau bagian 6 (pemantauan dan serah terima). Dua bagian itu yang membedakan
deploy yang selesai dari deploy yang cuma jalan hari itu.

## Catatan koreksi

Semua koreksi di bawah datang dari keranjang belanja Hostinger yang
sebenarnya. Halaman resmi Hostinger tidak bisa dibuka dari lingkungan kerja
ini, dan artikel pihak ketiga ternyata jauh meleset.

| Yang ditulis sebelumnya | Yang benar | Dari mana |
|---|---|---|
| Perpanjangan KVM 2 ± Rp 436 rb/bln | **Rp 271.900/bln** | keranjang pertama |
| Lokasi server Singapura | **Malaysia** | keranjang pertama |
| Domain kedua dibeli terpisah, di luar penawaran | **satu gratis, satu dibayar dan sudah masuk penawaran** | kedua keranjang |
| `turtledivehomestay.com` | **`turtlehomestay.com`** | keranjang kedua |
| Tidak ada email profesional | **ada, 1 kotak surat, 12 bulan** | keranjang kedua |

Nama domainnya yang paling perlu diperhatikan: sebelumnya dokumen menulis
`turtledivehomestay.com`, padahal yang benar-benar dibeli
`turtlehomestay.com`. Sekarang sudah diseragamkan di halaman 1, 3, 8, 9, dan
12. **Nama domain dashboard-nya masih `unmehopamanagement.com` dan itu belum
diverifikasi ke keranjang mana pun** — cocokkan sebelum dokumennya dikirim.

Dua harga perpanjangan sekarang tertulis pasti di keranjang, yaitu server
Rp 271.900/bln dan email Rp 19.900/bln, dan keduanya diberi tanda "harga pasti"
di halaman 9. Sisanya perkiraan dan ditandai ±. Kalau nanti dokumennya
diperbarui lagi, **ambil dari keranjang atau halaman checkout Hostinger, jangan
dari artikel pihak ketiga.**
