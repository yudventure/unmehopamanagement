# Pasang di Hostinger

Daftar yang tinggal diikuti, untuk jalur yang dipakai sekarang: **deploy lewat
Git, satu domain dulu, domain berikutnya menyusul.** Alasan di balik tiap
pilihan ada di `DEPLOY.md`; halaman ini cuma urutannya.

Tiga situs hidup dari **satu aplikasi**, jadi yang dipasang satu, bukan tiga.
Yang membedakan mereka cuma nama domain yang diminta pengunjung:

| Domain | Yang disajikan |
|---|---|
| `turtlehomestay.com` | situs publik Turtle Dive Homestay |
| `eddohomestay.com` | situs publik Eddo Homestay |
| `unmehopamanagement.com` | dashboard booking |

Domain dashboard **tidak perlu variabel apa pun**: ia menyajikan `/`, dan `/`
memang sudah dashboard.

## Yang sudah siap, jadi tidak perlu dikerjakan lagi

- Branch **`deploy`** di repositori ini berisi **hasil build siap jalan** —
  `server.js`, `.next`, `public`, `node_modules` hasil penelusuran. Tidak ada
  kode sumber, jadi tidak ada yang perlu dibangun di server.
- GitHub Actions memperbaruinya sendiri tiap push ke `main`, lalu menunggu
  sampai `/version.json` di situsnya menyebut commit itu.
- Ukurannya **41 MB**. Membangunnya memuncak di sekitar **1,6 GB memori** —
  itulah kenapa build tidak boleh terjadi di server.

## Tahap 1 — satu domain

Satu domain menyajikan ketiganya lewat jalur. Ini keadaan yang benar untuk
memastikan semuanya jalan sebelum alamat yang sesungguhnya dipasang.

Pasang **`unmehopamanagement.com`** dulu, karena itu satu-satunya domain yang
tidak butuh variabel apa pun — jadi tidak ada yang bisa salah diisi, dan
ketiga situsnya tetap bisa dibuka dan diperiksa:

| Alamat | Yang disajikan |
|---|---|
| `unmehopamanagement.com/` | Dashboard |
| `unmehopamanagement.com/kelola` | Dashboard, alamat tetapnya |
| `unmehopamanagement.com/turtle` | Situs Turtle |
| `unmehopamanagement.com/eddo` | Situs Eddo |
| `unmehopamanagement.com/version.json` | Bukti versi mana yang sedang tayang |

### 1. Buat aplikasi Node.js dari Git

Di hPanel, **Node.js Web Apps**, buat aplikasi dengan sumber repositori Git.
Penyambungannya lewat GitHub App, dan repositori ini privat, jadi beri izin
aksesnya saat diminta.

```
Repositori       : yudventure/unmehopamanagement
Branch           : deploy          <- bukan main
Preset framework : Next.js         <- biarkan, lihat catatan
Build command    : npm run build   <- di branch deploy ini TIDAK membangun
Direktori output : ./              <- bukan .next
Entry file       : server.js
Versi Node       : 22
Root directory   : ./
```

**Kenapa build command-nya tidak dikosongkan saja.** Dokumentasi Hostinger
memang menyebut direktori output boleh kosong untuk aplikasi tanpa langkah
build, tapi formulirnya tidak begitu: diperiksa 17 November 2026, **Build
command dan Direktori output dua-duanya wajib** &mdash; bertanda bintang, dan
dikosongkan ia menolak dengan *"Masukkan folder tempat file yang telah Anda
buat berada."*

Jadi jalan keluarnya bukan mengosongkan, melainkan membuat keduanya benar:

- **Build command** itu pemilih atas daftar script di `package.json`. Branch
  `deploy` sengaja membawa script `build` yang **cuma mencetak satu kalimat
  lalu selesai** (0,1 detik, lihat `scripts/package.mjs`). Jadi `npm run
  build` di sana aman, dan log-nya mengatakan sendiri kenapa tidak ada yang
  dibangun. Tanpa script itu, satu-satunya pilihan yang ditawarkan adalah
  `npm run start`, yang akan menyalakan server sebagai langkah build lalu
  menggantung sampai deploy-nya kehabisan waktu.
- **Direktori output** artinya "folder tempat berkas hasil build berada". Di
  branch `deploy` berkas hasil build **adalah akar repositorinya** &mdash;
  `server.js`, `.next`, `node_modules`, `public` semuanya di situ. Jadi `./`,
  dan itu bukan akal-akalan melainkan jawaban yang jujur. Diisi `.next`
  jawabannya salah: di dalam `.next` tidak ada `server.js` maupun
  `node_modules`.

Deploy otomatis menyala sendiri begitu aplikasinya dibuat dari Git. Tidak ada
webhook yang perlu ditempel. Sesudah mengubah setelannya, pilih **Save and
redeploy** kalau mau berlaku sekarang; **Save** saja baru berlaku di push
berikutnya.

### 2. Kosongkan dulu variabel domainnya

Nama domain **tertanam saat build**, bukan dibaca saat jalan. Di tahap 1
keduanya dibiarkan kosong, dan itu memang keadaan yang benar: tanpa keduanya
`next.config.ts` mati total dan routing-nya jadi berbasis jalur, persis
tabel di atas.

Tempatnya di GitHub: **Settings → Secrets and variables → Actions →
Variables**. Pastikan keduanya kosong atau belum ada:

```
SITE_DOMAIN_TURTLE =            (kosong)
SITE_DOMAIN_EDDO   =            (kosong)
```

Kalau salah satunya pernah diisi, kosongkan lalu **jalankan ulang workflow
Build di `main`**. Me-restart server tidak mengubah apa pun: yang berubah cuma
ada di hasil build berikutnya.

Variabel yang sama **jangan** diisi di panel Hostinger. Panel itu untuk
variabel yang dibaca saat jalan; yang dibaca saat build diisinya di GitHub,
dan diisi di panel ia tidak terpakai sama sekali tanpa ada pesan apa pun.

### 3. Isi variabel yang dibaca saat jalan

Di panel aplikasi Node-nya, bagian **Variabel environment**. Daftar lengkapnya
berikut penjelasan tiap baris ada di `.env.example`; yang paling sedikit supaya
bisa dipakai:

