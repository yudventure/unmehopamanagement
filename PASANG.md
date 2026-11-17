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
| Manajer unit | Ringkasan, Kalender, Properti & Kamar, hanya untuk unitnya (Turtle Homestay, Eddo Homestay, atau Dive Center). Tanpa angka rupiah |
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
| Turtle Homestay | Kalender, Laporan, Properti & Kamar, Sinkronisasi kalender, Sistem lama |
| Eddo Homestay | Kalender, Laporan, Properti & Kamar, Sinkronisasi kalender |
| Dive Center | Kalender (jadwal selam). Tidak punya kamar |
| Perusahaan | Website, Pengguna & Peran |

Memilih sebuah unit membatasi kalender, laporan, kamar, dan sinkronisasi ke unit
itu saja, dan judul **Unit** tampil di atas halaman. Peran lain hanya melihat
bagiannya: manajer unit dan staf hanya bagian unit di kolom **Akses properti**
akunnya, keuangan hanya Laporan dan Kalender, HRD hanya Pengguna, PR hanya
Website. Bagian yang hanya satu terbuka sejak awal, yang lain terlipat.
