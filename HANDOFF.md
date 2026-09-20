# HANDOFF — Unmehopa Management

Catatan serah terima antar sesi Claude Code. Dokumen ini merekam **apa yang
sudah jadi, bagaimana menjalankannya, dan apa yang tersisa**.

Repo GitHub: `yudventure/unmehopamanagement` (private).

---

## 1. Apa itu proyek ini

**Unmehopa Management** adalah nama brand sekaligus nama repo — webapp internal
pengelolaan booking homestay di Raja Ampat, Papua Barat Daya. (Sampai Agustus
2026 produk ini bernama "Rumah Papua Booking Manager"; nama itu masih muncul di
berkas prototype di `project/` dan di transkrip desain, yang sengaja tidak
diubah karena arsip.)

Konteks bisnisnya: pemilik (Yud) mengelola dua homestay sendiri —
**Turtle Dive Homestay** (10 bungalow, Mansuar Kecil / Pulau Kri) dan
**Eddo Homestay** (5 rumah, Yenbuba, Pulau Mansuar). Booking masuk dari empat saluran sekaligus:
Booking.com, Traveloka, Agoda, dan WhatsApp/walk-in.

Masalah yang dipecahkan (dari PRD di `project/uploads/PRD-booking-manager-homestay.md`):

1. **Double booking** — kamar yang sama terjual di dua platform karena kalender
   tidak sinkron; booking WhatsApp hanya tercatat di chat.
2. **Tidak ada gambaran okupansi** — harus buka 3–4 aplikasi untuk tahu kamar
   mana yang kosong.
3. **Pembayaran WA tidak ter-track** — transfer hanya dicek di mutasi rekening.
   (Sejak Agustus 2026 aplikasi tidak lagi melacak status bayar sama sekali —
   lihat penyimpangan no. 8.)
4. **Tidak ada data untuk keputusan bisnis** — pendapatan per platform/kamar/musim
   tidak terekam.
5. **Sinyal internet pulau tidak stabil** — aplikasi harus ringan.

Solusinya: satu kalender terpadu sebagai *single source of truth* internal,
dengan sinkronisasi iCal dari OTA plus input manual untuk WhatsApp.

Antarmuka sepenuhnya **Bahasa Indonesia** (NF3 di PRD). Dua peran: **Owner**
(akses penuh + laporan keuangan) dan **Staf** (tanpa angka rupiah sama sekali).

### Asal-usul kode

Repo ini berawal dari **handoff bundle Claude Design** (commit `ab69939`):
prototype HTML/CSS/JS yang dibuat pemilik di claude.ai/design, lengkap dengan
transkrip percakapan desainnya. Commit berikutnya adalah **port prototype itu
ke Next.js**. (Commit `ab69939` sendiri sudah tidak ada di repo ini — lihat
bagian 4 soal histori yang hilang. Berkas prototype-nya tetap ada di
`project/`.)

Sumber desain — jangan dihapus, masih jadi acuan:

| File | Isi |
|---|---|
| `project/Booking Manager Homestay.dc.html` | Prototype yang diimplementasikan (spec visual) |
| `project/Handoff Teknis Booking Manager.dc.html` | Skema DB, daftar endpoint, alur iCal, urutan 10 minggu |
| `project/uploads/PRD-booking-manager-homestay.md` | PRD lengkap (F1–F7, NF1–NF7) |
| `chats/chat1.md` | Transkrip sesi desain — di sini letak *intent*-nya |
| `project/README-handoff.md` | Instruksi bundle handoff aslinya |

---

## 2. Apa yang sudah dibangun

**Status: UI lengkap, data seed di memori.** Semua layar dan interaksi jalan.
Belum ada database, autentikasi asli, maupun sinkronisasi iCal — ini keputusan
scope yang disepakati, bukan pekerjaan yang terlewat.

### Fitur yang sudah berfungsi

- **Halaman login dua panel** — pilih peran Owner/Staf (email terisi otomatis),
  panel foto kanan dengan overlay gradient dan tiga angka ringkas.
- **Kalender bulanan** (Agustus 2026) — grid 6×7, penghitung okupansi per hari
  (`terisi/kapasitas`), chip booking berwarna per saluran di setiap malam yang
  ditempati, collapse "+N lagi", dan banner bentrok kamar.
- **Peninjauan bentrok** — tombol "Tinjau" membuka modal berisi **kedua**
  booking yang bertabrakan berdampingan (saluran, kode, tanggal, lama, nilai,
  catatan), dengan tombol *Pertahankan & tandai Check-in* dan *Batalkan booking*
  di masing-masing. Membatalkan salah satu langsung menghapus pasangan itu; kalau
  tidak ada bentrok tersisa, modalnya menutup sendiri.
- **Check-in terdekat** — bilah kanan mendaftar kedatangan dari hari ini
  sampai 7 hari ke depan (`UPCOMING_DAYS` di `booking-manager.tsx`), terurut
  paling dekat dulu, lengkap dengan rentang menginap dan penanda "Hari ini" /
  "Besok".
- **Daftar per tanggal** — klik bidang atas sel (angka tanggal, penghitung
  okupansi, dan ruang kosong di antaranya) atau tautan "+N lagi", dan bilah
  kanan menampilkan **semua** tamu yang menginap hari itu, termasuk yang tidak
  muat sebagai chip. Yang bisa diklik hanya bidang atas itu, bukan seluruh sel:
  sisanya diisi chip, yang punya aksinya sendiri. Di bawah daftar tamu ada
  **Kamar kosong** — nama kamar yang bebas malam itu, untuk persiapan.
  Kamar renovasi disebut terpisah, bukan dihitung sebagai kosong.

  Daftar ini dibaca dari seluruh booking dalam scope, **bukan dari hasil
  filter** — pertanyaannya operasional ("siapa menginap, kamar mana bebas") dan
  jawabannya tidak boleh berubah karena filter saluran sedang menyala.
  Badge di bilah kanan menunjukkan **asal booking** — OTA mana, atau
  WA / langsung.
- **Drawer detail booking** — transisi status (Tentative → Confirmed →
  Checked-in → Checked-out, atau Cancelled), total menginap, jejak audit.
- **Form booking cepat** — pilih properti/kamar/tanggal dengan **cek
  ketersediaan langsung**, simpan sebagai Tentative atau Confirmed.
  - Panelnya tidak berhenti di "kamar ini sudah terisi". Di bawahnya
    **kamar mana saja yang kosong sepanjang rentang itu**, masing-masing
    berupa tombol yang langsung memindahkan booking-nya ke sana. Kalau cuma
    disebutkan bentroknya, pemilik harus mencoba sembilan kamar lain satu per
    satu lewat dropdown yang tidak mengatakan apa-apa soal mana yang kosong.
  - Yang dicek adalah **seluruh rentang**, bukan satu malam: sebuah menginap
    bertabrakan kalau mulainya sebelum check-out dan selesainya sesudah
    check-in (`freeRooms()` di `derive.ts`).
  - Kalau tidak ada satu pun yang kosong, panelnya bilang begitu dan menyuruh
    ubah tanggal, bukan menampilkan daftar kosong.
  - Kamar yang sedang **renovasi** disebut terpisah dan tidak masuk daftar
    kosong. Masih bisa dipilih lewat dropdown, karena pemilik mungkin memang
    mau memesan kamar yang sebentar lagi buka, tapi nama di daftar "kosong"
    itu sifatnya saran jadi yang direnovasi tidak ditaruh di sana.
