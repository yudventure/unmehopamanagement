# Memindahkan Turtle System, tanpa menyentuh datanya

Keluarganya menjalankan lima perkakas kerja di hosting lama: kasir invoice,
konsol admin, tampilan staf, monitoring tamu, dan log aktivitas. Permintaannya
jelas dan sempit — **pindahkan saja, jangan bangun ulang, jangan sampai ada
data yang hilang atau rusak, yang boleh berubah cuma tampilannya.**

Dokumen ini isinya apa yang ditemukan waktu memeriksa berkasnya, apa yang sudah
dikerjakan, dan apa yang belum.

## Temuan yang menentukan: datanya tidak ada di dalam berkas ini

Kekhawatiran terbesar sebelum zip-nya dibuka adalah data yang tinggal di
browser — `localStorage`, IndexedDB, Cache Storage. Penyimpanan seperti itu
terikat pada **asal** (protokol + domain), jadi memindahkan situs ke domain
lain berarti data itu ditinggal, tanpa peringatan apa pun.

Setelah diperiksa, tidak ada yang seperti itu. **Seluruh catatannya ada di
Google Sheets**, dicapai lewat satu alamat Google Apps Script (`/exec`) yang
sama untuk ketujuh aplikasinya. Panggilannya `POST` dengan
`Content-Type: text/plain;charset=utf-8` — cara yang biasa dipakai supaya Apps
Script tidak menuntut preflight CORS — dan alamat itu tidak peduli dari domain
mana ia dipanggil.

Artinya: **memindahkan hosting tidak memindahkan datanya, karena datanya memang
tidak pernah ada di hosting.** Ia tetap di akun Google kliennya, di tempat yang
sama, dibaca dan ditulis oleh aplikasi yang sama.

Yang dipakai di browser cuma dua, dan keduanya kenyamanan, bukan catatan:

| Kunci | Isinya | Kalau hilang |
|---|---|---|
| `tdh_dashboard_last` | salinan tampilan dashboard yang terakhir dimuat | dashboard memuat ulang dari Sheets |
| `tdh_admin_credential` | login yang diingat | login sekali lagi |

Selain itu ada service worker (`admin-sw.js`, cache `turtle-admin-v5`) yang
menyimpan salinan HTML supaya halaman terbuka seketika di sinyal lemah. Cache
itu juga per asal: di domain baru ia mulai dari kosong, lalu terisi sendiri.

## Peta berkasnya

Lima alamat yang dibagikan ke orang adalah "pemuat" kecil yang langsung
melempar ke aplikasi sebenarnya. Maksudnya supaya memperbarui aplikasi cukup
menimpa satu berkas tanpa mengganti tautan yang sudah beredar.

| Alamat yang dibagikan | Aplikasi sebenarnya | Besar |
|---|---|---|
| `dashboard.html` | `td_dashboard_console_31.html` | 508 KB |
| `staff.html` | `turtle_staff_system_19_3.html` | 596 KB |
| `td_monitoring.html` | `td_monitoring_app.html` | 70 KB |
| `td_activity_log.html` | `td_activity_log_app.html` | 12 KB |
| `invoiceapp_turtle_v3.html` | `invoiceapp_turtle_v3_app.html` | 184 KB |
| — (dibuka langsung) | `td_room_availability.html` | 41 KB |
| — (versi lain, belum dipakai pemuat) | `invoiceapp_turtle_v3_app_V32_room_occupancy.html` | 200 KB |

Di luar Apps Script, yang dipanggil keluar cuma cdnjs (jsPDF dan html2canvas),
Google Fonts, dan tautan `wa.me`. **Tidak ada satu pun alamat mutlak yang
menunjuk ke hosting lama**, jadi tidak ada yang putus karena pindah.

## Yang sudah dikerjakan

