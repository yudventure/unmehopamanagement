# Rincian internal — jangan dikirim ke klien

Perhitungan di balik `docs/spesifikasi-dan-penawaran.pdf`. **Berkas ini tidak
ikut ke dalam PDF-nya dan tidak boleh ikut dikirim.** Penawaran yang
memperlihatkan marginnya sendiri mengundang tawar-menawar di angka yang salah.

## Yang berubah di versi ini, dan kenapa

Dua perintah: pakai **harga normal, bukan harga promo**, dan **tiga nama
domain**, bukan dua. Keduanya mengubah hampir semua angka di halaman 12 dan 13.

## Angka yang ditawarkan

| Pos | Harga normal | 24 bulan |
|---|---:|---:|
| KVM 2 | Rp 407.900 / bln | Rp 9.789.600 |
| Email profesional, 1 kotak surat | Rp 28.900 / bln | Rp 693.600 |
| turtlehomestay.com | Rp 209.900 / thn | Rp 419.800 |
| unmehoppa.com | Rp 209.900 / thn | Rp 419.800 |
| Domain Eddo Homestay | Rp 209.900 / thn | Rp 419.800 |
| Biaya ICANN, tiga domain | Rp 9.938 | Rp 29.814 |
| Pajak 11% | | Rp 1.294.966 |
| **Ke Hostinger** | | **Rp 13.067.380** |
| Jasa pengerjaan | | Rp 3.000.000 |
| **Total ke klien** | | **Rp 16.067.380** |

Uang muka Rp 14.567.380 (seluruh Hostinger + separuh jasa), sisa Rp 1.500.000
saat serah terima.

Semua harga normal di atas diambil dari coretan di layar Hostinger sendiri:
KVM 2 Rp 407.900/bln tertulis sebagai harga coret di ketiga pilihan durasi,
email Rp 693.600 per 24 bulan, dan domain Rp 419.800 per 2 tahun yang cocok
dengan Rp 209.900/thn yang disebut sebagai harga perpanjangan.

## Ini yang paling penting dan harus dibaca sampai habis

Harga promo yang sedang berlaku jauh lebih murah daripada harga normal:

| Pos | Normal | Promo sekarang | Selisih |
|---|---:|---:|---:|
| KVM 2, 24 bln | Rp 9.789.600 | Rp 3.741.600 | Rp 6.048.000 |
| Email, 24 bln | Rp 693.600 | Rp 165.600 | Rp 528.000 |
| Domain, 3 × 2 thn | Rp 1.259.400 | Rp 1.019.400 | Rp 240.000 |
| Pajak 11% atas selisih | | | Rp 749.760 |
| **Total selisih** | | | **Rp 7.565.760** |

Artinya: klien ditagih **Rp 13.067.380** untuk sisi Hostinger, sedangkan kalau
dipesan hari ini yang benar-benar keluar cuma **Rp 5.501.620**.

**Dokumennya menyelesaikan itu dengan menyerahkan selisihnya ke klien.**
Halaman 12 punya kartu berjudul "Kalau promonya masih berlaku saat dipesan"
yang berbunyi: selisihnya jadi milik pemilik, dan kuitansi Hostinger diserahkan
apa adanya. Jadi untung tetap **Rp 3.000.000**, yaitu jasanya saja.

Itu keputusan yang disengaja, dan alasannya praktis, bukan moral saja:

1. Kuitansi Hostinger tetap dijanjikan di halaman 11 dan 16. Menagih
   Rp 13 juta lalu menyerahkan kuitansi Rp 5,5 juta bukan margin, itu ketahuan
   di menit pertama serah terima.
2. Harga Hostinger bisa dicek siapa pun dalam sepuluh detik. Selisih 2,4 kali
   lipat di pos yang segampang itu diperiksa merusak kepercayaan pada setiap
   angka lain di dokumen, termasuk yang jujur.
3. Harga normal tetap jadi dasar anggaran yang benar. Itu yang dibayar di
   September 2028 kalau promonya sudah tidak ada, dan itu memang gunanya.

**Kalau memang mau selisihnya ditahan sebagai margin**, jangan cuma diamkan
dokumennya: kartu di halaman 12 harus diganti dan janji kuitansi di halaman 11
dan 16 harus dicabut. Bilang saja, nanti diubah. Yang tidak boleh adalah
membiarkan dokumennya menjanjikan satu hal sementara tagihannya berkata lain.

## Apakah Rp 3.000.000 itu wajar

Lingkupnya kira-kira **empat hari kerja** untuk orang yang sudah paham: pesan
dan amankan VPS, Coolify, tiga domain plus TLS, deploy dan pemisahan domain,
PostgreSQL, cadangan ke luar server berikut uji pulih, pemantauan, lalu serah
terima berikut dokumennya. Sekitar **Rp 750 ribu per hari**, yang untuk
pekerjaan infrastruktur di Indonesia wajar sampai agak murah.