- **Laporan** — KPI (okupansi, pendapatan kotor, ADR, lama menginap), bar
  pendapatan per saluran, okupansi per kamar, estimasi komisi OTA, plus
  navigasi bulan yang berbagi state dengan Kalender.
  - **Dua grafik okupansi.** *Tren per bulan* (12 kolom, 8 bulan ke belakang
    dan 3 ke depan) menjawab kapan musim ramai dan kapan sepi. *Okupansi
    harian* memperlihatkan bentuk satu bulan, lengkap dengan garis rata-rata
    dan kolom akhir pekan yang ditandai. Keduanya punya readout yang mengikuti
    kursor dan tombol **Tabel** — tidak ada angka yang hanya bisa dibaca lewat
    hover.
  - **Bandingkan dengan bulan lalu** — tombol pengalih; saat aktif tiap kartu
    KPI mendapat selisih bertanda terhadap bulan sebelumnya, dan bulan
    pembanding ikut ditandai di grafik tren.
  - **Ekspor CSV** — ringkasan + tren + okupansi harian + okupansi per kamar +
    seluruh booking bulan itu, satu baris per booking. Pemisah `;` dengan BOM
    UTF-8 supaya Excel berlokal Indonesia membacanya benar.
  - **Unduh PDF** — ringkasan A4 satu halaman (KPI, kedua grafik, tabel
    saluran dan kamar) lewat jsPDF yang di-`import()` saat tombolnya ditekan,
    jadi tidak ikut bundel awal. Rincian per booking sengaja hanya ada di CSV.
- **Properti & Kamar** — kartu per properti, tabel kamar dengan kapasitas,
  harga per malam, jumlah feed iCal terdaftar, dan status Aktif/Renovasi.
  Owner punya kolom **Aksi** berisi tombol Edit per kamar: nama, kapasitas,
  harga, dan status diubah di dalam modal lalu disimpan sekaligus — tidak ada
  lagi field harga yang langsung menulis saat diketik. Harga baru dipakai
  booking berikutnya; booking lama tetap memakai harga saat disimpan.
- **Sinkronisasi OTA** (Owner saja) — tab untuk mendaftarkan feed iCal per
  kamar, dua arah. **Impor**: pilih OTA + tempel URL dari extranet, dengan
  validasi bentuk URL dan tolak duplikat. **Ekspor**: buat URL bertoken per
  kamar (token 16 byte dari `crypto.getRandomValues`, dicetak di event handler
  bukan saat render supaya halaman prerender tidak mismatch), tombol salin dan
  reset token. Panel iCal di sidebar membaca jumlah feed terdaftar dari sini.

  **Belum ada yang menarik atau menyajikan feed** — tidak ada backend. Tiap
  feed berbunyi "belum pernah ditarik", dan ada peringatan agar URL ekspor
  jangan dulu dipasang di extranet karena belum bisa diakses OTA.
- **Pengguna & Peran** — daftar akun, nonaktifkan/aktifkan, modal undang
  pengelola per properti.
- **Filter & pencarian** — filter properti dan saluran di sidebar, pencarian
  nama tamu / kamar / kode booking di header.
- **Pembatasan peran** — Staf hanya melihat Kalender dan Properti & Kamar,
  semua nominal rupiah disembunyikan. **Peran diambil dari akun pemilik email**,
  bukan dari tombol Owner/Staf di halaman login — tombol itu hanya mengisi
  alamat demo. Email tak terdaftar dan akun nonaktif ditolak saat login.
  **`scope` pengguna juga ditegakkan**: Staf yang ditugaskan ke satu homestay
  hanya melihat kamar, booking, bentrok, filter, dan pilihan properti di form
  untuk homestay itu saja.
- **Responsif** — di bawah 900px sidebar jadi baris nav horizontal dan kalender
  bisa digeser; drawer jadi overlay penuh di viewport ≤1160px saat ada booking
  terpilih.

### Struktur file penting

```
src/
  app/
    globals.css               ★ token desain — seluruh palet ada di sini
    layout.tsx                font DM Sans + JetBrains Mono, metadata
    page.tsx                  render <BookingManager />   ← dashboard, di /
    turtle/page.tsx           render <TurtleSite />        ← website publik, di /turtle
    api/enquiry/route.ts      terima pesan dari website, kirim email ke owner
    api/content/route.ts      baca/tulis content/site.json lewat GitHub API
    api/rates/route.ts        kurs mata uang, di-cache 6 jam
    turtle/dive/[pack]/       halaman detail per paket selam (6, prerender)
    turtle/about/             halaman profil homestay
  components/
    booking-manager.tsx       ★ SELURUH state aplikasi + view model ada di sini
    top-bar.tsx               logo, pencarian, tombol booking baru, menu profil
    sidebar.tsx               nav, filter properti, filter saluran, status iCal
    booking-drawer.tsx        panel detail booking
    booking-form-modal.tsx    form input booking cepat
    conflict-modal.tsx        tinjau bentrok kamar berdampingan
    dashboard-rail.tsx        bilah kanan: check-in terdekat / daftar per tanggal
    invite-modal.tsx          modal undang pengelola
    room-edit-modal.tsx       modal ubah detail kamar (nama/kapasitas/harga/status)
    scenery.tsx               kit SVG bersama: karst, karang, perahu, orang, satwa
    web/site.tsx              seluruh halaman website publik
    web/scenes.tsx            ilustrasi website (hero senja, reef, dermaga)
    web/enquiry-modal.tsx     popup pesan: nama, WA, email, rencana, catatan
    web/about.tsx             isi halaman profil homestay
    web/dive-detail.tsx       isi halaman detail paket selam
    web/journey-map.tsx       peta sketsa + popup lokasi
    web/journey-scenes.tsx    ilustrasi 4 langkah, menjorok keluar kartu
    web/season-scenes.tsx     laut beranimasi di balik kartu musim
    web/dive-diagrams.tsx     diagram pembagian hari + meter kedalaman
    web/price.tsx             harga rupiah + baris konversi, pemilih mata uang
    login-screen.tsx          login dua panel + panel foto
    screens/
      calendar-screen.tsx     grid kalender + chip booking
      report-screen.tsx       KPI, pendapatan per saluran, okupansi per kamar
      report-charts.tsx       grafik tren bulanan + okupansi harian (+ tabelnya)
      property-screen.tsx     kartu properti + tabel kamar
      sync-screen.tsx         daftar feed iCal impor/ekspor per kamar
      users-screen.tsx        tabel pengguna & peran
      website-screen.tsx      CMS: kontak + harga selam website publik
    ui/
      modal.tsx               shell modal + class field form
      pill.tsx                badge status
  hooks/
    use-viewport-width.ts     lebar viewport terukur (bukan media query)
    use-site-prefs.ts         bahasa, mata uang, dan kurs (dipakai dua rute)
  lib/
    data.ts                   ★ seed kamar/booking/pengguna (LCG deterministik)
    pricing.ts                satu-satunya tempat nilai booking dihitung
    derive.ts                 sel kalender, statistik bulan, tren, deteksi bentrok
    report-export.ts          penyusun CSV + penggambar PDF laporan
    web-content.ts            ★ seluruh teks website publik, tujuh bahasa
    site-config.ts            pembaca content/site.json + penjaga bentuknya
    currency.ts               daftar mata uang, konversi, pembulatan
    dive-detail.ts            bentuk hari & kedalaman tiap paket (lihat catatannya)
    format.ts                 tanggal & rupiah (id-ID)
    pills.ts                  warna badge per status
    types.ts                  tipe domain
content/
  site.json                   kontak + harga selam, ditulis oleh tab Website
public/
  hero.jpg 1.jpg 2.jpg 3.jpg  foto website (lihat assets/README.md)
  logo.png                    logo homestay, juga jadi favicon /turtle
```

Dua file bertanda ★ adalah tempat memulai kalau mau paham cepat.

### Dua hal yang perlu diketahui sebelum mengubah kode

**Data seed bersifat deterministik dan sudah diverifikasi.** `lib/data.ts`
memakai LCG ber-seed tetap (`seed = 7`), hasilnya sudah **dibandingkan
field-per-field dengan generator prototype aslinya**: 12 kamar dan 61 booking
identik. Artinya semua angka okupansi dan pendapatan di layar sama persis
dengan yang dilihat pemilik di Claude Design. **Kalau mengubah `seed`, urutan
`rnd()`, atau urutan field, semua angka akan bergeser** dan verifikasi itu
batal. Termasuk satu bentrok iCal yang disengaja di Turtle 03 pada 19–23
Agustus, untuk menguji banner konflik (PRD F2.4).

