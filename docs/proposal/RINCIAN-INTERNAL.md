# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/proposal-harga-deploy.pdf`. **Berkas ini tidak ikut
ke dalam PDF-nya dan tidak boleh ikut dikirim.** Proposal yang memperlihatkan
marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Dari mana Rp 3.000.000 itu datang

| Pos | Masuk | Keluar |
|---|---:|---:|
| Jasa pengerjaan | Rp 3.000.000 | — |
| Server Hostinger 12 bulan (Paket A) | Rp 2.170.800 | Rp 2.170.800 |
| **Untung bersih** | | **Rp 3.000.000** |

Servernya **diteruskan apa adanya**, tidak di-markup, dan proposalnya bilang
begitu terang-terangan lengkap dengan janji menyerahkan kuitansi Hostinger.
Itu keputusan yang disengaja, bukan kelupaan:

1. Harga Hostinger bisa dicek siapa pun dalam sepuluh detik. Markup di pos yang
   segampang itu diperiksa cuma merusak kepercayaan pada angka yang lain.
2. Harga perpanjangan Hostinger belum pasti (lihat `docs/pitch/README.md`).
   Menaruh margin di pos yang harganya bisa bergerak berarti margin yang bisa
   ikut bergerak. Margin duduk di jasa, yang harganya kita sendiri yang tentukan.
3. Paket B jadi masuk akal karena ini. Kalau kliennya beli server sendiri,
   untungnya **tetap Rp 3.000.000**, tidak berubah sepeser pun.

## Apakah Rp 3.000.000 itu wajar

Lingkupnya kira-kira **tiga sampai empat hari kerja** untuk orang yang sudah
paham: pesan dan amankan VPS, Coolify, dua domain plus TLS, deploy dan
pemisahan domain, PostgreSQL, cadangan ke luar server berikut uji pulih,
pemantauan, lalu serah terima berikut dokumennya.

Itu sekitar **Rp 750 ribu sampai Rp 1 juta per hari**. Untuk pekerjaan
infrastruktur di Indonesia, itu wajar sampai agak murah. Kalau mau dinaikkan,
naikkan **nilai per bagian di halaman 2**, jangan menambah pos baru: enam
bagian yang masing-masing punya hasil yang bisa dicek jauh lebih mudah
dipertahankan daripada satu angka gelondongan.

Ruang naik yang masih aman, kalau memang diperlukan:

| Kalau dinaikkan ke | Per hari | Kesannya |
|---|---:|---|
| Rp 3.000.000 | ± Rp 850 rb | sekarang, aman |
| Rp 4.000.000 | ± Rp 1,1 jt | masih wajar, perlu lingkupnya dibaca |
| Rp 5.000.000 | ± Rp 1,4 jt | mulai perlu portofolio atau SLA |

## Yang perlu dijaga supaya untungnya tidak tergerus

- **Lingkupnya berhenti di deploy.** Database dan autentikasi ada di halaman 4
  sebagai "tidak termasuk". Kalau itu ikut dikerjakan tanpa penawaran baru,
  tiga juta itu habis di hari pertama tahap berikutnya.
- **Garansi 14 hari sengaja sempit**: hanya kerusakan yang datang dari
  pekerjaan ini. Permintaan yang mengubah lingkup dan gangguan dari sisi
  Hostinger dikecualikan secara tertulis.
- **Perawatan bulanan tidak dijanjikan apa pun.** Pemantauan dan cadangan
  dipasang lalu berjalan sendiri. Kalau kliennya mau ada yang berjaga, itu
  kesepakatan baru dengan angka baru.
- **Nama domain tidak ditalangi.** Harga registrar berbeda-beda dan tidak
  terverifikasi, jadi menalanginya berarti menanggung selisih yang tidak
  diketahui.

## Kalau kliennya minta turun harga

Jangan potong nilai jasanya. Pindahkan ke **Paket B**: klien beli server
sendiri, angkanya turun dari Rp 5.170.800 ke Rp 3.000.000, terlihat seperti
turun 42%, dan untungnya tidak berkurang sama sekali.