Ketiga belas berkas disalin **bit per bit** ke `public/sistem/`, tanpa satu
karakter pun diubah, dan diperiksa dua kali: md5 sesudah disalin, lalu md5 lagi
atas apa yang betul-betul dilayani server. Ketiga belasnya identik.

Keenam pintu masuknya dibuka di peramban dari alamat baru: pemuatnya melempar
ke aplikasi yang benar, layar login/PIN-nya muncul, service worker-nya
terdaftar di tempat yang memang mendaftarkannya, tidak ada error, dan
panggilan keluarnya persis ke alamat yang sama seperti dulu.

Alamatnya sekarang `/sistem/<nama berkas>` — `dashboard.html`, `staff.html`,
dan seterusnya. Karena dilayani dari `public/`, alamat itu berlaku di semua
domain proyek ini, bukan cuma domain Turtle.

`X-Robots-Tag: noindex` dipasang untuk `/sistem/*` di `next.config.ts`, dan
`public/robots.txt` melarang jalur itu. Keduanya rambu, bukan kunci: yang tahu
alamatnya tetap bisa membuka, persis seperti di hosting lama.

## Rencananya: domain lama, tampilan baru

Yang diminta kliennya bukan pindah domain. `turtledivehomestay.com` tetap
alamatnya; yang berganti adalah apa yang dilayani alamat itu — dari situs lama
menjadi aplikasi ini.

Itu membuat datanya **lebih** aman lagi, bukan kurang: asal-usulnya tidak
berubah sama sekali, jadi `localStorage` dan cache di HP staf tetap di
tempatnya. Tidak ada yang perlu diekspor, tidak ada yang perlu diimpor.

### Tapi ada satu jebakan, dan ini yang paling mahal kalau kelewat

Di hosting lama seluruh aplikasinya duduk di akar domain, jadi
`register('admin-sw.js')` menghasilkan pendaftaran dengan **ruang lingkup
`/`** — seluruh domain. Service worker itu memotong setiap navigasi
same-origin dan menyajikan salinan tersimpan lebih dulu.

Begitu domain yang sama menyajikan situs baru, tiap HP staf yang pernah
membuka dashboard akan melihat **situs lama dari cache-nya sendiri**, bukan
situs baru. Dan tidak ada yang memperbaikinya sendiri, karena situs baru tidak
mendengarkan pesan `NEW_VERSION` yang dikirim service worker itu.

Gejalanya persis jenis yang paling mahal: sempurna di mesin yang belum pernah
membuka sistemnya — termasuk mesin yang mengerjakan ini — dan rusak diam-diam
berminggu-minggu di HP orang yang memakainya tiap hari.

**Disimulasikan, bukan dikira.** Skrip `cutover.mjs` di scratchpad menjalankan
babak demi babak di satu asal yang sama: pasang service worker lama dari
hosting lama, isi cache-nya, lalu ganti yang dilayani menjadi situs baru.

| Babak | Yang dilihat staf |
|---|---|
| Hosting lama | ruang lingkup `/`, cache `turtle-admin-v5` berisi 2 entri, layar: situs lama |
| Sesudah cutover, tanpa penangkal | **masih situs lama** — dari cache, bukan dari server |
| Sesudah pemadam bekerja | pendaftaran kosong, cache kosong, layar: situs baru, tab memuat ulang sendiri |

### Penangkalnya, sudah terpasang

**`public/admin-sw.js` — pemadam.** Duduk di alamat lama yang sama persis.
Peramban memeriksa ulang berkas service worker-nya sendiri, melihat isinya
berbeda, memasangnya, dan berkas itu langsung membuang cache `turtle-admin-*`,
mencabut pendaftarannya sendiri, lalu memuat ulang tab yang terbuka. Tidak
punya `fetch` handler sama sekali — selama beberapa milidetik ia hidup, ia
tidak boleh memotong apa pun.