**Pergantian layout dipicu lebar terukur, bukan media query.** Drawer harus
jadi overlay setiap kali sidebar (246px) + drawer (352px) menyisakan kolom
konten di bawah ~560px — keputusan yang bergantung pada viewport *dan* apakah
ada booking terpilih, jadi CSS saja tidak cukup. Logikanya di
`use-viewport-width.ts` dan konstanta `NARROW_MAX` / `DRAWER_OVERLAY_MAX` di
`booking-manager.tsx`. Ini perbaikan yang memang diminta di akhir sesi desain —
jangan diganti jadi media query tanpa menguji kasus drawer terbuka di ~1000px.

### Tampilan HP

Ada **tiga** ambang, bukan dua. Yang ketiga, `PHONE_MAX = 640`, dibaca dari
lebar viewport saja dan tidak pernah dari drawer — membuka satu booking di
laptop 1000px tidak boleh mengubah kalender jadi versi HP.

| Lebar | Yang berubah |
|---|---|
| > 900 | sidebar hijau, kalender berkartu nama |
| 641–900 | sidebar jadi baris tab, kalender masih berkartu nama (700px, digeser) |
| ≤ 640 | top bar dua baris, kalender jadi peta kepadatan, tabel jadi kartu |

**Kalender di HP bukan kalender yang sama yang dikecilkan.** Kartu nama butuh
sekitar 100px per kolom; tujuh kolom berarti 700px, dan di layar 360px itu
artinya tiga setengah kolom terlihat dan sisanya di balik geseran samping yang
tidak diberitahukan ke siapa pun — sebuah tampilan bulan yang tidak bisa
menampilkan satu bulan. Versi HP menggantinya dengan satu bar kepadatan per
hari (`OccupancyMeter` di `calendar-screen.tsx`): panjang bar = terisi/kapasitas,
warna hanya membedakan dua hal yang layak menyela — penuh (emas) dan bentrok
(merah). Nama tamunya satu ketukan di bawahnya, lewat daftar tanggal yang
memang sudah ada.

**Tabel jadi kartu di bawah 640px.** Tabel kamar (704px) dan tabel pengguna
(640px) sama-sama menaruh kolom aksinya di luar layar, jadi di HP tombol Edit
dan tombol Nonaktifkan **tidak terlihat sama sekali** padahal paragraf di
atasnya menyuruh menekannya. Sekarang satu kartu per baris, tidak ada yang di
luar bingkai.

**`useViewportWidth` memakai ResizeObserver, dan itu bukan hiasan.** HP tidak
punya layout viewport yang sudah pasti saat mount: browsernya menerapkan
`initial-scale` dan melipat chrome-nya sendiri satu-dua frame kemudian, dan
tidak selalu memicu event `resize` saat melakukannya. Terukur di layar 390px:
bacaan pertamanya **670** dan tidak ada apa pun yang mengoreksinya, jadi aplikasi
menghabiskan seluruh sesi dengan layout tablet di HP. Observer-nya melihat
perubahan itu baik ada event-nya maupun tidak.

### Warna teks: empat token digelapkan

Empat token di `globals.css` digelapkan karena gagal AA (4.5:1) sebagai teks:

| Token | Dari | Jadi | Rasio |
|---|---|---|---|
| `--color-slate-soft` | `#8b8274` | `#7a7264` | 3,79 → 4,75 |
| `--color-slate-mute` | `#9d9486` | `#7d7466` | 2,99 → 4,55 |
| `--color-teal` | `#2f8a63` | `#2b7f5b` | putih di atasnya 4,25 → 4,90 |
| `--color-danger` | `#dc2626` | `#cf2020` | 4,43 → 4,96 |

`slate-faint` dan `slate-ghost` tidak digelapkan; yang diubah adalah
pemakaiannya — sembilan tempat yang memakainya untuk **teks** dialihkan ke
`slate-mute`. Keduanya sekarang hanya untuk garis, cincin ikon, dan rule.

Tangga abu-abunya jadi lebih rapat dari sebelumnya. Itu memang konsekuensinya:
tiga tingkat yang dua di antaranya tidak terbaca bukan tangga, cuma kelihatan
seperti tangga. Diukur di enam tab pada 390px: 0 kegagalan, kecuali label yang
sedang berada di bawah gradien tepi baris tab — dan memang itu gunanya gradien
itu.

### Penyimpangan yang disengaja dari prototype

Enam belas hal berikut sengaja berbeda dari prototype. Masing-masing satu baris
kalau mau dikembalikan:

1. `iso()` memformat tanggal kalender lokal, bukan `toISOString().slice(0,10)`.
   Versi prototype menggeser semua tanggal mundur satu hari di Asia/Jayapura —
   kelihatan benar hanya karena design tool berjalan di UTC.
2. Garis bawah header sekarang tampil. Prototype menulis `borderBottom`
   (camelCase) di dalam string CSS, jadi tidak pernah ter-render.
3. ADR ikut disembunyikan bersama angka rupiah lain di mode Staf; prototype
   membocorkannya.
4. `layarAwal` sekarang berlaku setelah login (sebelumnya kode mati, karena
   login selalu memaksa ke Kalender).
5. Modal tertutup dengan Escape / klik backdrop; login submit dengan Enter.
6. Tombol Ekspor CSV dan Bandingkan bulan memberi tahu bahwa fiturnya belum
   ada, bukan diam saja saat diklik.
7. **Booking muncul di setiap malam yang ditempatinya**, bukan hanya di hari
   check-in. Chip-nya dua baris: nama tamu dengan penghitung malam `2/5` di
   kanan, lalu nama kamar di bawahnya — pemisahan ini yang membuat nama kamar
   tidak pernah terpotong. Chip diurutkan per kamar supaya satu booking berada
   di ketinggian yang kurang lebih sama dari hari ke hari; tanpa itu mata tidak
   bisa mengikutinya. `bookingPerHari` naik dari 3 ke 4 karena satu hari kini
   memuat lebih banyak chip.
8. **Tidak ada status pembayaran sama sekali.** Booking baru masuk kalender
   setelah dibayar, jadi tidak ada lawan dari "lunas" untuk ditampilkan. Yang
   ikut hilang: tipe `PaymentStatus`, field `pay`/`paid`, `payColors()`, seksi
   "Belum lunas" di bilah kanan, serta baris "Sisa" dan tombol "Catat
   pelunasan" di drawer. Nominal booking tetap ada sebagai `total`.

   **Satu `rnd()` di `seedBookings` sengaja dibiarkan menyala tanpa dipakai.**
   Dulu ia menentukan status bayar. Menghapusnya akan menggeser seluruh undian
   sesudahnya dan mengacak ulang 61 booking, sehingga kecocokan field-per-field
   dengan generator prototype batal. Jangan dihapus.

9. **Bentrok dihitung dari tanggal, bukan dari flag.** Prototype menandai dua
   booking seed dengan `conflict: true` dan banner-nya mencetak kalimat tetap
   "20–22 Agustus". Sekarang `findConflicts()` di `derive.ts` membandingkan
   rentang tanggal per kamar, jadi double booking hasil input manual ikut
   ketahuan. Sengaja dihitung dari **seluruh** booking, bukan yang lolos filter
   sidebar — filter tidak boleh bisa menyembunyikan kamar yang terjual dua kali.

   Efeknya: seed ternyata punya **dua** bentrok, bukan satu. Selain pasangan
   yang disengaja (BK9001 vs BK9002 di Turtle 03), BK9002 juga bertabrakan
   dengan BK0014 pada 22 Agustus. Flag statis dulu menyembunyikannya.

---

## 3. Stack & cara menjalankan

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS v4 — palet sebagai token `@theme` di `globals.css`; ganti tema = ganti blok itu |
| Font | DM Sans + JetBrains Mono via `next/font/google` |
| State | React `useState`/`useMemo` di satu komponen root |
| Data | Seed di memori — belum ada database |
| PDF | `jspdf` — satu-satunya dependensi runtime di luar Next/React, dimuat lewat `import()` dinamis saat tombol Unduh PDF ditekan |

Stack ini sesuai keputusan di transkrip desain (`chats/chat1.md`): Next.js +
TypeScript + Tailwind, nanti dilanjut PostgreSQL + Prisma + Auth.js.