Kalau mau dinaikkan, naikkan **nilai per bagian di halaman 11**, jangan
menambah pos baru: enam bagian yang masing-masing punya hasil yang bisa dicek
jauh lebih mudah dipertahankan daripada satu angka gelondongan.

| Kalau dinaikkan ke | Per hari | Total ke klien |
|---|---:|---:|
| Rp 3.000.000 | Rp 750 rb | Rp 16.067.380 |
| Rp 4.000.000 | Rp 1 jt | Rp 17.067.380 |
| Rp 5.000.000 | Rp 1,25 jt | Rp 18.067.380 |

Hati-hati: angka yang dilihat klien sudah Rp 16 juta karena dua tahun biaya
Hostinger ikut di dalam satu total. Menaikkan jasa di atas angka itu kurang
terasa efeknya buat kita tapi sangat terasa buat kesan totalnya.

## Yang perlu dijaga supaya untungnya tidak tergerus

- **Lingkupnya berhenti di deploy.** Database, sistem masuk, sinkronisasi iCal,
  dan situs Eddo Homestay ada di halaman 14 sebagai "tidak termasuk". Kalau itu
  ikut dikerjakan tanpa penawaran baru, tiga juta habis di hari pertama tahap
  berikutnya.
- **Situs Eddo Homestay sudah ada, fotonya belum.** Halaman 14 menyebut foto
  dan isi Eddo sebagai urusan pemilik. Kalau pemilik minta kita yang memotret
  atau menulis ulang teks kamarnya, itu jam kerja di luar penawaran ini.
- **Garansi 14 hari sengaja sempit**: hanya kerusakan yang datang dari
  pekerjaan ini.
- **Backup harian Hostinger tidak diambil** di versi ini, mengikuti keranjang
  terbarunya. Salinan database ke luar server tetap termasuk. Kalau klien mau
  backup penuh dari sisi Hostinger, itu pos baru sekitar Rp 104.900 per bulan,
  dan angka itu satu-satunya yang belum pernah terlihat harga normalnya.
- **Perawatan bulanan tidak dijanjikan apa pun.**

## Kalau kliennya minta turun harga

1. **Klien beli servernya sendiri.** Angka yang dilihat turun dari
   Rp 16.067.380 ke Rp 3.000.000, dan untungnya utuh.
2. **Durasi dipendekkan ke 12 bulan.** Memotong sekitar separuh biaya
   Hostinger, tapi harga per bulannya naik dan tagihan berikutnya datang
   setahun lebih cepat. Ini menunda biaya, bukan menghematnya, dan harus
   dibilang begitu.
3. **Domain Eddo Homestay dilepas.** Rp 419.800 berikut pajaknya. Paling kecil
   efeknya, dan paling mudah disesali kalau namanya keburu diambil orang.

Yang **jangan** ditawarkan: memangkas bagian 5 (cadangan berikut uji pulih)
atau bagian 6 (pemantauan dan serah terima).

## Dua hal yang harus dicek sebelum dokumennya dikirim

1. **`unmehoppa.com`, dengan dua huruf p.** Itu yang tertulis di keranjang, dan
   itu yang dipakai di dokumen. Perusahaannya bernama **Unmehopa**, satu p.
   Kalau yang di keranjang itu salah ketik, perbaiki **sebelum** dibayar; nama
   domain tidak bisa ditukar setelah terdaftar, cuma bisa dibeli lagi.
2. **Nama domain Eddo Homestay belum ada.** Dokumen menyebutnya sebagai "Nama
   domain Eddo Homestay" tanpa alamat pastinya, karena memang belum dipilih dan
   belum dicek ketersediaannya. Isi nama aslinya sebelum ditandatangani.

## Catatan koreksi

Semua koreksi di bawah datang dari layar Hostinger yang sebenarnya, bukan dari
artikel pihak ketiga.

| Yang ditulis sebelumnya | Yang benar sekarang | Dari mana |
|---|---|---|
| Harga promo sebagai dasar anggaran | Harga normal | perintah klien, angka dari layar checkout |
| KVM 2 12 bulan | 24 bulan | layar checkout KVM 2 |
| Backup harian ikut dibeli | tidak ada di keranjang terbaru | layar checkout KVM 2 |
| Satu domain gratis dari paket | tidak ada yang gratis | layar checkout KVM 2 |
| Dua nama domain | tiga | perintah klien |
| `unmehopamanagement.com` | `unmehoppa.com` | keranjang domain |
| Email 12 bulan | 24 bulan | keranjang domain |
| Perpanjangan KVM 2 Rp 271.900/bln | tidak dipakai lagi; anggaran memakai harga normal Rp 407.900/bln | — |

Kalau nanti diperbarui lagi, **ambil dari keranjang atau halaman checkout
Hostinger, dan catat mana yang harga coret dan mana yang harga bayar.**