| Variabel | Tanpa ini |
|---|---|
| `PENYIAPAN_KUNCI` (atau `DASHBOARD_PASSWORD` yang lama) | akun developer pertama tidak bisa dibuat, jadi tidak ada yang bisa masuk. Kunci ini hanya untuk penyiapan, bukan untuk masuk sehari-hari |
| `SESSION_SECRET` | opsional: kosong berarti dibuatkan sekali dan disimpan di folder data |
| `DATABASE_URL` | kalender kosong dan booking tidak tersimpan; tidak ada data contoh |
| `DIRECT_URL` | migrasi database tidak bisa jalan dari Actions |
| `CMS_PASSWORD` | tab Website menolak menyimpan |
| `RESEND_API_KEY`, `ENQUIRY_FROM` | tombol Kirim beralih membuka WhatsApp |
| `MIDTRANS_SERVER_KEY` | tombol bayar bertanya lewat formulir, bukan menagih |

Semuanya opsional dalam arti aplikasinya tetap menyala tanpa itu, dan matinya
dijelaskan di layar, bukan berupa error. Isi dari atas.

**Jangan** menaruh kunci server di variabel berawalan `NEXT_PUBLIC_`: yang
berawalan itu ikut terkirim ke peramban pengunjung.

### 4. Buktikan

```
https://unmehopamanagement.com/version.json
```

`commit` di situ harus sama dengan commit terakhir di `main`. Kalau tidak,
yang tayang build lama dan sisanya tidak perlu diperiksa dulu. Sesudah cocok,
buka keempat alamat di tabel atas.

## Tahap 2 — dua domain homestay, setelah semuanya mapan

1. **Arahkan kedua domainnya ke aplikasi yang sama.** Tambahkan
   `turtlehomestay.com` dan `eddohomestay.com` di panel aplikasi Node-nya,
   apex dan `www` dua-duanya. Kalau nameserver-nya bukan Hostinger, arahkan A
   record keduanya ke alamat yang ditunjukkan panel. **MX record jangan
   disentuh**: emailnya catatan DNS yang berbeda dan tidak ikut pindah, jadi
   memindahkan situsnya tidak ikut mematikan emailnya.
2. **Isi variabelnya di GitHub**, apex dulu baru `www`, dipisah koma:
   ```
   SITE_DOMAIN_TURTLE = turtlehomestay.com,www.turtlehomestay.com
   SITE_DOMAIN_EDDO   = eddohomestay.com,www.eddohomestay.com
   ```
   Yang pertama dianggap alamat resmi dan dipakai sebagai canonical. Tidak ada
   variabel untuk `unmehopamanagement.com`, dan itu memang benar: ia
   menyajikan `/`, yang sudah dashboard.
3. **Jalankan ulang workflow Build di `main`.** Sekali lagi: tertanam saat
   build, bukan saat jalan.
4. **Buktikan lagi** lewat `/version.json`, lalu buka ketiga domain di
   akarnya.

Sesudah itu:

| Alamat | Yang disajikan |
|---|---|
| `turtlehomestay.com/` | situs Turtle |
| `turtlehomestay.com/turtle` | memantul ke `turtlehomestay.com/` |
| `eddohomestay.com/` | situs Eddo |
| `eddohomestay.com/turtle` | situs Turtle &mdash; tautan "homestay saudara kami" tetap hidup |
| `unmehopamanagement.com/` | dashboard |
| `unmehopamanagement.com/kelola` | dashboard |

## Lima hal yang menggagalkan deploy, dan bentuk gagalnya

| Kalau | Yang terjadi |
|---|---|
| Build command tidak dikosongkan | `next build` dijalankan di server, lalu gagal &mdash; lihat di bawah |
| Direktori output dibiarkan `.next` | setelan untuk aplikasi yang dibangun di server; di sini tidak ada yang dibangun |
| Branch diisi `main`, bukan `deploy` | server menarik kode sumber lalu mencoba membangunnya; lihat di bawah |
| Entry diisi `npm start` | di arsip itu tidak ada `next`, yang ada `server.js` |
| Port dipatok di panel | `server.js` membaca `PORT` dan `HOSTNAME` dari lingkungan |
| Domain diisi tanpa build ulang | tidak ada efek apa pun, dan tidak ada pesan apa pun |
| `SITE_DOMAIN_*` diisi di panel Hostinger | tidak terpakai; tempatnya GitHub Variables, bukan panel |

## Bentuk gagalnya kalau servernya terlanjur membangun sendiri

Terjadi sungguhan pada 17 November 2026, percobaan pasang yang pertama.
Log-nya begini, dan tiga barisnya layak dikenali:

```
> booking-manager-homestay@0.1.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
  Downloading swc package @next/swc-wasm-nodejs…
⚠ Attempted to load @next/swc-linux-x64-gnu, but an error occurred:
  /lib64/libm.so.6: version `GLIBC_2.29' not found (required by
  …/hbuilds/source/repository/node_modules/@next/swc-linux-x64-gnu/…)
⚠ Attempted to load @next/swc-linux-x64-musl, but an error occurred:
  /lib64/libc.so: invalid ELF header