```bash
npm install
npm run dev          # http://localhost:3000

npm run build        # build produksi
npm run start        # jalankan hasil build
npm run typecheck    # tsc --noEmit
```

**Belum ada test runner.** `npm run typecheck` dan `npm run build` adalah satu-
satunya gerbang mutu saat ini; keduanya lolos bersih per commit terakhir.
Menambahkan Vitest + Testing Library adalah pekerjaan yang masuk akal
berikutnya (lihat TODO).

### Masuk

Kata sandi diperiksa di server, di `/api/login`, dan yang dibandingkan adalah
`DASHBOARD_PASSWORD`. **Tanpa variabel itu tidak ada yang bisa masuk**, dan
layarnya mengatakan begitu apa adanya ("Login belum disiapkan di server").

Emailnya tidak lagi terisi otomatis. Kedua kotaknya kosong dengan tulisan abu
abu, dan tombol *Owner* / *Staf* di bawah tombol Masuk cuma mengisikan alamat
ketika ditekan — bukan sebagai keadaan awal. Alasannya dua: layar masuk yang
sudah berisi alamat orang lain mengumumkan nama akun di sini kepada siapa pun
yang membukanya, dan staf harus menghapus alamat pemilik sebelum mengetik
alamatnya sendiri.

| Peran | Email | Akses |
|---|---|---|
| Owner | `yud@rumahpapua.id` | Kalender, Laporan, Properti & Kamar, Pengguna & Peran + semua rupiah |
| Staf | `marthen@rumahpapua.id` | Kalender, Properti & Kamar; tanpa nominal uang |

Ada tombol mata di kotak kata sandi untuk menampilkan isinya. Mati secara
default dan tidak diingat antar kunjungan.

Keluar lewat kartu profil kanan atas → **Keluar dari akun**.

**Kalau login sepertinya berhasil tapi layarnya kembali ke halaman masuk**,
itu bug yang sudah diperbaiki, bukan salah ketik: kunci penanda tangan cookie
dulu dibuat acak per modul. Next membundel halaman dan route handler secara
terpisah, jadi keduanya memegang kunci yang berbeda — `/api/login` menjawab
200 dan memasang cookie, lalu halaman berikutnya menolak cookie itu tanpa
sepatah kata pun. Sekarang kuncinya disimpan di `globalThis` supaya satu
proses hanya punya satu, dan `SESSION_SECRET` tetap sebaiknya diisi di
produksi supaya sesi selamat dari deploy.

### Foto panel login

Panel kanan halaman login adalah slot foto kosong. Taruh gambar di `public/`,
lalu set di `.env.local`:

```
NEXT_PUBLIC_LOGIN_HERO=/login-hero.jpg
```

Tanpa variabel itu, panel menampilkan bingkai kosong sesuai desain (tidak ada
request 404).

---

## 4. Kode sudah aman di GitHub — dan satu hal yang hilang

**Selesai.** Kode sekarang ada di GitHub, di branch
`claude/lanjutkan-disini-gqgaao`. Bagian ini dulunya mencatat kegagalan push;
disimpan dalam bentuk ringkas karena menjelaskan kenapa histori git-nya
terlihat aneh.

Ringkas ceritanya: sesi yang membangun aplikasi ini dimulai dari *bundle
handoff lokal* (folder git tanpa remote), bukan dari clone GitHub, jadi git
proxy sesi itu tidak pernah memasang kredensial GitHub. Jaringan sampai
(`curl https://github.com` → 200), tapi setiap request git keluar tanpa
autentikasi (→ 401). Push, `ls-remote`, maupun `clone` semuanya gagal dengan
`could not read Username`.

Jalan keluarnya: pemilik mengunggah seluruh source sebagai
`unmehopamanagementsource.zip` lewat antarmuka web GitHub (commit `fc07205`),
lalu menghapusnya (commit `dda7d04`). Sesi berikutnya — yang lahir dari clone
GitHub dan karena itu punya kredensial — mengeluarkan kembali snapshot dari
blob zip di dalam histori dan meng-commit-nya sebagai berkas sungguhan.

**Konsekuensi yang perlu diketahui: histori git sesi pembangunan hilang.**
Zip itu hanya berisi snapshot berkas, tanpa folder `.git`. Jadi commit-commit
lama — termasuk commit bundle Claude Design `ab69939` yang disebut di bagian 1
dan branch `implement-booking-manager` — **tidak ada di repo ini.** Yang
tersisa hanyalah keadaan akhir kode. Kalau butuh histori itu, sumbernya adalah
file `unmehopamanagement.bundle` (~1,7 MB) yang sudah dikirim ke pemilik:

```bash
git clone unmehopamanagement.bundle unmehopamanagement-histori
```

Sejak sekarang push biasa sudah bekerja — tidak perlu lagi lewat zip.

---

## 5. TODO / langkah selanjutnya

### Sesuai roadmap di dokumen handoff teknis

1. **Database.** PostgreSQL + Prisma. Yang paling penting: constraint anti-overlap
   di level database (`daterange` + `EXCLUDE USING gist` per kamar) — jangan
   hanya validasi di aplikasi. Skema lengkap ada di
   `project/Handoff Teknis Booking Manager.dc.html`.
2. **Autentikasi asli.** Auth.js (NextAuth) credentials provider + `bcrypt` +
   session cookie httpOnly. **Peran harus dicek di setiap API route** — saat ini
   pembatasan Owner/Staf hanya menyembunyikan menu di UI, itu tidak aman.
3. **Sinkronisasi iCal.** Impor (`node-ical`) dan ekspor (`ics`) per kamar
   dengan token rahasia, simpan `external_uid` supaya sinkron ulang tidak
   menduplikasi booking, plus tabel log sinkron (PRD F3.5). Panel "12 menit
   lalu / 5 feed aktif" dan jumlah feed per kamar sekarang masih statis.
4. **Cron penarik iCal** tiap 15–30 menit, endpoint dilindungi secret header.

### Fitur yang belum ada

5. Ekspor CSV/Excel laporan (F6.5) — tombolnya sudah ada, aksinya belum.
6. Perbandingan antar bulan di laporan (F6.2).
7. Upload bukti transfer (F5.1) + kompresi gambar di browser.
8. Harga musiman (F1.3) — sekarang baru harga dasar per kamar.
9. Halaman "Hari Ini" khusus staf (F2.5 / Alur D).
10. ~~Pengingat pelunasan H-7 / H-3 (F5.4)~~ — tidak relevan lagi: booking
    baru dicatat setelah dibayar.
11. PWA + cache read-only supaya kalender terakhir terbaca saat offline (NF1).

### Kualitas

12. **Tambahkan test.** Vitest + Testing Library. Prioritas: `lib/derive.ts`
    (perhitungan okupansi/pendapatan dan deteksi bentrok) dan alur simpan
    booking — di situ letak logika bisnis yang paling mudah rusak diam-diam.
13. Tambahkan ESLint (`eslint-config-next`) — sengaja belum dipasang untuk
    memperkecil permukaan instalasi awal.

10. **Tidak ada lagi angka karangan di UI.** Prototype mencetak tiga hal
    sebagai teks mati yang terbaca seolah sistem sudah hidup: panel sidebar
    "Sinkron iCal terakhir — 12 menit lalu · 5 feed aktif, 1 gagal", kolom
    "3 feed aktif" per kamar, dan jejak audit "Diubah terakhir oleh Yud,
    13 Agustus 2026 09.41". Ketiganya diganti keadaan sebenarnya: sidebar
    menyatakan **Belum tersambung**, kolom iCal berbunyi **Belum diatur**, dan
    jejak audit kini distempel `patchBooking` (`updatedAt` / `updatedBy`) —
    hanya muncul kalau booking benar-benar diubah.