**Service worker sistemnya sendiri tetap hidup**, di `/sistem/admin-sw.js`
dengan ruang lingkup `/sistem/` saja. Diperiksa di peramban: halaman publik
tidak dikendalikannya. Jadi sinyal lemah tetap terlayani di perkakas kerjanya,
tanpa menyentuh situs tamunya.

**Tautan lama tetap sampai.** Yang beredar di WhatsApp dan tersimpan di
bookmark berbentuk `turtledivehomestay.com/dashboard.html`. Dua belas nama —
enam pemuat dan enam nama aplikasi panjangnya — dialihkan ke `/sistem/...`,
sementara bukan permanen. Diperiksa: kedua belasnya menjawab 307 ke alamat
yang benar.

### Urutan hari-H

1. Pastikan `/sistem/` di alamat baru betul-betul jalan dengan data sungguhan
   — login, satu invoice, satu monitoring. Ini yang belum bisa diperiksa dari
   sini karena butuh PIN dan jaringan ke Apps Script-nya.
2. Beri tahu stafnya sehari sebelumnya, supaya kalau ada yang aneh mereka
   melapor, bukan diam.
3. Arahkan domainnya ke aplikasi ini.
4. Buka `turtledivehomestay.com` dari HP yang **sudah pernah** membuka
   dashboard lama. Kalau yang muncul situs lama, tunggu beberapa detik dan
   lihat apakah ia memuat ulang sendiri — itu pemadamnya bekerja.
5. Buka tiap tautan lama sekali: `/dashboard.html`, `/staff.html`, dan
   seterusnya.
6. Hosting lamanya **jangan dimatikan** sampai seminggu berlalu tanpa keluhan.

## Yang belum, dan yang perlu diputuskan

**1. PIN dan kata sandinya tertulis di dalam HTML.** Siapa pun yang membuka
halamannya bisa membacanya lewat view-source. Ini sudah begitu di hosting lama;
memindahkannya tidak memperburuk, tapi juga tidak memperbaiki. Ini yang pertama
harus dibereskan sebelum UI-nya disentuh — dan membereskannya berarti
memindahkan pemeriksaan itu ke sisi server, bukan menyembunyikannya lebih
dalam di JavaScript.

**2. Tampilannya belum disentuh sama sekali.** Itu disengaja: langkah pertama
membuktikan pindahnya tidak merusak apa-apa, dan membuktikannya cuma bisa kalau
tidak ada yang berubah. Menyentuh UI-nya layar demi layar adalah langkah
berikutnya, sesudah pemiliknya memastikan yang di `/sistem/` betul-betul jalan
dengan data sungguhan.

**3. Domainnya belum dipindah, dan tidak akan dipindah tanpa diminta.** Sistem
yang lama masih jalan di hosting lama, tidak tersentuh. Yang di sini salinan
yang berjalan sendiri, menunjuk ke data yang sama.

**4. Dua versi aplikasi invoice** ada di zip-nya, dan pemuatnya menunjuk ke
yang lama (`invoiceapp_turtle_v3_app.html`). Yang `V32_room_occupancy` ikut
disalin apa adanya, belum dipakai. Perlu ditanyakan mana yang seharusnya.

## Aturan kerja untuk berkas-berkas ini

- **Salin, jangan pernah pindahkan.** Hosting kliennya tidak disentuh: tidak
  ada yang dihapus, tidak ada yang diganti nama, tidak ada yang dipindah.
- **Folder `Waiver/` tidak ikut, dan memang tidak diminta.** Itu akun hosting
  yang berbeda dan berisi seluruh invoice; kliennya sendiri yang memberi
  peringatan untuk berhati-hati dengannya.
- **Yang lama tetap hidup** sampai yang baru terbukti, dan tetap hidup sesudah
  itu sampai pemiliknya sendiri yang bilang boleh dimatikan.
- Zip aslinya disimpan apa adanya di luar repo; berkas di `public/sistem/`
  adalah salinannya, dan `md5sum` masih bisa membandingkan keduanya kapan saja.
