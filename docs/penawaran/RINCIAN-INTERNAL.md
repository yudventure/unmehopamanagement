# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/spesifikasi-dan-penawaran.pdf`. **Berkas ini tidak
ikut ke dalam PDF-nya dan tidak boleh ikut dikirim.** Penawaran yang
memperlihatkan marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Dari mana Rp 3.000.000 itu datang

| Pos | Masuk | Keluar |
|---|---:|---:|
| Jasa pengerjaan | Rp 3.000.000 | — |
| Hostinger tahun pertama, diteruskan apa adanya | Rp 3.806.856 | Rp 3.806.856 |
| **Total ke klien** | **Rp 6.806.856** | |
| **Untung bersih** | | **Rp 3.000.000** |

Rincian sisi Hostinger-nya, semuanya disalin dari keranjang belanja:

| Pos | Per bulan | Dibayar |
|---|---:|---:|
| KVM 2, 12 bulan | Rp 180.900 | Rp 2.170.800 |
| Backup harian otomatis, 12 bulan | Rp 104.900 | Rp 1.258.800 |
| Nama domain pertama, 1 tahun | gratis | Rp 0 |
| Proteksi privasi WHOIS | gratis | Rp 0 |
| Pajak 11% | | Rp 377.256 |
| **Jumlah** | | **Rp 3.806.856** |

Angka terakhir itu sama persis dengan total di keranjang, jadi kalau nanti
keranjangnya berubah, yang perlu dicocokkan cuma satu angka ini.

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

Uang muka Rp 5.306.856 = seluruh biaya Hostinger (Rp 3.806.856) + separuh jasa
(Rp 1.500.000). Artinya **tidak ada uang sendiri yang ditalangi**: Hostinger
menagih penuh di depan, dan uang mukanya sudah menutup itu sebelum ada tagihan
yang jatuh. Sisa Rp 1.500.000 masuk saat serah terima.

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
| Rp 3.000.000 | Rp 750 rb | Rp 6.806.856 | sekarang, aman |
| Rp 4.000.000 | Rp 1 jt | Rp 7.806.856 | masih wajar, perlu lingkupnya dibaca |
| Rp 5.000.000 | Rp 1,25 jt | Rp 8.806.856 | mulai perlu portofolio atau SLA |

Perhatikan bahwa angka yang dilihat klien sudah Rp 6,8 juta karena biaya
Hostinger-nya ikut di dalam satu total. Menaikkan jasa ke Rp 5 juta membuat
totalnya menembus Rp 8,8 juta, dan di angka segitu wajar kalau klien mulai
minta perbandingan. Naiknya pelan-pelan saja.

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
- **Nama domain kedua tidak ditalangi.** Harga registrar berbeda-beda, jadi
  menalanginya berarti menanggung selisih yang tidak diketahui. Yang tertera di
  dokumen (Rp 1.113.900) itu harga daftar di keranjang Hostinger, disebut
  sebagai gambaran, bukan sebagai harga yang kita janjikan.

## Kalau kliennya minta turun harga

Jangan potong nilai jasanya. Yang bisa ditawarkan tanpa mengurangi untung:

1. **Klien beli servernya sendiri.** Angka yang dilihat turun dari Rp 6.806.856
   ke Rp 3.000.000, terlihat seperti turun 56%, dan untungnya utuh. Konsekuensinya
   kuitansi dan akun Hostinger jadi urusan klien, dan itu memang lebih rapi.
2. **Backup harian dimatikan.** Menghemat Rp 1.258.800 setahun plus pajaknya.
   Cadangan database ke luar Hostinger tetap dipasang, jadi bukan berarti tidak
   ada cadangan sama sekali. Ini pengurangan yang jujur, bukan pemotongan mutu.

Yang **jangan** ditawarkan: memangkas bagian 5 (cadangan berikut uji pulih)
atau bagian 6 (pemantauan dan serah terima). Dua bagian itu yang membedakan
deploy yang selesai dari deploy yang cuma jalan hari itu.

## Catatan koreksi harga perpanjangan

Versi dokumen sebelumnya memakai perkiraan **Rp 436 rb per bulan** untuk
perpanjangan KVM 2. Angka itu **salah**, hasil menimbang sumber pihak ketiga
yang saling bertentangan karena halaman resmi Hostinger tidak bisa dibuka dari
lingkungan kerja ini.

Angka yang benar, tertulis di keranjang belanjanya sendiri, adalah
**Rp 271.900 per bulan**. Dua koreksi lain dari keranjang yang sama: lokasi
servernya **Malaysia**, bukan Singapura, dan **satu nama domain gratis untuk
tahun pertama**.

Halaman 9 sekarang memakai angka keranjang itu dan menyebut dengan jelas mana
yang pasti (harga perpanjangan server) dan mana yang perkiraan (perpanjangan
backup dan domain, yang tidak ditampilkan di keranjang). Kalau nanti dokumennya
diperbarui lagi, **ambil dari keranjang atau halaman checkout Hostinger, jangan
dari artikel pihak ketiga.**