11. **Harga dihitung di satu tempat** (`lib/pricing.ts`). Sebelumnya seed
    memakai `tarif × malam × 1,12` untuk OTA sementara form manual memakai
    `tarif × malam` polos, jadi booking Booking.com hasil input manual bernilai
    12% lebih rendah daripada yang identik dari feed. Keduanya kini lewat
    `bookingTotal()`. Angka seed tidak bergeser — rumusnya sama persis.

    Sekalian menutup kebocoran peran: **Staf sebelumnya bisa melihat harga
    kamar** di Properti & Kamar, padahal PRD menyebut Staf tidak melihat
    rupiah sama sekali. Kolom harga sekarang hilang untuk Staf, bukan sekadar
    disamarkan.

12. **Login menentukan peran dari akun, bukan dari pilihan di layar login.**
    Prototype menjalankan `setRole(loginRole)`, jadi masuk dengan alamat Staf
    sementara tombolnya masih "Owner" memberi hak Owner penuh — termasuk
    Laporan, Pengguna & Peran, dan semua angka rupiah. Sekarang `doLogin`
    mencari akun berdasarkan email lalu memakai `account.role`. Sekalian:
    email yang tidak terdaftar dan akun yang dinonaktifkan ditolak, yang
    sebelumnya sama-sama bisa masuk.

13. **`scope` pengguna benar-benar membatasi data, bukan sekadar tulisan.**
    Field itu ada sejak prototype tapi hanya dicetak di tabel Pengguna & Peran,
    jadi Marthen (Staf · Turtle Homestay) tetap melihat dan bisa mengelola Eddo.
    Sekarang `allowedProps` diturunkan dari `scope`, lalu `scopedRooms` /
    `scopedBookings` jadi satu-satunya sumber bagi seluruh view model —
    kalender, bentrok, filter saluran, kartu properti, dan dropdown properti di
    form booking. Scope yang tidak dikenali menghasilkan **kosong**, bukan
    semua: ini batas hak akses, jadi gagal-tertutup.

    Kalau hanya satu properti yang diizinkan, grup filter "Properti" di sidebar
    disembunyikan seluruhnya — daftarnya cuma akan mengulang angka yang sama.

14. **Detail kamar diubah lewat modal, bukan field hidup di tabel.** Prototype
    menaruh input harga di setiap baris: satu ketukan di baris yang salah sudah
    mengubah harga kamar, tanpa konfirmasi dan tanpa cara membatalkan. Sekarang
    tombol **Edit** membuka `room-edit-modal.tsx` yang memegang draf sendiri —
    Escape atau Batal membuangnya, Simpan mengirimkannya sekali lewat
    `saveRoom()` di `booking-manager.tsx`.

    Validasi ikut pindah ke satu tempat: nama dan kapasitas wajib diisi, harga
    harus di atas nol, dan **nama kamar tidak boleh kembar** — nama itulah yang
    dipakai chip kalender, daftar kamar kosong di bilah kanan, dan baris
    check-in, jadi dua kamar bernama sama membuat ketiganya tidak terbaca.

    Tombol Edit hanya muncul untuk Owner; Staf tetap melihat tabel baca-saja
    tanpa kolom Aksi dan tanpa kolom harga. Menandai kamar Renovasi tidak
    membatalkan booking yang sudah ada, jadi modalnya menghitung booking yang
    belum selesai di kamar itu dan memperingatkan sebelum disimpan.

    Sekalian: kolom **iCal** dulu selalu tertulis "Belum diatur" apa pun
    isinya. Sekarang membaca `feeds`, jadi kamar yang sudah didaftarkan di tab
    Sinkronisasi OTA berbunyi "1 feed", "2 feed", dst.

15. **Bukunya sepanjang satu tahun, bukan satu bulan.** Prototype hanya mengisi
    Agustus 2026. Itu cukup untuk kalender, tapi tidak untuk pertanyaan yang
    diajukan laporan — kapan musim ramai dan kapan sepi tidak bisa dijawab oleh
    satu kolom. `seedLedger()` menambah September 2025 sampai Desember 2026 di
    generator terpisah (`seed = 21`), dengan dua bentuk yang disengaja:

    - **Musim.** Raja Ampat menjual air tenang. Oktober–Februari puncaknya,
      Mei–Juni titik terendah saat angin tenggara, Juli–Agustus naik lagi oleh
      libur Eropa. Agustus dipatok 0,62 karena itu angka yang memang terukur di
      bulan seed.
    - **Pickup.** Bulan yang belum lewat hanya terisi sebagian, makin jauh
      makin sedikit — Desember 2026 baru ~23%. Selisih antara apa yang biasanya
      dihasilkan musim dan apa yang sudah terjual adalah justru yang perlu
      dilihat pemilik, jadi grafiknya menggambar bulan-bulan itu dengan warna
      teal yang lebih muda dan menyebutnya "belum lewat", bukan meramal.

    **Agustus 2026 tidak bergeser sama sekali** — 212 malam, 62%,
    Rp 118.670.000, 61 booking, dua bentrok. Generator baru melangkahi bulan
    itu utuh, *dan* melangkahi tiap booking seed di kamar yang sama (menginap
    seed yang mulai tanggal 29 berjalan sampai September; tanpa pemeriksaan
    kedua itu, 1 September akan jadi double booking yang dilaporkan banner
    bentrok sebagai nyata).

    Efek sampingnya di UI: hitungan di grup **Saluran** pada sidebar sekarang
    dihitung per bulan yang sedang ditampilkan. Sebelumnya menghitung seluruh
    buku — kebetulan sama saja ketika buku hanya berisi satu bulan, tapi angka
    setahun yang duduk di sebelah kalender satu bulan akan terbaca sebagai
    angka bulan itu. `Lama menginap` di KPI juga ikut dibatasi ke bulan
    laporan, dengan alasan yang sama.

16. **Palet hangat, bukan palet prototype.** Tokennya diganti seluruhnya:
    dasar krem, cangkang hijau, emas sebagai aksen — mengikuti referensi
    tampilan yang diminta pemilik. Semua perubahan warna ada di blok `@theme`
    `globals.css`; komponen tidak memegang hex sendiri kecuali di tiga tempat
    yang memang butuh nilai, bukan kelas: `CH` (warna saluran), `pills.ts`
    (isi chip), dan konstanta grafik di `report-charts.tsx`.

    **Dua nama token sekarang berbohong dan sengaja dibiarkan**: `teal` adalah
    hijau cangkang, dan `slate` adalah abu hangat. Menggantinya berarti
    menyentuh dua puluh berkas untuk hasil yang identik di layar.

    Bentuk yang ikut berubah:

    - **Cangkang.** Lebar: panel putih membulat yang duduk di dalam bingkai
      hijau, di atas dasar krem. Hijaunya setebal border (10px), bukan margin
      kanvas yang dulu dikeluhkan — sidebar digambar langsung di atasnya tanpa
      panel sendiri. Sempit: tidak ada cangkang sama sekali, panel *adalah*
      viewport, dan sidebar jadi baris nav di dalamnya.
    - **Wordmark pindah ke sidebar** saat lebar (kembali ke top bar saat
      sempit — di sana tidak ada hijau untuk ditempati). Logonya digambar
      dengan hijau tua yang hilang di atas cangkang, jadi ia diberi cakram
      putih sebagai alasnya sendiri, bukan diwarnai ulang.
    - **Grafik**: hijau untuk periode yang sudah selesai, emas untuk yang
      belum. Pasangan itu lolos kontras 3:1 dan duduk di pita CVD 6–8 —
      dibolehkan karena pembedanya dibawa tiga cara lain: legenda, posisi
      (periode terbuka selalu ekor kanan), dan tampilan tabel.

---

## 6. Website publik (`/turtle`)

Terpisah dari dashboard dan **tidak memindahkannya**: manager tetap di `/`,
website di `/turtle`. Keduanya cuma berbagi tarif kamar, kit ilustrasi, dan
`content/site.json`, jadi salah satunya bisa dipindah ke domain sendiri nanti
tanpa yang lain ikut berubah.

**Koreksi.** Paragraf ini dulu bilang memindahkannya ke domain sendiri cuma
setelan domain di Vercel dan bukan perubahan kode. Itu keliru: domain yang
ditambahkan ke sebuah proyek menyajikan `/`, dan `/` adalah dashboard, jadi
tamu yang mengetik alamat homestay akan mendarat di halaman login. Pemetaan
domain ke situs sekarang ada di `next.config.ts`, mati kalau tidak diisi, dan
caranya ada di `DEPLOY.md`.

