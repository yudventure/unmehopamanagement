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
| `invoiceapp_turtle_v3.html` | `invoiceapp_turtle_v3_app.html` (isinya V32) | 200 KB |
| — (dibuka langsung) | `td_room_availability.html` | 41 KB |
| — (arsip nama asli V32) | `invoiceapp_turtle_v3_app_V32_room_occupancy.html` | 200 KB |

Di luar Apps Script, yang dipanggil keluar cuma cdnjs (jsPDF dan html2canvas),
Google Fonts, dan tautan `wa.me`. **Tidak ada satu pun alamat mutlak yang
menunjuk ke hosting lama**, jadi tidak ada yang putus karena pindah.

## Yang sudah dikerjakan

Ketiga belas berkas disalin **bit per bit** ke `public/sistem/`, tanpa satu
karakter pun diubah, dan diperiksa dua kali: md5 sesudah disalin, lalu md5 lagi
atas apa yang betul-betul dilayani server. Ketiga belasnya identik.

Sesudah itu **satu berkas sengaja diganti isinya**, atas permintaan pemiliknya:
`invoiceapp_turtle_v3_app.html` sekarang memuat isi V32 (lihat "Invoice naik ke
V32" di bawah). Jadi klaimnya sekarang: dua belas berkas masih bit per bit sama
dengan nama aslinya di zip, dan yang ketiga belas memuat bit per bit isi berkas
lain **dari zip yang sama**. Tidak ada satu byte pun yang kami tulis sendiri ke
dalam sistem itu, dan `md5sum` masih bisa membuktikannya:
`invoiceapp_turtle_v3_app.html` sama persis dengan
`invoiceapp_turtle_v3_app_V32_room_occupancy.html`.

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

## Membaca sistem lama dari dashboard baru

Ini jalan kedua, dan jalannya berbeda dari memindahkan berkas di atas. Di sana
UI lamanya yang dipindah apa adanya. Di sini **UI barunya yang membaca data
lama** — dashboard di `/kelola` punya layar "Sistem lama" yang menampilkan apa
yang sudah tercatat di sistem client, dalam tampilan yang sedang dibangun.

Yang membuat ini bisa dilakukan tanpa menyentuh datanya sama sekali: sistem
lama memakai **dua panggilan yang berbeda**, bukan satu panggilan dengan
saklar.

```
baca    GET  ?mode=<nama>&password=<pw>      26 mode
tulis   POST {action: <nama>, …}             19 aksi, text/plain
```

Jadi pintu yang cuma bisa membaca memang ada bentuknya, dan itu yang dibangun.

### Apa yang menahannya tetap membaca

Di `src/lib/sistem-lama.ts`:

- `method` bukan parameter. Ia tertulis `"GET"`, sekali, dan tidak ada yang
  bisa menggantinya dari luar.
- Tidak ada badan permintaan, dan tidak ada jalur kode yang bisa memasangnya.
- `mode` harus salah satu dari daftar `MODE_BACA`. Pemanggil tidak bisa
  membawa modenya sendiri.
- Tiga mode sengaja **tidak** masuk daftar. `adminSyncFromCalendar` dan
  `invoiceSyncAll` datang lewat GET seperti yang lain, tapi namanya mengatakan
  ia menulis — dan Apps Script memang boleh mengubah Sheet di dalam `doGet`,
  karena di sana verb itu kesepakatan, bukan aturan. `adminCheckRole` di luar
  karena ia penebak password, dan passwordnya password staf, bukan admin.
- Passwordnya tinggal di server. Tidak ada yang boleh membawa URL-nya ke dalam
  pesan galat, karena **URL-nya adalah passwordnya** — sistem lama menaruhnya
  di query string. Fungsi `sunyikan` ada untuk satu pekerjaan itu.

Endpoint-nya, `src/app/api/sistem-lama/route.ts`, menjawab **404 waktu belum
masuk**, sama seperti `/api/preview`: endpoint yang mengaku ada memberi tahu
orang asing bahwa situs ini punya jalan ke data booking client.

**Batas yang jujur:** cookie sesi mengatakan ada yang masuk, bukan siapa —
dashboard ini satu password, dan perannya dipilih di peramban. Jadi ini tidak
bisa owner-only di sisi server; tabnya disembunyikan dari staf, dan itu
kesopanan, bukan kunci. Sebarannya sama dengan yang sudah dimiliki dashboard
atas booking-nya sendiri, dan itu bisa diterima justru karena pintu ini tidak
bisa menulis.

### Dibuktikan, bukan diduga

Endpoint aslinya tidak bisa dihubungi dari sini dan tidak boleh diutak-atik
seandainya bisa, jadi buktinya lewat tiruan Apps Script yang mencatat setiap
permintaan yang masuk — `palsu.mjs` dan `lama.mjs` di scratchpad. Lima belas
pemeriksaan, semuanya lulus:

| Yang diperiksa | Hasil |
|---|---|
| Belum masuk → `/api/sistem-lama` menjawab 404 | ✓ |
| Data sistem lama tampil di layar (nama, nomor booking, chip permintaan) | ✓ |
| Booking tanpa nama ditampilkan "—", tidak dikarang | ✓ |
| Tanggal yang tidak terbaca ditampilkan apa adanya | ✓ |
| Pencarian menyaring | ✓ |
| Password sistem lama tidak ada di satu pun dari 24 jawaban ke peramban | ✓ |
| `adminSyncFromCalendar` ditolak sebelum menyentuh sistem lama | ✓ |
| `invoiceSyncAll` ditolak | ✓ |
| `mode` bersisipan `&action=deleteBooking` ditolak | ✓ |
| Sistem lama hanya menerima GET, nol permintaan bukan-GET | ✓ |
| Hanya `adminList` yang sampai ke sana | ✓ |
| Passwordnya ditambahkan di sisi server | ✓ |

Tiruannya menjawab `MENULIS!` untuk permintaan apa pun yang bukan GET, jadi
kalau suatu saat ada jalur yang menulis, ia muncul sebagai kegagalan, bukan
sebagai diam.

### Menyalakannya

Dua variabel di panel Hostinger, keduanya kosong secara bawaan:

```
SISTEM_LAMA_URL=https://script.google.com/macros/s/…/exec
SISTEM_LAMA_PASSWORD=…
```

Kosong berarti layarnya tetap ada dan mengatakan belum disambungkan, lengkap
dengan dua baris di atas. Tidak ada yang tersambung ke sistem client sampai
ada yang sengaja mengisinya.

Keduanya diambil dari berkas di `public/sistem/`, dan keduanya ada di
`td_room_availability.html` di blok konfigurasi paling atas: alamat `/exec`-nya
sebagai `DATA_URL` (sama di ketiga belas berkas; berkas lain menamainya
`WEBAPP_URL`), dan passwordnya sebagai `ADMIN_PASSWORD`.

Ambil `ADMIN_PASSWORD`, **bukan** `BACKEND_PW` yang ada tepat di atasnya.
`BACKEND_PW` itu backend view-only yang dipakai aplikasi monitoring dan activity
log, dan haknya berbeda — `adminList` akan menolaknya. Nilainya tidak ditulis di
sini supaya tidak bertambah satu lagi tempat yang menyimpannya.

### Memantaunya, bukan cuma melihatnya

Layarnya tidak berhenti di daftar. Di atasnya ada papan yang menjawab
pertanyaan tiap pagi: **siapa datang hari ini, siapa pulang, siapa sedang
menginap, siapa menyusul 14 hari ke depan.** Dan karena yang dibuka tiap pagi
adalah Kalender, bukan layar ini, ringkasannya juga duduk sebagai satu baris di
atas kalender, satu klik dari papannya.

**Papannya menyegarkan diri sendiri.** Tiap menit, selama tabnya dilihat.
Booking yang masuk di sistem lama muncul di sini tanpa ada yang menekan apa
pun — dibuktikan, bukan dijanjikan: `sinkron.mjs` di scratchpad menambahkan
booking ke tiruan Apps Script di tengah jalan lalu menunggu tanpa menyentuh
halamannya, dan booking itu muncul sendiri beserta papannya.

Begitu tabnya tersembunyi ia **berhenti sama sekali**, dan itu bukan
kehalusan: kuota Apps Script itu milik client, dan yang memakainya stafnya
untuk bekerja. Satu tab yang dibiarkan terbuka seharian pada 30 detik memakan
~2.900 panggilan sehari. Tab yang menganggur di belakang sekarang memakan nol,
dan begitu dilihat lagi ia langsung menarik sekali supaya yang tampil bukan
sisa satu jam lalu. Ketiganya ikut diuji.

Layarnya juga menulis "terakhir dibaca sekian lalu", dengan jamnya sendiri —
tanpa itu, layar yang gagal menarik ulang akan terus menulis "baru saja"
selamanya, dan kalimat itu paling menyesatkan justru waktu ia berhenti benar.

Papannya **diturunkan dari `adminList`**, bukan diminta ke mode
`adminDashboard`. Mode itu ada dan memulangkan papan yang mirip, tapi bentuk
tiap barisnya belum pernah kami lihat sungguhan — sementara bentuk `adminList`
sudah diperiksa. Jadi yang tampil sekarang bisa dipertanggungjawabkan. Begitu
endpoint aslinya bisa dibaca, `adminDashboard` membawa hal yang tidak bisa
diturunkan dari sini — diving hari ini, alergi tamu, overbooking — dan itu
langkah berikutnya.

**Tanggal yang tidak terbaca tidak ditebak.** Sistem lamanya sendiri cuma
mengenali `YYYY-MM-DD` (`fmtDMY` mencocokkan itu dan memulangkan apa adanya
kalau tidak cocok), jadi pembacanya mengikuti tafsir yang sudah berlaku di
sana. Yang di luar bentuk itu dihitung terpisah dan disebut jumlahnya, karena
"02/10" bisa 2 Oktober dan bisa 10 Februari — dan menebaknya berarti menjemput
orang di hari yang salah. Yang dibatalkan juga dikeluarkan dari semua hitungan,
dan jumlahnya disebut supaya tidak terbaca seperti data yang hilang.

### Apa yang ketahuan waktu endpoint sungguhannya menjawab

Sambungannya dibuka 21 September 2026, dan bacaan pertama langsung
membetulkan tiga hal. Semuanya jenis kesalahan yang tidak bisa ditemukan dari
membaca kode: ia butuh data sungguhan untuk kelihatan.

**Tanggalnya memang `YYYY-MM-DD`.** Kekhawatiran terbesarnya tidak terbukti —
papannya terisi, dan cuma segelintir baris yang tanggalnya di luar bentuk itu.

**`room` datang sebagai angka, dan seluruh kolom kamar jatuh jadi "—".**
Penyaringnya `typeof === "string"`, dimaksudkan sebagai kehati-hatian. Tapi di
layar ini "—" berarti *belum dicatat*, jadi kehati-hatian itu justru mengarang
pernyataan yang salah tentang data sungguhan: setiap kamar terbaca kosong
padahal tidak ada satu pun yang kosong. Sistem lamanya sendiri tidak memeriksa
tipe — ia menulis `Room ${b.room}` apa adanya. Sekarang `teksLadang` menerima
angka maupun teks, dan "—" cuma untuk yang betul-betul tidak ada. Hal yang sama
berlaku untuk `confirmationNo`, yang di sebagian baris juga angka.

**`displayStatus` bukan status tamu — ia nama tab.** Nilainya cuma `arrival`,
`upcoming`, dan `checkout`, dan dashboard lamanya menamainya **Arrival**,
**Upcoming**, dan **Check out** lewat `statusLabel`. Layar ini dulu menampilkan
kata mentahnya, dan lebih buruk: pewarnaannya mencocokkan potongan kata, dan
"upcom**in**g" mengandung "in" tanpa "out" — jadi tamu yang belum datang
diwarnai hijau seperti sudah check-in. Di layar yang dipakai memutuskan siapa
dijemput, itu bukan salah warna, itu salah kabar.

Ikutannya: pembatalan tampaknya tidak ikut dikirim `adminList` sama sekali —
yang dibatalkan hilang dari daftarnya, bukan ditandai. Jadi catatan "N
dibatalkan" tidak pernah muncul, dan itu benar; yang diuji sekarang adalah ia
tidak muncul sebagai "0 dibatalkan", yang akan terbaca seperti data hilang.

Tiruan Apps Script di scratchpad sekarang meniru bentuk ini — kamar berupa
angka, satu `confirmationNo` berupa angka, `displayStatus` berisi nama tab, dan
satu booking yang kamarnya memang belum ditetapkan. Fixture yang meniru dugaan
adalah fixture yang meluluskan bug.

### Kalendernya: kamar × malam, kamarnya juga dari sistem lama

Pertanyaan "kalendernya bisa terisi?" dijawab dengan kalender sendiri —
kamar jadi baris, malam jadi kolom, seluruh isinya dari `adminList` yang sudah
ditarik dan sudah menyegarkan diri. Bentuk itu yang menjawab pertanyaan yang
sebenarnya ditanyakan ke kalender homestay: "kamar mana kosong tanggal
segini", dalam satu pandangan.

Dua keberatan yang dulu membuat ini ditolak tetap berlaku; yang berubah cara
menghindarinya, bukan risikonya.

**Kamarnya tidak dicocokkan — daftarnya diambil dari sistem lama juga.** Dulu
alasannya: sistem lama menulis `room: 3`, kamar di database kami punya id
sendiri, dan cocok-cocokan berdasarkan angka akan benar sampai suatu hari ia
menggambar tamu sungguhan di kamar yang sedang ditempati orang lain. Sekarang
tidak ada pemetaan sama sekali: kalau di sana ada Room 1 sampai 7, kalender ini
berisi Room 1 sampai 7, dengan nama persis begitu. Tidak ada pemetaan berarti
tidak ada pemetaan yang bisa salah — dan itu persis aturan "penamaan ikut
sistem lama" yang ditetapkan pemiliknya.

**Tidak ada uang dan tidak ada okupansi di sini.** Dulu alasannya: okupansi dan
pendapatan dihitung dari daftar booking yang sama, dan baris sistem lama tidak
membawa harga, jadi menyuntikkannya membuat okupansi naik sementara pendapatan
tidak. Kalender ini tidak menghitung keduanya, dan itu batas yang disengaja —
daftar kamarnya diturunkan dari kamar yang *kebetulan muncul di booking*, bukan
dari daftar kamar sungguhan, jadi persentase apa pun akan mengarang penyebutnya.

**Malam kepulangan bukan malam.** Booking 18→21 memegang tiga malam, bukan
empat: tanggal 21 kamarnya sudah kosong dan bisa dijual lagi. Kalender yang
menggambarnya terisi akan menolak booking yang sebenarnya muat. Diuji, bukan
diperiksa sekilas: `kalender.mjs` membaca `grid-column` tiap batang langsung
dari DOM dan mencocokkan kolom mulai serta lebarnya. Menginap yang menembus
batas bulan dipotong dan ujungnya dibuat siku — Chen Wei 30 Sep → 3 Okt tergambar
satu malam di September dan dua di Oktober, dan ujinya menghitung keduanya.

**Yang kamarnya belum ditetapkan tidak dibuang.** Ia dapat baris sendiri,
"Belum ada kamar", dan barisnya cuma muncul kalau memang ada isinya — baris
kosong yang selalu ada terbaca seperti kamar yang tidak pernah terjual. Baris
itu juga tidak ikut dihitung di "N kamar terpakai".

Kalender utama dashboard ini tetap tidak dicampuri: yang satu buku milik
dashboard ini, yang satu jendela ke buku milik orang lain.

### Satu bacaan, dipakai berdua

Papan dan strip memakai simpanan yang sama dengan umur dua menit
(`sistem-lama-data.tsx`). Tiap panggilan menyentuh Apps Script milik client,
yang punya kuota harian dan sedang dipakai stafnya untuk bekerja — dua komponen
yang masing-masing menarik sendiri berarti dashboard ini ikut menghabiskan
jatah sistem yang sedang dipakai orang.

### Mode yang sudah dipakai, dan sisanya

Sekarang layarnya membaca satu mode, `adminList`. Dua puluh dua mode baca lain
sudah ada di daftar putihnya dan tinggal diberi tampilan: papan hari ini
(`adminDashboard`), laporan harian (`adminDailyReport`), jadwal kamar
(`adminGetRoomSchedule`), dan seterusnya. Bentuk datanya dibaca dari kode render
dashboard lama, bukan dari skema, jadi tiap ladang diperlakukan sebagai
mungkin-tidak-ada sampai endpoint sungguhan menjawab.

## Arah yang sudah diputuskan, 21 September 2026

Pemiliknya menetapkan tiga hal, dan ketiganya mengubah cara membaca sisa
dokumen ini.

**1. Penamaan dan isi ikut sistem lama.** Layar baru adalah jendela, dan
jendela tidak mengganti nama benda. Ini langsung menangkap satu kekeliruan:
versi pertama layar "Sistem lama" menulis "Kursus SSI", "Excursion", dan
"Try dive" untuk tiga penanda yang di sistem lamanya bernama **SSI Dive
Course**, **Excursion Trip**, dan **Try Dive**. Terjemahan yang kelihatan
tidak berbahaya, tapi akibatnya dua kosakata untuk satu benda — staf yang
membaca "SSI Dive Course" di satu layar dan "Kursus SSI" di layar lain akan
mengira itu dua hal. Sekarang labelnya disalin, ada di `PERMINTAAN` di
`sistem-lama-bentuk.ts`, dengan sumbernya disebut.

**2. Sekarang: sinkron satu arah saja, dari sistem lama.** Yang baru membaca,
yang lama tetap satu-satunya tempat menulis. Dan membacanya harus otomatis:
booking yang masuk di sana muncul di sini sendiri, tanpa ada yang menekan apa
pun. Papan yang cuma benar pada detik halaman dibuka bukan pantauan — ia foto
lama yang terlihat seperti keadaan sekarang, dan itu lebih buruk daripada
tidak ada papan sama sekali.

**3. Nanti: satu sistem, dengan data lama sebagai isinya.** Migrasi penuhnya
bukan memindahkan data ke tempat baru. Rencananya justru sebaliknya: aplikasi
yang sedang dibangun ini menjadi tampilannya, **database sistem lama tetap
jadi isinya**, dan **domain lamanya tetap alamatnya**. Yang berubah cuma
kerapiannya.

### Satu hal yang perlu diputuskan sebelum migrasi penuh

Keputusan nomor 3 bertabrakan dengan sesuatu yang sudah ada di repo ini, dan
lebih baik disebut sekarang daripada ditemukan di tengah jalan.

Dashboard ini sudah punya database sendiri — Postgres lewat Prisma, dengan
model `Property`, `Room`, `SeasonalRate`, `Booking`, dan `IcalFeed`, ditambah
proteksi anti-double-booking yang memakai `EXCLUDE USING gist`. Kalau isi
Turtle tetap di Google Sheet, maka untuk Turtle, Postgres itu **bukan** sumber
kebenarannya.

Dua-duanya masuk akal, dan pilihannya bukan pilihan teknis semata:

- **Sheet tetap sumbernya.** Tidak ada yang perlu dipindahkan, tidak ada yang
  bisa rusak waktu memindahkan, dan staf yang sudah terbiasa tetap bisa
  membuka sistem lamanya. Harganya: proteksi double-booking di Postgres tidak
  melindungi Turtle, dan tiap layar yang menulis harus lewat Apps Script.
- **Pindah ke Postgres.** Dapat proteksi itu dan satu tempat untuk semuanya.
  Harganya: perpindahan data sungguhan, yang persis hal yang kliennya minta
  dihindari.

Belum diputuskan, dan tidak perlu diputuskan sekarang — sinkron satu arah
berjalan di kedua kemungkinan itu. Yang tidak boleh terjadi adalah salah satu
dipilih diam-diam karena kode tumbuh ke satu arah tanpa ada yang menyebutnya.

## Invoice naik ke V32

Pemiliknya memilih yang baru. Caranya mengikuti aturan sistemnya sendiri, bukan mengakali
pemuatnya: pemuat `invoiceapp_turtle_v3.html` memuat komentar
*"CACHE-BUSTER LOADER — jangan diubah. Untuk update, cukup TIMPA file itu (nama
sama)"*, jadi yang ditimpa isinya, dan pemuatnya tidak disentuh sama sekali.
Tautan yang sudah dibagikan tetap berlaku, dan update berikutnya tetap bekerja
seperti yang dimaksud penulis aslinya. Berkas bernama `..._V32_room_occupancy.html`
tetap ada sebagai arsip nama aslinya.