× Failed to load next.config.ts
```

| Baris | Yang sebenarnya dikatakannya |
|---|---|
| `> next build` | servernya sedang membangun. Itu sudah salah sebelum error pertama muncul |
| `source/repository` | yang ditarik kode sumber, berarti branch-nya `main`, bukan `deploy` |
| `GLIBC_2.29 not found` | glibc mesin shared hosting-nya lebih tua dari yang dibutuhkan binary SWC Next |
| `Failed to load next.config.ts` | branch `deploy` tidak punya berkas itu sama sekali, jadi ini bukti lain bahwa yang ditarik `main` |

Baris GLIBC-nya **bukan masalah yang perlu diperbaiki**, dan mengejarnya
membuang waktu. Ia justru alasan seluruh rancangan ini ada: mesin shared
hosting-nya memang tidak sanggup membangun Next, dan memang tidak perlu.
Yang diperbaiki satu, yaitu membuatnya berhenti mencoba &mdash; branch
`deploy`, build command kosong, direktori output kosong.

## Dibuktikan, bukan diduga

Diperiksa 17 November 2026 terhadap arsip hasil `npm run package`, dijalankan
dengan `node server.js` persis seperti di server, dua kali: sekali tanpa
variabel domain, sekali dengan keduanya terisi dan `Host` dipalsukan.

**Tanpa variabel domain** — keadaan tahap 1:

| | |
|---|---|
| `/` | dashboard |
| `/turtle`, `/eddo` | situs masing-masing |
| `/kelola` | dashboard |
| `/version.json` | commit dan waktu build |
| `/sistem/dashboard.html` | sistem staf lama, tetap hidup |
| `/hero.jpg`, `/_next/static/…css` | 200, jadi foto dan gaya ikut tersaji |

**Dengan keduanya terisi** — keadaan tahap 2:

| `Host` | Alamat | Yang disajikan |
|---|---|---|
| `eddohomestay.com` | `/` | situs Eddo |
| `turtlehomestay.com` | `/` | situs Turtle |
| keduanya | `/kelola` | dashboard |
| `eddohomestay.com` | `/turtle` | situs Turtle, tautan "homestay saudara kami" tetap hidup |
| `localhost` | `/` | dashboard, jadi domain yang tidak terdaftar tidak ikut berubah |
| `eddohomestay.com` | `/eddo` | memantul 307 ke `/`, tidak berputar |
| `turtlehomestay.com` | `/turtle/about` | memantul 307 ke `/about` |

Yang **tidak** ikut ditulis ulang, dan itu memang syaratnya: `/api/*`,
`/version.json`, dan berkas di `public/` menjawab sama persis di ketiga host.

## Masuk ke dashboard: akun per orang

Dashboard tidak lagi memakai satu kata sandi bersama. Tiap orang punya akun
(email dan kata sandi) yang tersimpan di server, di folder `~/.unmehopa-data`
(atau `UNMEHOPA_DATA_DIR`), di luar folder aplikasi sehingga deploy ulang tidak
menghapusnya. **Cadangkan folder itu**: kehilangannya berarti semua akun harus
dibuat ulang.

1. Buka `unmehopamanagement.com`. Selama belum ada akun, halaman masuk berubah
   menjadi **Buat akun developer pertama**.
2. Isi **Kunci penyiapan** dengan nilai `PENYIAPAN_KUNCI` di panel hosting
   (atau `DASHBOARD_PASSWORD` kalau itu yang sudah terisi), lalu nama, email,
   dan kata sandi (paling sedikit 10 huruf). Kunci ini hanya dipakai di sini.
3. Sesudahnya, **Pengguna & Peran** di dashboard dipakai untuk menambah akun,
   mengganti peran, dan menonaktifkan. Peran: Developer, Pemilik (akses penuh),
   Admin (semua properti dan angka rupiah, tanpa mengatur akun), Staf
   (properti yang diizinkan, tanpa angka rupiah).
4. Lupa kata sandi: developer atau pemilik menyetel ulang dari halaman
   Pengguna. Menyetel ulang mengeluarkan sesi lama orang itu.

Developer atau pemilik terakhir yang aktif tidak bisa dinonaktifkan atau
diturunkan, supaya tidak ada yang mengunci diri dari dashboard.

## Peran dan menu di dashboard

Rangka dashboard mengikuti panel pengelola Mambetron (bilah atas putih, menu
samping dengan pil gelap, kartu HARI INI, dan lembar menu dari bawah di
ponsel), dengan warna hijau Unmehopa. Menu tiap peran berbeda:

| Peran | Menu |
|---|---|
| Developer, Pemilik | Ringkasan, Kalender, Laporan, Properti & Kamar, Sinkronisasi OTA, Sistem lama, Website, Pengguna & Peran. Mengatur akun |
| General Manager | Sama, tanpa mengatur akun |
| Manajer unit | **Semua yang berkaitan dengan unitnya**: Kalender, Laporan (dengan angka rupiah), Properti & Kamar (tambah, ubah, hapus), Sinkronisasi kalender, Website unitnya, dan untuk Turtle juga Sistem lama dan Jadwal Dive Center. Tidak melihat unit lain dan tidak mengatur akun |
| HRD | Ringkasan, Pengguna & Peran (hanya melihat) |
| Keuangan | Ringkasan, Laporan, Kalender. Melihat angka rupiah semua unit |
| Public Relation | Ringkasan, Website |
| Staf | Ringkasan, Kalender, Properti & Kamar di unit yang diizinkan. Tanpa angka rupiah |

Manajer unit memakai satu peran yang sama, dan unitnya diatur lewat kolom
**Akses properti** saat akun dibuat.

## Jumlah kamar dan sinkronisasi kalender ke situs mana pun

Selama database belum tersambung, kamar, booking yang dicatat di dashboard, dan
sambungan kalender tersimpan di berkas di folder data server
(`~/.unmehopa-data`: `kamar.json`, `pesanan.json`, `sambungan.json`). **Cadangkan
folder itu bersama akun.** Begitu `DATABASE_URL` diisi, dashboard membaca dari
database dan berkas ini tidak dipakai lagi, jadi isinya perlu dipindahkan dulu.

**Jumlah kamar.** Di Properti & Kamar, **+ Tambah kamar** di tiap unit dan
**Edit lalu Hapus** untuk kamar yang belum pernah punya booking atau sambungan.
Yang pernah dipakai cukup dinonaktifkan. Hanya developer, pemilik, dan general
manager. Kalender dan Laporan ikut menghitung kamar baru. **Website publik
Turtle dan Eddo belum ikut**: daftar kamar dan tarif di sana tetap dari kode.

**Sinkronisasi.** Menu **Sinkronisasi kalender**. Situs apa pun yang bisa memberi
tautan iCal boleh disambungkan: Booking.com, Airbnb, Agoda, Tiket.com, Expedia,
Google Calendar, atau agen perjalanan lokal. Namanya diketik sendiri. Per
kamar bisa banyak situs sekaligus.

- **Dibaca.** Server membaca tautan dari situs itu tiap 15 menit, dan tombol
  **Sinkronkan sekarang** membacanya saat itu juga. Malam yang terisi di sana
  tampil di kalender (saluran "OTA lain" atau Booking.com, Traveloka, Agoda
  bila namanya cocok) dan ikut diperiksa bentroknya. Harga dan jumlah tamu
  ditandai tidak diketahui. Bacaan yang gagal tidak membuka malam dari bacaan
  terakhir yang berhasil.
- **Dikirim.** Tiap sambungan punya tautan ekspor `/api/ical/<token>.ics` untuk
  ditempel ke situs itu. Isinya malam terisi dari booking di dashboard dan dari
  situs lain di kamar yang sama, tanpa malam dari situs itu sendiri supaya tidak
  memantul. Tanpa nama tamu. **Buat tautan baru** mematikan yang lama.
- Agen yang hanya membaca cukup dengan sambungan tanpa tautan impor.

Keterbatasan yang perlu dikatakan ke pemilik: iCal hanya membawa terisi atau
kosong. Situs yang membaca tautan kita punya jeda belasan menit sampai beberapa
jam, jadi pesanan ganda masih mungkin dan bentrok harus diselesaikan manual.
Setahu kami Traveloka dan Tiket.com tidak memakai iCal, dan Booking.com hanya
untuk tipe kamar berisi satu unit. **Periksa lagi di extranet masing-masing
sebelum memasang.**

**Turtle.** Selama sistem lama tersambung, kamar dan booking Turtle dibaca dari
sana, jadi kamar Turtle belum bisa disambungkan ke situs luar dari dashboard, dan
booking sistem lama belum ikut ke tautan ekspor mana pun.

Keamanan tautan yang dibaca server: hanya `https`/`http`, alamat jaringan dalam
(localhost, 10.x, 192.168.x, dan sejenisnya, juga nama yang menunjuk ke sana)
ditolak, pengalihan diperiksa ulang, batas 20 detik dan 5 MB.
`SINKRON_IZINKAN_LOKAL=1` hanya untuk uji di komputer sendiri, **jangan** diisi di
Hostinger. Uji pembaca iCal: `npm run uji`.


## Domain homestay sudah dikenali kode

Sejak 17 November 2026, `turtlehomestay.com` (dan `www`) menyajikan situs Turtle,
dan `eddohomestay.com` (dan `www`) menyajikan situs Eddo, **tanpa** variabel
apa pun. Sebelumnya domain hanya dikenali kalau `SITE_DOMAIN_TURTLE` dan
`SITE_DOMAIN_EDDO` terisi di GitHub Variables saat build, dan variabel yang
terlewat membuat `/` di domain itu menyajikan dashboard.

- Variabel itu tetap menang kalau diisi (untuk domain lain). Kosong berarti
  domain bawaan di `next.config.mjs` dan `src/lib/site-domains.ts`.
- **Alamat resmi (canonical) dan tautan antar situs** memakai domain hanya bila
  domain itu benar-benar tayang. Eddo sudah. Turtle belum (`turtlehomestay.com`
  masih terparkir), jadi tetap `/turtle` sampai `SITE_DOMAIN_TURTLE` diisi di
  GitHub Variables dan build diulang.
- `/kelola` di domain homestay dialihkan ke `unmehopamanagement.com/kelola`
  (domain lain bisa lewat `MANAGEMENT_DOMAIN` saat build). Tamu yang membuka
  alamat homestay tidak melihat layar masuk manajemen.
- Yang tetap harus dilakukan di luar kode: domainnya ditambahkan di aplikasi
  Node.js Hostinger (apex dan `www`), A record bila nameserver bukan Hostinger,
  MX tidak disentuh, dan aplikasinya memakai branch `deploy`.


## Menu per unit

Menu dashboard dipisah per unit. Developer, Pemilik, dan General Manager melihat
bagian **Semua unit** (gabungan) dan satu bagian untuk tiap unit, masing-masing
dengan halamannya sendiri:

| Bagian | Halaman |
|---|---|
| Semua unit | Kalender, Laporan, Properti & Kamar, Sinkronisasi kalender (gabungan) |
| Turtle Homestay | Kalender, Laporan, Properti & Kamar, Sinkronisasi kalender, Website, Sistem lama, **Jadwal Dive Center** |
| Eddo Homestay | Kalender, Laporan, Properti & Kamar, Sinkronisasi kalender, Website |
| Perusahaan | Pengguna & Peran |

**Dive Center ikut di bawah Turtle**, karena yang menjalankan dive center
sekarang hanya Turtle. Ia tidak punya kamar, jadi hanya jadwal selam. Eddo
menyiapkannya untuk tahun depan: ubah `DIVE_CENTER_DI.eddo` menjadi `true` di
`src/components/booking-manager.tsx`, dan "Jadwal Dive Center" muncul di bagian
Eddo untuk akun yang memegang properti Dive Center. Datanya masih satu unit
`divecenter`, yang perlu dipisah per unit induk saat Eddo benar-benar mulai.
Akun manajer Dive Center melihat bagian "Dive Center Turtle" berisi jadwalnya.

**Website dipisah per unit.** Website Turtle di bagian Turtle, Website Eddo di
bagian Eddo, masing-masing hanya satu situs. Laporan (angka keuangan) sudah per
unit sejak awal. PR yang tidak memegang unit tetap melihat satu halaman Website
dengan kedua tab. Draf yang belum disimpan tidak hilang saat berpindah antara
Website Turtle dan Website Eddo; Simpan menulis seluruh berkas isi.

Memilih sebuah unit membatasi kalender, laporan, kamar, dan sinkronisasi ke unit
itu saja, dan judul **Unit** tampil di atas halaman. Peran lain hanya melihat
bagiannya: manajer unit dan staf hanya bagian unit di kolom **Akses properti**
akunnya, keuangan hanya Laporan dan Kalender, HRD hanya Pengguna, PR hanya
Website. Bagian yang hanya satu terbuka sejak awal, yang lain terlipat.


## Halaman tanpa gaya setelah deploy, dan ikon tab yang tidak berganti

Terjadi di eddohomestay.com pada sebuah mesin Windows pada 17 November 2026:
teks polos tanpa gaya, gambar tetap muncul, dan favicon lama.

**Sebabnya.** Next mengirim halaman situs yang dibangun saat build dengan
`Cache-Control: s-maxage=31536000`, satu tahun di cache bersama seperti CDN
Hostinger. Tiap deploy mengganti nama berkas gaya (`/_next/static/css/<hash>.css`)
dan membuang yang lama. HTML lama yang masih di CDN menunjuk ke berkas yang
sudah tidak ada: gambar muncul karena berasal dari `public/`, gaya tidak, dan
ikon tab tetap yang lama karena HTML-nya yang lama.

**Perbaikannya** ada di `next.config.mjs` (`cachePublik`): halaman situs publik
kini `public, max-age=0, must-revalidate`, jadi CDN bertanya dulu ke server
sebelum memakai salinannya. Berkas `/_next/static` tetap `immutable`. Dashboard
dan `/api` tidak diubah: tetap `private, no-store`.

**Satu langkah manual setelah deploy pertama dengan aturan ini.** Salinan satu
tahun yang SUDAH ada di CDN tidak hilang sendiri. Bersihkan cache CDN di hPanel
(aplikasi Node.js atau Websites, lalu menu Cache atau CDN, lalu Purge atau
Clear cache), kemudian muat ulang keras di peramban (Ctrl+Shift+R di Windows,
Cmd+Shift+R di Mac). Sesudah itu deploy berikutnya tidak perlu langkah ini.


## Kewenangan manajer unit

Manajer unit mengelola semua yang berkaitan dengan unitnya. Pembatasannya
dijaga **di server**, tidak hanya di menu:

- **Kamar** (`/api/kamar`): kamar di unit lain harus persis sama seperti
  tersimpan. Menambah, mengubah, atau menghapusnya ditolak.
- **Sinkronisasi** (`/api/sinkron`, `/api/buku`): hanya sambungan di kamar
  unitnya yang terlihat dan bisa diubah. Tautan ekspor memuat rahasia, jadi
  tidak dikirim ke manajer unit lain.
- **Pesanan** (`/api/pesanan`): hanya di kamar unitnya.
- **Website** (`/api/content`): penyimpan harus punya sesi dashboard dan layar
  Website, **selain** kata sandi CMS yang lama. Isinya dibandingkan dengan
  berkas yang sedang ada di GitHub: manajer Turtle hanya boleh mengubah situs
  Turtle, tahun berdiri, harga dan video dive center. Manajer Eddo hanya situs
  Eddo dan layanan yang disewakan. Kontak dan media sosial bersama serta
  **penutupan situs** hanya developer, pemilik, dan general manager. PR boleh
  semuanya kecuali penutupan situs. Nama penyimpan di riwayat GitHub kini diambil
  dari akunnya, bukan dari isian di peramban.
- **Sistem lama** (`/api/sistem-lama`): hanya akun yang memegang Turtle.
- **Dive center** dijalankan Turtle, jadi akun yang memegang Turtle memegangnya.

Kata sandi CMS bersama (`CMS_PASSWORD`) **sudah dihapus**. Menyimpan Website kini
meminta kata sandi akun orang yang sedang masuk, diketik ulang sebagai
konfirmasi (menyimpan menayangkan situs). Variabel `CMS_PASSWORD` di Hostinger
tidak dipakai lagi dan boleh dihapus; server hanya butuh `GITHUB_TOKEN` dan
`GITHUB_REPO`.

## Kalender per unit: kepala, panel pesanan, dan pembaca pesan

Kalender tiap unit (dan **Semua unit**) mengikuti kalender mitra DAMPIER:

- **Kepala unit**: nama, jumlah kamar, dan tiga angka (kamar terisi malam ini,
  kedatangan 7 hari, terisi bulan ini), dengan penjelasan "Cara kalender ini
  bekerja".
- **Panel samping**: **Tambah pesanan**, **Tambah banyak**, kotak **Pesan Stay
  Raja Ampat**, dan **Check-in dan check-out** (Hari ini, Besok, 7 hari ke
  depan, 7 hari lalu) dengan tombol **Sudah datang** dan **Sudah pulang**.
  Manajer unit, staf, dan pemilik, developer, serta GM bisa mencatat. Dari
  **Semua unit**, pemilik, developer, dan GM mencatat untuk unit mana pun
  (Turtle atau Eddo); dari kalender sebuah unit, pesanan dimulai di unit itu.
  Keuangan hanya melihat.
- **Tambah banyak** dan hasil bacaan pesan memakai layar pemeriksaan yang sama:
  tiap baris bisa diubah, yang tidak terbaca berbingkai merah, dan tidak ada
  yang tersimpan sebelum Simpan. Harga dibiarkan kosong bila tidak tertulis
  (pesanan agen ditandai belum berharga), dan bentrok diberi peringatan.

**Membaca pesan.** Teks yang ditempel dibaca di peramban tanpa dikirim ke mana
pun, dengan pola umum: tanggal (beberapa penulisan, termasuk rentang "12-15 Nov"
dan "check in / check out"), nama setelah "atas nama" atau "a/n", jumlah tamu,
dan nama kamar. **Format pesan Stay Raja Ampat belum diketahui**, jadi tidak ada
yang ditebak dari satu format; kirim dua tiga contoh pesan aslinya (tanpa data
sensitif) untuk disetel. Uji: `npm run uji`.

**Membaca screenshot** memakai model AI dengan kemampuan gambar lewat
`/api/baca-pesan`. **Mati sampai `ANTHROPIC_API_KEY` diisi** di panel Hostinger.
Perlu diketahui sebelum mengaktifkan: gambar (berisi nama dan nomor tamu) dikirim
ke layanan itu, tiap pembacaan berbiaya di akun pemilik kunci, dan hasilnya
tetap hanya usulan. Dibatasi 20 pembacaan per 10 menit per akun, 5 MB per gambar.
Model bawaan `claude-sonnet-5-5` (ganti lewat `BACA_PESAN_MODEL`).

## Statistik pengunjung website

Menu **Statistik pengunjung**: pemilik, developer, dan GM melihat gabungan dengan
tombol **Semua situs / Turtle / Eddo**; manajer Turtle hanya Turtle, manajer Eddo
hanya Eddo (tanpa tombol pilih, dan server menolak situs lain dengan 403); PR
melihat kedua situs. Staf, keuangan, dan HRD tidak punya menu ini.

Isinya: aktif sekarang (5 menit), hari ini, 7 dan 30 hari terakhir (pengunjung
unik dan tampilan halaman), grafik per hari (7 atau 30 hari, pilih batang untuk
rincian: negara dan halaman teratas), dan asal negara 30 hari.

**Penghitungnya milik sendiri**, di `/api/kunjungan`, dipasang di layout situs
Turtle dan Eddo (`pencatat-kunjungan.tsx`). Tanpa cookie. Alamat IP tidak
disimpan: pengunjung dikenali dalam satu hari lewat sidik acak 16 huruf yang tidak
bisa dilacak ke hari lain. Do Not Track dan Global Privacy Control dihormati,
robot disaring, dan pengelola yang sedang masuk tidak dihitung. Dibatasi 60
pencatatan per menit per alamat. Data di `kunjungan.json` di folder data server
(dibuang setelah 400 hari); **cadangkan folder itu**. Penghitungan mulai dari
tayangnya fitur ini, tidak ada data sebelumnya.

**Negara hanya perkiraan bila server tidak memberinya.** Dipakai header negara
dari server atau CDN bila ada (`cf-ipcountry` dan sejenisnya). Kalau tidak,
diperkirakan dari bahasa peramban: `en-US` berarti US, tetapi bahasa tanpa wilayah
(`en`) tidak diketahui dan dihitung terpisah, tidak ditebak. Belum diketahui
apakah CDN Hostinger mengirim header negara; kalau tidak, angka negara
tetap perkiraan dari bahasa.
Angka beberapa situs dijumlahkan: orang yang membuka kedua situs dihitung dua kali.

## Pengaturan: sakelar sistem lama dan penyiapan Midtrans

Menu **Pengaturan** (bagian Perusahaan) untuk developer, pemilik, dan general manager.

**Sakelar sistem lama.** Menyala (bawaan, seperti sebelum sakelar ada): dashboard
membaca booking dan jadwal Turtle dari sistem staf lama. Mati: Turtle memakai data
dashboard sendiri, dan **sistem lama tidak dipanggil sama sekali** (terbukti: kuota
Apps Script milik client tidak terpakai). Tidak ada data yang dihapus; menyalakannya
lagi membaca sistem lama seperti semula. Siapa yang membalik dan kapan tercatat di
`pengaturan.json`. Sakelar yang sama ada di layar Sistem lama; manajer Turtle
melihat keadaannya tanpa bisa membaliknya. Membalik memuat ulang halaman.
Kalau sistem lama dimatikan, kamar Turtle kembali bisa dicatat dan disambungkan dari
dashboard (yang selama sistem lama menyala tidak bisa).

**Pembayaran Midtrans.** Hanya developer dan pemilik. Layar ini **tidak menyimpan
dan tidak menampilkan kunci**. Yang ditampilkan: apakah server key dan client key
terpasang, bentuknya (sandbox atau produksi, dari awalan), empat huruf terakhir
untuk mengenali kunci mana, mode, peringatan bila kunci tidak cocok dengan mode atau
satu sama lain, URL notifikasi pembayaran untuk ditempel di dashboard Midtrans, dan
tombol **Tes server key**: menanyakan satu pesanan yang tidak ada ke Midtrans.
Kunci yang benar dijawab "tidak ditemukan", yang salah "ditolak". Tidak ada yang
dibuat atau ditagih. Dibatasi 6 kali per menit.

Kunci tetap dipasang di tempat yang sama dengan sebelumnya:
- `MIDTRANS_SERVER_KEY` di variabel environment Hostinger (rahasia).
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` di GitHub Variables, tertanam saat build.
- `MIDTRANS_IS_PRODUCTION=true` hanya untuk kunci produksi.
Kunci Midtrans ada di dashboard Midtrans pada Settings lalu Access Keys, terpisah
untuk sandbox dan produksi. Cobalah sandbox sebelum produksi.
`MIDTRANS_API_URL` opsional, hanya untuk uji dengan Midtrans tiruan.


## Pengaturan: siapa yang boleh mengubah, kunci pembaca screenshot, dan peringatan galat

**Siapa.** Developer dan pemilik sama: mengubah semua pengaturan (sakelar sistem
lama, kunci API, tes koneksi, membersihkan catatan galat) dan akun. General
manager hanya **melihat** Pengaturan, tanpa bisa mengubah apa pun. Penjaganya di
server (`aksesPenuh` di `/api/pengaturan`, `/api/pembaca`, `/api/pembayaran/tes`,
`/api/galat` DELETE), bukan hanya tombol yang disembunyikan. Manajer unit dan
peran lain tidak melihat Pengaturan sama sekali.

**Kunci pembaca screenshot.** Di Pengaturan, kartu "Pembaca screenshot": tempel
kunci Anthropic (berawalan `sk-ant-`, dibuat di console.anthropic.com), Simpan,
lalu Tes kunci (menanyakan daftar model: gratis dan tidak membaca gambar).
Disimpan di `kunci.json` folder data server (izin 600), tulis-saja: tidak pernah
dikirim balik, hanya empat huruf terakhir. Kunci dari dashboard didahulukan atas
`ANTHROPIC_API_KEY` di environment; tombol Hapus mengembalikan ke yang di
environment. Kunci pembayaran Midtrans **tetap** di environment, sengaja.

**Peringatan galat.** Untuk developer, pemilik, dan GM: pita merah di atas tiap
layar ("Ada n galat yang perlu diperiksa", tombol Lihat) dan kartu "Galat dan
peringatan" di Pengaturan. Dua sumber: keadaan yang diperiksa sekarang (kunci
Midtrans bertabrakan, sistem lama menyala tapi belum diatur di server, sambungan
kalender yang gagal dibaca; hilang sendiri begitu diperbaiki) dan catatan galat
`galat.json` (50 terakhir, tujuh hari; pembaca screenshot ditolak atau kena
batas, sistem lama gagal dibaca, notifikasi Midtrans bertanda tangan salah).

## Bentrok kamar: "sudah diselesaikan" dengan solusi untuk kedua tamu

Overbook kadang dibereskan di luar sistem, misalnya dengan kompensasi, tanpa
membatalkan siapa pun. Di jendela bentrok tiap pasangan punya tombol **Sudah
diselesaikan: kedua tamu mendapat solusi**. Tiap tamu wajib punya solusi (tetap
di kamar ini, pindah kamar, kompensasi, ganti tanggal, atau lainnya; kompensasi
dan lainnya wajib dengan catatan), termasuk yang tetap di kamarnya. Tidak ada
booking yang diubah atau dibatalkan.

Bentrok yang selesai keluar dari pita peringatan, penanda kalender, dan
hitungan, dan muncul di kalender sebagai "n bentrok sudah diselesaikan" dengan
tautan Lihat; di sana solusinya terbaca dan bisa **Buka lagi**. Disimpan di
`bentrok-selesai.json` (folder data server), dengan kunci dua id booking dan
rentang malamnya: kalau tanggal booking diubah sesudahnya, rentangnya berubah
dan bentroknya muncul lagi. Booking sistem lama (kamar `lama-…`, milik Turtle)
juga bisa, karena catatannya per pasangan, bukan di bookingnya. API:
`/api/bentrok` (akun yang boleh mencatat pesanan dan memegang unit itu).

## Keuangan & Aset, SDM & Gaji, dan Stok Gudang (per unit)

Tiga layar baru di menu, per unit seperti Kalender (Semua unit, Turtle, Eddo;
Dive Center ikut Turtle). **Semuanya kosong sampai diisi**: nama aset, gaji,
harga barang, dan jumlah stok adalah fakta pengelola, tidak ada data karangan.
Disimpan di `modul-keuangan.json`, `modul-sdm.json`, dan `modul-gudang.json`
(folder data server). Skema dan hitungannya satu: `src/lib/modul.ts`; server
memeriksa tiap bidang, dan rujukan (absensi ke pegawai, mutasi ke barang) harus
menunjuk catatan di unit yang sama. Catatan yang masih dirujuk tidak bisa
dihapus.

**Siapa boleh apa** (`aksesModul` di `peran.ts`, dijaga di `/api/modul/[modul]`):

| | Keuangan | SDM & Gaji | Stok Gudang |
|---|---|---|---|
| Developer, pemilik, GM | tulis | tulis | tulis |
| Manajer unit | tulis, unitnya | tulis, unitnya | tulis, unitnya |
| Keuangan | tulis | hanya lihat | hanya lihat |
| HRD | tidak | tulis | tidak |
| Staf | tidak | tidak | hanya mencatat keluar masuk |
| PR | tidak | tidak | tidak |

Data gaji dan pegawai hanya terlihat oleh yang punya akses SDM. Angka acuan gaji
(iuran) hanya diubah developer, pemilik, GM, dan HRD.

**Keuangan & Aset.** Ringkasan bulanan: pendapatan booking dibaca dari kalender
(yang tiba di bulan itu dan sudah diberi harga; yang belum berharga disebut),
pemasukan dan pengeluaran yang dicatat, penyusutan aset garis lurus, dan laba
bersih perkiraan. Pembelian aset dicatat sebagai pengeluaran tapi tidak
dibebankan di laba (bebannya lewat penyusutan). Aset: harga perolehan, umur
manfaat (0 untuk tanah), nilai sisa, nilai buku.

**SDM & Gaji.** Pegawai, absen harian (pilih status, langsung tersimpan; rekap
bulanan), asuransi dan BPJS per pegawai, inventaris dan kebutuhan pegawai
(seragam, alat, APD; kekurangan × perkiraan harga), dan **estimasi biaya
gaji**: gaji + tunjangan + iuran BPJS perusahaan + cadangan THR, plus perkiraan
yang diterima pegawai (potongan alpa dan iuran pekerja; PPh 21 tidak dihitung).
Peringatan: pegawai tanpa BPJS Kesehatan atau Ketenagakerjaan aktif, gaji di
bawah UMP acuan, asuransi lewat masa berlaku.

**Angka acuan** (tab sendiri, bisa diubah, dengan sumbernya): BPJS Kesehatan 4%
perusahaan dan 1% pekerja (batas upah Rp12 juta); JHT 3,7% dan 2%; Jaminan
Pensiun 2% dan 1%; JKM 0,3%; JKK 0,24% (kelas risiko untuk penginapan **belum
terkonfirmasi**, tanyakan ke BPJS Ketenagakerjaan); UMP Papua Barat Daya 2026
Rp3.766.000 (Raja Ampat memakai angka provinsi). Sumbernya blog dan berita, bukan
situs resmi BPJS, dan beberapa angka berbeda antar sumber (batas upah Jaminan
Pensiun dikosongkan: isi sesuai pengumuman). Cadangan THR (1 bulan gaji per
tahun) dan hari kerja per bulan (26) adalah perkiraan awal yang belum dicek ke
sumber resmi. Cocokkan semuanya sebelum dipakai untuk membayar.

**Stok Gudang.** Daftar barang (tisu, amenitis, linen, kebersihan, dapur, dll),
stok minimum, harga perkiraan, dan pemakaian per kamar terisi per malam.
Stok dihitung dari catatan keluar masuk (Masuk, Keluar, Koreksi stok), dengan
tombol cepat + Masuk dan − Keluar di tiap baris. Status Habis, Menipis, Cukup;
**daftar belanja** sampai stok minimum atau sampai cukup untuk 30 hari ke depan
(kamar terisi dari kalender × pemakaian per malam; barang yang pemakaiannya belum
diisi tidak diperkirakan), dengan perkiraan biayanya.

**Stok menipis di Ringkasan.** Di kartu "Perlu perhatian" muncul satu baris untuk
barang gudang yang habis (merah) atau menipis (kuning), dengan nama beberapa
barang yang paling mendesak dan tombol **Buka gudang** (langsung ke unit yang
bermasalah). Hanya untuk akun yang punya layar Gudang, dan hanya barang di unit
yang boleh dilihat akun itu; tidak muncul bila semua stok cukup.

## Sinkronisasi: satu tipe kamar, beberapa unit

Booking.com hanya memberi tautan iCal untuk tipe kamar berisi satu unit. Tipe
yang dulu punya beberapa unit (misalnya 7) lalu diubah menjadi 1 tetap membawa
booking lamanya di tautan tipe itu, dan semuanya tertumpuk di satu kamar sampai
terbaca sebagai ratusan bentrok.

Di Sinkronisasi kalender, tiap sambungan yang membaca tautan punya bagian
**Satu tipe kamar, beberapa unit**: centang kamar lain di unit yang sama. Tiap
booking yang terbaca lalu ditempatkan di kamar pertama yang kosong (kamar
sambungan itu dulu, lalu yang dicentang), setelah pesanan dashboard dan bacaan
sambungan biasa. Bentrok hanya muncul bila semua kamar itu penuh, karena itulah
kelebihan jual yang sebenarnya. Kamar yang menerima bacaan menulis "menerima
bacaan … dari …" di barisnya.

Tautan ekspor ikut penempatan itu: kamar yang menerima booking tipe lama
memblokir malam itu di tautan ekspornya sendiri, supaya situs tidak menjual
kamar fisik yang sedang ditempati. Bacaan sebuah sambungan tetap tidak pernah
dikirim balik ke sambungan itu. Penempatannya otomatis (`bookingDariLuar` di
`buku.ts`), urutannya tetap selama isinya sama, dan kamar tempatnya bisa berbeda
dari kamar yang benar-benar dipakai tamu.

## Impor daftar pesanan Booking.com

iCal Booking.com tidak membawa nama tamu, harga, atau jumlah kamar: pesanan tiga
kamar terbaca sebagai satu acara. Di Sinkronisasi kalender, tiap sambungan punya
**Impor daftar pesanan**: unduh dari Extranet (Pemesanan, pilih rentang termasuk
yang akan datang, Unduh) lalu pilih berkas `.xls` atau `.csv` itu. Pratinjau
dulu (berapa berlaku dan batal, rentang tanggal, multi-kamar, nilai dan komisi,
berapa acara iCal yang digantikan), lalu **Simpan impor**. Berkas dengan beberapa
tipe unit meminta memilih tipe yang sesuai dengan sambungan itu.

Yang disimpan (`impor-booking.json`, per sambungan, digabung menurut nomor
pemesanan; impor ulang tidak menggandakan): nomor, nama tamu, telepon, tanggal,
status, jumlah kamar dan orang, harga, komisi, negara pemesan, catatan. Alamat
tidak diambil, berkasnya tidak disimpan.

Pemakaiannya (`bookingDariLuar`): tiap pesanan berlaku menjadi booking sebanyak
jumlah kamarnya (harga dibagi rata), dengan nama, telepon, nomor, dan komisi di
catatan; acara iCal dengan check-in dan check-out yang sama digantikan satu
lawan satu. Acara yang tidak punya pasangan (pesanan sesudah ekspor) tetap
terbaca seperti biasa, jadi impor berkala saja supaya lengkap. Bersama "Satu
tipe kamar, beberapa unit", pesanan multi-kamar menempati kamar sebanyak itu dan
ikut memblokir di tautan ekspor kamar-kamar itu. Pendapatan di Keuangan ikut
memakai harganya. Hapus impor mengembalikan kalender ke iCal saja.

Pembaca berkasnya buatan sendiri (`src/lib/server/baca-tabel.ts`: Excel lama
BIFF8 dan CSV), tanpa pustaka luar; `.xlsx` belum didukung.

## Sertifikat magang (SDM & Gaji)

Tab **Sertifikat magang** di SDM & Gaji: daftar pegawai berstatus Magang (dengan
tanda "Selesai, belum bersertifikat" bila tanggal Selesai kerja sudah lewat),
tombol **Buat sertifikat**, dan riwayat sertifikat yang bisa diunduh ulang.

Formulir terisi dari data pegawai (nama, jabatan sebagai posisi, mulai dan
selesai; pegawai kini punya bidang **Selesai kerja**). Nomor diusulkan
`MAGANG-<tahun>-<urut>` dan bisa diubah. Penandatangan, jabatannya, tempat
terbit, dan bahasa (Indonesia, English, atau keduanya) diisi orangnya; yang
terakhir dipakai diingat untuk sertifikat berikutnya. Tersimpan di koleksi SDM
`sertifikat` (isi tersalin, jadi sertifikat lama tidak berubah bila data
pegawai diubah), lalu PDF A4 mendatar dibuat di peramban (jsPDF) dengan logo
unit: Turtle Dive Homestay (Dive Center diterbitkan atas namanya) atau Eddo
Homestay. Huruf di luar Latin-1 (misalnya ń) ditulis tanpa tanda, dan formulir
memberitahukannya. Aksesnya mengikuti SDM: developer, pemilik, GM, HRD, dan
manajer unitnya menerbitkan; keuangan hanya melihat dan mengunduh.

**Tanda tangan, stempel, dan desain sertifikat.** Di tab Sertifikat magang ada
kartu **Tanda tangan dan stempel** per unit (Dive Center memakai milik Turtle):
unggah foto atau pindaian tanda tangan (dengan nama dan jabatan pemiliknya) dan
stempel asli; latar putihnya dibuang di peramban, gambar diperkecil dan disimpan
sebagai PNG di `ttd-stempel.json` (`/api/ttd`). Mengganti dan menghapus hanya
developer, pemilik, dan general manager; yang punya akses SDM melihat dan
memakainya. Tanda tangan **hanya tercetak di bawah nama pemiliknya**: dengan
penandatangan lain sertifikat dicetak tanpa gambar tanda tangan (untuk
ditandatangani basah), dan formulir mengatakannya. Tanpa gambar, tempatnya
dibiarkan kosong; tidak ada tanda tangan atau stempel buatan.

Desainnya: bingkai berlapis (warna unit dan emas), ornamen sudut emas, judul
berjarak huruf, pembatas emas, nama dalam huruf serif miring, segel medali
"MAGANG <tahun>" di kiri bawah, stempel yang menimpa garis tanda tangan dengan
sedikit tembus pandang, dan gelombang laut tipis di kaki.

## Sistem lama: jadwal dive center terpisah, dan pencocokan dengan Booking.com

Sakelar sistem lama di Pengaturan (dan layar Sistem lama) kini dua:
- **Booking sistem lama di kalender** (`sistemLamaAktif`): seperti dulu, booking
  dan kamar Turtle di kalender diambil dari sistem lama.
- **Jadwal dive center dari sistem lama** (`jadwalLamaAktif`, bawaan menyala):
  sistem lama tetap dibaca untuk jadwal diving, snorkeling, kursus, trip, dan
  transport di kalender (Jadwal Dive Center), dan untuk pencocokan, walau
  booking-nya tidak dipakai di kalender. `/api/sistem-lama` lalu menjawab dengan
  `pakaiDiKalender: false`. Keduanya mati: sistem lama tidak dipanggil sama
  sekali.

**Cocokkan Booking.com dengan sistem lama** (layar Sistem lama,
`/api/sistem-lama/cocok`): tiap pesanan Booking.com yang diimpor dan belum
selesai dicari di sistem lama lewat nomor konfirmasi, atau nama (satu kata yang
sama) dan check-in (selisih paling lama sehari). Hasil: cocok, tanggal berbeda,
jumlah kamar kurang, belum ada di sistem lama, batal di Booking.com tapi masih
ada di sistem lama, dan yang hanya ada di sistem lama. Tiap tamu yang cocok
membawa kamar di sistem lama dan jadwal dive center-nya (sesi pada tanggal
menginapnya yang memuat kamarnya). Bisa diunduh sebagai CSV. Hanya membaca.

## Kalender: detail tanggal, jadwal dive center, dan catatan jemputan

**Klik tanggal** (di kalender kamar atau kalender dive center): panel kanan
langsung menampilkan tanggal itu di paling atas (tidak lagi tenggelam di bawah
panel pesanan): ringkasan kamar terisi dari jumlah kamar aktif unit itu,
jumlah check-in dan check-out, daftar yang menginap malam itu, yang check-out
pagi itu, kamar kosong, dan sesi dive center. Hanya unit yang sedang dibuka
(Turtle tidak tercampur Eddo; Dive Center ikut Turtle).

**Kalender jadwal dive center** di bawah kalender kamar (Turtle dan Semua unit):
bulan yang sama, sesi diving, snorkeling, kursus, trip, dan transport dari
sistem lama dengan jumlah tamu, berwarna per kegiatan. Pil sesi tidak lagi
digambar di sel kalender kamar Turtle; di kalender Dive Center tetap.

**Catatan jemputan** per tamu, seperti di sistem lama: di rincian booking,
"Perlu dijemput" atau "Tidak perlu", dengan catatan jam dan tempat. Disimpan
terpisah dari booking (`catatan-tamu.json`, `/api/catatan-tamu`, kunci id
booking), jadi bisa juga untuk tamu Booking.com dan iCal. Lencana "Jemput: …"
atau "Tanpa jemput" tampil di daftar check-in dan check-out dan di panel
tanggal. Yang boleh mencatat: akun yang boleh mencatat pesanan; yang lain melihat.