Isinya: hero foto, bagian nilai, kamar, dive center, musim, cara sampai, FAQ,
footer. **Tujuh bahasa** — Inggris, Indonesia, Prancis, Jepang, Jerman, Rusia,
Mandarin — dengan Inggris sebagai default, dipilih lewat satu dropdown di
header. Daftarnya sama persis dengan Eddo dan berbagi satu kunci penyimpanan,
jadi tamu yang memilih bahasanya di satu situs lalu menyeberang ke situs
satunya tidak perlu memilih lagi. Tiap bahasa disebut dengan namanya sendiri
(`Français`, `日本語`, `Русский`), karena orang mencari bentuk katanya sendiri,
bukan kata Inggrisnya.

**Ada dua pintu, dan keduanya pintu depan.** Tombol tanya membuka popup
(`web/enquiry-modal.tsx`) berisi nama, WhatsApp, email, mau apa, rencana bulan,
jumlah orang, lama menginap, dan catatan; tombolnya cuma satu: Kirim. Di
sebelahnya, kamar dan paket selam sekarang bisa **dipesan dan dibayar langsung**
lewat Midtrans — lihat bagian di bawah. Kamar tetap ikut tercantum di OTA karena
di sanalah kalendernya hidup; bedanya, tamu yang sudah memutuskan tidak lagi
harus menunggu balasan untuk membayar.

### Ke mana pesan itu pergi

`POST /api/enquiry` mengirimkannya sebagai email ke `contact.ownerEmail`,
dengan `reply_to` diisi alamat tamunya sehingga tombol balas di kotak masuk
langsung tertuju ke orangnya. Tidak ada yang disimpan. Enquiry bukan catatan
yang perlu dikelola, dia pesan yang perlu dibalas, dan kotak masuk sudah
melakukan itu dengan baik. Efek sampingnya: tidak ada data tamu di server ini
yang bisa bocor.

Perlindungannya: honeypot (`website`, diletakkan di luar layar, bukan
`display:none`, karena bot paling kasar melewati apa pun yang disembunyikan),
pemotongan 2000 karakter, escape HTML, dan subjek dipaksa satu baris supaya
newline tidak bisa dipakai menyuntik header. Minimal salah satu dari WhatsApp
atau email wajib diisi, kalau tidak owner menerima pesan yang tidak bisa
dijawab (422 `no-contact`).

Butuh dua variabel di Vercel:

| Variabel | Isi |
|---|---|
| `RESEND_API_KEY` | dari resend.com |
| `ENQUIRY_FROM` | pengirim di domain yang sudah diverifikasi di Resend, mis. `Turtle Dive Homestay <web@turtlehomestay.id>` |

Selama keduanya belum ada, endpoint menjawab 503 dan tombol Kirim otomatis
beralih membuka WhatsApp dengan pesan yang sama. Jadi kunci yang belum
dipasang tidak menghilangkan satu pesan pun.

### Pesan langsung dan bayar

Jalannya tiga langkah, dan tidak satu pun membawa angka dari browser:

1. **Dialog** (`web/book-modal.tsx`), dibuka dari kartu kamar, kartu paket,
   atau halaman paket. Bentuknya tiga, karena yang dijual tiga rupa: kamar
   minta dua tanggal dan jumlah tamu, paket selam minta satu tanggal dan
   jumlah penyelam, sewa alat minta dua tanggal lalu harinya dihitung sendiri.
   Mana yang dipakai ditentukan `DIVE_PER` di `web-content.ts` — fakta, bukan
   kata: membacanya dari tulisan "per day" di bawah harga akan salah hitung
   begitu halamannya dibaca dalam bahasa Indonesia.
2. **Halaman ringkasan** `/turtle/checkout` (`web/checkout-page.tsx`). Pesanan
   dititipkan di `sessionStorage` tab itu (`lib/turtle-order.ts`), bukan di URL,
   karena isinya nama, nomor dan alamat email — di URL ketiganya masuk riwayat
   browser, log server, dan header referer. Halaman ini menghitung ulang
   harganya sendiri; draf yang diutak-atik akan menampilkan total yang tidak
   pernah ditagihkan, bukan tagihan yang tidak pernah disetujui.
3. **`POST /api/pay`** dengan `site: "turtle"`, menghitung untuk ketiga kalinya
   lewat `priceTurtle()`, lalu meminta token Snap. Harga selalu dibaca dari
   tabel kamar milik manager dan `divePrices` di `content/site.json`.

**Harga bungalow ikut jumlah tamunya.** Keluarga ini menjual per orang, bukan
per kamar, dan orang kedua tidak seharga orang pertama: 850.000 untuk satu,
1.550.000 untuk dua. Jadi `priceTurtle()` minta jumlah tamu dan mencari
tarifnya di tabel, bukan mengalikan — `850.000 × 2` akan menagih satu pasangan
1.700.000, lebih 150.000 tiap malam. Jumlah tamunya juga ikut ke nama item di
Midtrans ("Deluxe Bungalow, 2 guests"), karena bungalow yang sama pada malam
yang sama punya dua angka, dan kuitansi yang tidak menyebut berapa orang tidak
bisa dicocokkan dengan daftar harga.

Orang ketiga (extra bed) **tidak dijual di situs**: harganya tergantung usia
dan seseorang harus setuju bahwa kasurnya muat, jadi halamannya mencetak
angkanya dan meminta tamunya berkirim pesan.

Yang ditolak di server, bukan cuma di browser: menginap nol malam atau lebih
dari 30 malam, jumlah tamu di luar 1–2 (ditolak, bukan dibulatkan ke bawah
jadi dua — empat orang yang diam-diam ditagih untuk dua adalah empat orang di
depan pintu berkasur dua, sesudah uangnya pindah), penyelam lebih dari enam
(batas perahu, sama alasannya), paket yang harganya belum diisi owner, dan
bungalow atau paket yang namanya tidak dikenal. Semuanya 422.

`/api/pay/notify` mengirim email ke inbox yang benar dengan membaca awalan
order id: yang berawalan `TURTLE-` milik Turtle, sisanya milik Eddo. Isi
pesanannya ikut di tiga custom field Midtrans, karena notifikasi Midtrans
sendiri cuma membawa order id, jumlah, dan status.

**Tidak ada kamar yang dikunci.** Tidak ada database, jadi dua orang bisa
membayar minggu yang sama. Situsnya mengatakan itu di bawah tombol, apa adanya,
dan konfirmasi tetap lewat WhatsApp.

**Tanpa kunci Midtrans, situsnya persis seperti sebelumnya**: tidak ada tombol
bayar sama sekali, semua kartu cuma menawarkan bertanya. `midtransConfigured()`
dibaca di halaman server lalu diturunkan sebagai prop `payable`. Karena
halaman Turtle di-*prerender*, kuncinya dibaca **saat build** — memasang kunci
di panel Vercel baru terlihat setelah deploy berikutnya, sama seperti mode
perbaikan dan harga.

### Halaman detail tiap paket selam

Tombol di kartu paket bukan "Pesan" lagi, tapi **Detail**, dan mengarah ke
`/turtle/dive/<paket>`. Keenamnya di-*prerender* jadi berkas statis, karena cuma
ada enam dan tamu sering membukanya dengan sinyal pulau.

Isi tiap halaman: pengantar, dua diagram, empat kartu (sudah termasuk, belum
termasuk, yang perlu dibawa, cocok kalau), dan formulir pesan yang sama.

Diagramnya digambar, bukan difoto, dan itu disengaja. Foto karang tidak
memberitahu penyelam apa pun yang belum bisa ditebak; yang betul-betul ingin
diketahui sebelum membayar adalah **berapa bagian harinya yang dihabiskan di
dalam air** dan **sedalam apa boleh turun**. Dua-duanya bisa dijawab diagram
dan tidak bisa dijawab foto.