Yang diperiksa sebelum menimpa: V32 memuat **semua** fungsi V31 (285 baris
ditambah, 5 dibuang, nol fungsi hilang), membaca mode yang sama persis
(`invoiceSyncAll`), dan **tidak menambah satu pun panggilan tulis** — nol
`action:` baru, nol POST baru. Tambahannya laporan okupansi kamar: malam per
bulan, tarif kamar yang bisa diatur, ringkasan per kamar, ekspor CSV. Tarifnya
disimpan di `localStorage` peramban masing-masing, bukan ke Sheet — jadi aman,
tapi tidak dilihat staf lain dan hilang kalau browsernya dibersihkan.

## Yang belum, dan yang perlu diputuskan

**1. Lima dari tiga belas berkasnya menaruh PIN dan kata sandi di dalam HTML.**
`td_room_availability.html`, `td_monitoring_app.html`, `td_activity_log_app.html`,
dan kedua aplikasi invoice. Siapa pun yang membuka halamannya bisa membacanya
lewat view-source. Ini sudah begitu di hosting lama; memindahkannya tidak
memperburuk, tapi juga tidak memperbaiki.

Delapan sisanya tidak — dan itu penting untuk diketahui sebelum ada yang
"membereskan" berkas yang sudah benar. Dua konsol besarnya,
`td_dashboard_console_31.html` dan `turtle_staff_system_19_3.html`, justru sudah
melakukannya dengan cara yang benar: `ADMIN_PASSWORD` di sana dimulai kosong,
diisi dari apa yang diketik staf waktu login, lalu diperiksa di sisi server lewat
`adminCheckRole`. Yang tersimpan di peramban cuma ingatan login, bukan kunci.

Jadi pekerjaannya bukan menambal semuanya, melainkan membawa lima berkas itu ke
pola yang sudah dipakai delapan sisanya. Ini yang pertama harus dibereskan
sebelum UI-nya disentuh — dan membereskannya berarti memindahkan pemeriksaan itu
ke sisi server, bukan menyembunyikannya lebih dalam di JavaScript.

**2. Tampilannya belum kami tulis ulang sama sekali.** Itu disengaja: langkah
pertama membuktikan pindahnya tidak merusak apa-apa, dan membuktikannya cuma
bisa kalau tidak ada yang berubah. Naiknya invoice ke V32 bukan pengecualian —
itu berkas yang sudah ada di zip kliennya, dipasang apa adanya, bukan baris
yang kami karang. Menyentuh UI-nya layar demi layar adalah langkah
berikutnya, sesudah pemiliknya memastikan yang di `/sistem/` betul-betul jalan
dengan data sungguhan.

**3. Domainnya belum dipindah, dan tidak akan dipindah tanpa diminta.** Sistem
yang lama masih jalan di hosting lama, tidak tersentuh. Yang di sini salinan
yang berjalan sendiri, menunjuk ke data yang sama.

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