**Yang nyata dan yang direka.** Jumlah penyelaman tiap paket, total durasinya,
perahu 20–45 menit, batas 12 meter untuk Discover Scuba, empat hari untuk Open
Water, maksimal enam penyelam per pemandu: semuanya diambil dari daftar harga
dan teks yang sudah ada. Yang **direka** adalah pembagian menit per tahap di
`lib/dive-detail.ts`, yaitu satu pembagian yang masuk akal dari total yang
disebutkan, bukan jadwal yang pernah dijalankan. Halamannya menyebut itu di
bawah diagramnya, dan hanya proporsinya yang digambar, tidak pernah jam
dinding. **Lima menit pemilik untuk mengoreksinya sangat berharga**; tidak ada
bagian lain halaman itu yang bergantung padanya.

### Harga dalam mata uang lain

Delapan mata uang (IDR, USD, EUR, GBP, AUD, SGD, CNY, JPY) lewat pemilih kecil
di bagian Kamar dan bagian Selam.

**Rupiah tetap harga utamanya di mana pun.** Rupiah yang ditagih dan rupiah
yang diatur di CMS, jadi rupiah yang besar dan tebal; hasil konversinya baris
kecil di bawahnya dengan tanda ≈, dan hilang sama sekali kalau kursnya belum
termuat. Menyebut "$88" ke tamu lalu meminta rupiah dengan kurs berbeda saat
tiba adalah cara memulai pertengkaran di dermaga.

`GET /api/rates` yang mengambil kursnya, di server bukan di browser: satu
panggilan yang di-cache melayani semua pengunjung, penyedia kursnya tidak
pernah tahu siapa yang membaca situs, dan kalau sumbernya berubah cukup satu
berkas yang diubah. Cache enam jam, karena ini daftar harga homestay bukan
layar trading. Sumbernya tanpa API key supaya pemilik tidak perlu mengurus
akun; `RATES_URL` bisa dipakai kalau suatu saat perlu diganti.

Kalau sumbernya mati, route-nya menjawab 503 dan baris konversinya tidak
digambar sama sekali. Rupiahnya tetap tampil, yang memang harga sebenarnya.

### Halaman profil `/turtle/about`

Pintunya adalah tombol **Kenali kami** di hero, satu-satunya yang bisa diklik
di sana. Isinya versi panjang: keluarganya, kesepuluh kamarnya dengan foto dan
fasilitas per tipe, apa saja yang sudah termasuk harga, cerita dive center-nya,
dan peta lokasinya.

Tombolnya bergaya kaca — garis tepi putih transparan, bukan pil putih pekat —
justru supaya **tidak** menyerupai tombol "Pesan" di header. Dua pil putih di
satu layar terbaca sebagai dua ajakan setara dan memaksa pembaca memilih;
tombol ini yang kedua, bukan yang utama. Diukur: tulisannya 8:1 terhadap piksel
paling terang di dalam pilnya.

Cuma ada **satu** tautan ke halaman ini di seluruh beranda. Sebelumnya tombol
ini menutup bagian nilai, di tengah halaman; kalau ditaruh di dua tempat,
keduanya jadi lebih lemah.

Jumlah kamarnya dihitung dari `roomFacts()`, tabel yang sama dengan yang
dipakai manager, jadi halaman ini tidak bisa menyebut angka yang berbeda dari
dashboard. Bagian dive center-nya **menautkan balik** ke daftar harga di
`/turtle#diving`, bukan menyalin harganya. Enam harga di dua tempat berarti
enam harga yang harus dijaga tetap sama.

**Dua tahun berdiri masih kosong.** `founded.homestay` dan `founded.diveCenter`
di `content/site.json` bernilai `null`, dan diisi dari tab Website. Selama
kosong, halamannya cuma menulis "dive center-nya berdiri belakangan setelah
homestay" tanpa menyebut tahun. Begitu keduanya diisi, kalimatnya berubah
sendiri jadi "Dive center sejak 2019, 5 tahun setelah homestay-nya" — selisih
tahunnya dihitung, bukan ditulis. Tahun yang dikarang adalah jenis kebohongan
kecil yang bertahan bertahun-tahun, jadi kosong lebih baik daripada tebakan.

### CMS: tab Website di dalam manager

Owner mengubah nomor WhatsApp, email publik, email penerima, tautan media
sosial, tahun berdiri, enam harga paket selam, dan **mode perbaikan** dari tab
**Website** di manager, bukan dari repo. Isinya duduk di `content/site.json`;
`PUT /api/content` menuliskannya kembali lewat GitHub Contents API, Vercel
melihat commit itu dan membangun ulang. Sekitar satu menit sampai tayang, dan
setiap perubahan tercatat di riwayat repo lengkap dengan nama yang
menyimpannya. Untuk harga yang bergerak dua kali setahun itu tukaran yang lebih
baik daripada server yang tidak ada yang menjaga.

#### Sub-tab

Lima bagian dipisah jadi sub-tab di dalam tab Website: Kontak, Media sosial,
Profil, Harga selam, Status situs. Sebelumnya semuanya satu gulungan panjang,
jadi mengubah satu harga berarti mencari-cari dengan mata tiap kali.

Memisahnya jadi tab menimbulkan satu risiko baru, dan dua hal di layar itu
jawabannya:

1. **Tombol Simpan berada di luar tab** dan menerbitkan seluruh berkas, bukan
   tab yang sedang terbuka. Pindah tab tidak menghilangkan apa pun; semuanya
   satu objek `config` di memori.
2. **Tab yang isinya sudah diubah tapi belum disimpan diberi titik**, dan di
   dekat tombol Simpan disebutkan namanya. Dengan lima bagian, empat di
   antaranya selalu tidak terlihat waktu tombol Simpan ditekan. Perbandingannya
   `JSON.stringify` per bagian terhadap salinan terakhir dari server, jadi
   kolom baru yang ditambahkan nanti ikut terpantau tanpa perlu didaftarkan.

Setelah simpan berhasil, yang dipakai adalah **salinan dari server**, bukan
salinan di browser: itu yang membawa stempel waktu dan nama penyimpannya, dan
menyamakan keduanya itulah yang menghapus titik-titiknya.

#### Mode perbaikan

Saklar di sub-tab **Status situs**. Menyala berarti `/turtle`, `/turtle/about`,
dan keenam halaman paket selam diganti satu halaman tunggu berisi lencana
homestay, judulnya dalam bahasa yang dipilih pembaca, nomor WhatsApp, dan email. Dashboard `/` **tidak**
ikut mati, jadi pemiliknya tetap bisa bekerja selagi situsnya ditutup.

Halaman tunggunya membawa nomor dan email, dan itu inti dari halamannya.
Halaman tunggu yang cuma bilang "sebentar lagi kembali" mengubah tamu yang
sudah siap memesan jadi tamu yang pergi, padahal homestay-nya jelas tetap
buka walaupun situsnya tidak.

**Butuh sekitar satu menit, tidak seketika.** Saklarnya dibaca saat build,
sama seperti harga dan kontak. Jadi ini alat untuk perbaikan yang
direncanakan, bukan untuk mematikan situs buru-buru, dan layarnya
mengatakannya begitu daripada menyiratkan saklarnya langsung berlaku. Kalau
suatu saat perlu yang seketika, tempatnya di middleware yang membaca env
var, bukan di berkas ini.

Selama menyala, ketiga rute itu juga menambahkan `robots: noindex, nofollow`
supaya mesin pencari tidak mencatat "sedang diperbaiki" sebagai isi situs ini.

Tulisannya ada di `web-content.ts` kunci `maintenance`, tujuh bahasa dan
bertipe, jadi tidak mungkin ada versi yang cuma terisi sebagian. Sengaja
tidak ada kolom teks bebas di CMS untuk ini: satu kotak teks berarti satu
bahasa, dan situs ini tujuh bahasa.

`maintenance` yang tidak ada di berkas dianggap **mati**. Berkas yang ditulis
sebelum kolom ini ada tidak boleh mematikan situs pada deploy berikutnya.

Butuh empat variabel di Vercel:

| Variabel | Isi |
|---|---|
| `GITHUB_TOKEN` | fine-grained, izin Contents: read and write, repo ini saja |
| `GITHUB_REPO` | `yudventure/unmehopamanagement` |
| `GITHUB_BRANCH` | opsional, default `main` |
| `CMS_PASSWORD` | ditanyakan sebelum menyimpan |

Kata sandi itu satu-satunya penjaga endpoint, jadi dibandingkan dalam waktu
konstan dan endpoint **menolak jalan sama sekali kalau variabelnya belum ada**.
Kata sandi kosong tidak boleh berarti "tidak perlu kata sandi". Selama belum
lengkap, tab Website memperlihatkan isinya tetapi tombol simpannya mati dan
menerangkan variabel apa yang kurang.

SHA berkas diambil server-side sesaat sebelum menulis, bukan dititipkan dari
browser. Itu yang membuat tab lama tidak bisa menimpa perubahan yang disimpan
orang lain semenit sebelumnya: kalau berkasnya sudah bergerak, SHA-nya salah
dan GitHub menolak.

Teks situs tidak ada di CMS. Salinan tujuh bahasa, dengan pemenggalan baris dan
nadanya, jauh lebih baik disunting lewat code review daripada lewat textarea.
Menaruhnya di form berarti memilih antara setengah terjemahan tayang atau
pekerjaan penerjemah di dalam formulir.

### Konten disamakan dengan situs lama klien

Turtle sudah punya situs sendiri di **turtledivehomestay.com**, dan yang
diminta klien adalah desain ulang — bukan isi baru. Jadi isi situs ini
disamakan dengan isi situs itu, sejauh yang bisa dibaca dari tangkapan layar
yang dikirim klien (halaman Accommodation, Packages, Contact Us, dan footer).

Yang diambil apa adanya dari sana:

| Fakta | Nilai | Di mana ia tinggal sekarang |
|---|---|---|
| Nama tipe | satu saja: **Deluxe Bungalow** | `ROOM_KEYS`, `COPY[*].rooms.types` |
| Tarif | **850.000** satu orang, **1.550.000** dua orang, per malam | `TURTLE_RATES` di `lib/data.ts`; yang dua orang juga jadi `rate` di tabel kamar manager |
| Extra bed | 3–9 th 200.000 · 10–16 th 400.000 · 17+ 600.000, per orang per malam, satu per bungalow | `TURTLE_RATES.extraBed` |
| Jam | check-in 12:30, check-out 11:00, listrik 18:00–24:00, makan 07:00/12:00/19:00 | `HOUSE` |
| Aturan | tidak ada refund setelah hari check-in; pantangan/alergi dikabari sebelum datang | `COPY[*].rooms.rules` |
| Alamat | Mansuar Kecil (Pulau Kri), Distrik Meos Mansar, Kepulauan Raja Ampat, Papua Barat Daya 98472 | `LOCATION`, `PROPERTY` |
| Kontak | WhatsApp 081243237470 · turtlediversrajaampat@gmail.com · IG turtlediversrajaampat | `content/site.json` |
| OTA | stayrajaampat.com dan Booking.com | `COPY[*].rooms.otaNote` |
| Harga selam | daftar harga 2025 lengkap: 15 baris + 4 perahu excursion + 5 catatan | `divePrices` di `content/site.json`, barisnya di `PRICE_ROWS`/`BOAT_ROWS`, kata-katanya di `COPY[*].dive.list` |
| Nomor kantor | +62 812 4323 7470 untuk reservasi selam | sama dengan `contact.whatsapp` |

**Situs lama menyebut Pulau Kri, bukan Yenbuba.** Sebelum ini, seluruh copy
Turtle dalam tujuh bahasa menempatkan homestay-nya di Yenbuba, Pulau Mansuar —
kampung di seberang selat, tempat Eddo berada. Sekarang semuanya berbunyi
Pulau Kri / Mansuar Kecil, termasuk judul halaman dan peta sketsanya.
Akibatnya: copy **Eddo** masih menulis Turtle sebagai "di kampung yang sama",
dan itu perlu dikonfirmasi ke pemiliknya — file Eddo sengaja tidak disentuh.

**Daftar harga selam 2025** menyusul dalam bentuk yang terbaca, dan sekarang
ada di situs sebagai tabel di bawah kartu paket. Tiga angka di kartu yang dulu
karangan jadi angka mereka (dua fun dive 1.600.000, tiga penyelaman 2.250.000,
try dive 1.300.000), dan kartu keenam — dulu "sewa alat lengkap" seharga
350.000/hari — diganti **Pemandu Pribadi** 400.000/hari, karena sewa alat
seperti itu tidak ada: alat dan perahu sudah termasuk di tiap penyelaman
lokal, dan yang bawa alat sendiri justru dapat potongan 100.000.

**Yang masih belum bisa disamakan:**

- **Kursus** (Open Water dan sejenisnya) dan **trip snorkeling** — tidak ada
  di daftar harga selam yang dikirim. Keduanya diisi `0`, yang di situs berarti
  "tanya harga", bukan gratis.
- **Satu baris di daftar harga aslinya salah ketik**: "1 Fun afternoon dive in
  Manta Cleaning Station ... IDR 1.00,000". Angka itu tidak diisi (`mantaPm: 0`)
  dan barisnya tampil sebagai "tanya harga" sampai ada yang memastikan.
- **Satu baris mungkin terpotong** di antara dua tangkapan layar daftar harga,
  antara "2 Fun Dive in P47 Wreck" dan "One night dive in Yenbuba".
- Halaman **Home** dan **Policy & Gallery** situs lama — tangkapan layarnya
  cuma 147 px dan 164 px, tulisannya tidak terbaca walau diperbesar.
- Halaman **Packages** di situs lama memang kosong ("we have no package
  avaliable now"), jadi tidak ada yang hilang di sana.

### Yang wajib diganti sebelum dipakai

| Isi | Status |
|---|---|
| `contact.whatsapp`, `contact.email`, `contact.ownerEmail` | **nyata**, diambil dari situs klien. Catatan: halaman Contact Us situs lama memakai nomor lain (082291311277) dan footer memakai 081243237470 — yang dipakai di sini yang kedua, perlu dikonfirmasi |
| `social.instagram` | **nyata** (`turtlediversrajaampat`). `facebook` dan `tiktok` dikosongkan, karena situs lama tidak menyebut keduanya dan ikon yang menuju ke mana-mana lebih buruk daripada tidak ada ikon |
| `founded.homestay`, `founded.diveCenter` | **kosong**, tahun berdirinya belum diketahui. Selama kosong, tidak ada tahun yang ditampilkan di mana pun |
| `divePrices` (21 angka) | **nyata**, dari daftar harga selam 2025 mereka. Dua yang kosong — kursus dan trip snorkeling — tampil sebagai "tanya harga"; satu lagi (`mantaPm`) menunggu angka yang salah ketik di daftar aslinya |
| Nama, durasi, dan level paket selam | **campuran**: harganya nyata, tapi durasi ("~4 jam") dan susunan harinya masih rekonstruksi — lihat `lib/dive-detail.ts` |
| Tarif bungalow | **nyata**, dari daftar harga klien |
| Klaim Starlink dan "tanpa biaya kebersihan" | **belum terverifikasi** — tidak ada di situs lama, dan jam listrik 18:00–24:00 membuat klaim Starlink layak ditanyakan ulang |
| Musim, cara sampai, FAQ | tulisan wajar, perlu dikoreksi pemilik |

### Foto

Empat berkas di `public/`, dan `assets/README.md` menerangkan tiap slotnya:
`hero.jpg` (hero), `1.jpg`/`2.jpg`/`3.jpg` (tiga kartu), `logo.png` (favicon,
disalin ke `src/app/turtle/icon.png`).

Nama berkas **peka huruf besar-kecil** di server, tidak di Mac. `Hero.jpg`
tidak akan tampil di Vercel walaupun terlihat baik-baik saja secara lokal.

Di belakang tiap foto masih ada ilustrasi SVG dengan komposisi yang sama
(`web/scenes.tsx`), dipasang sebagai CSS background. Kalau satu foto hilang,
yang muncul adalah ilustrasinya, bukan ikon gambar rusak.
