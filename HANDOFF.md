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
**Turtle Homestay** (10 kamar, Yenbuba, Pulau Mansuar) dan **Eddo Homestay**
(2 kamar, Sawinggrai, Pulau Gam). Booking masuk dari empat saluran sekaligus:
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
  sisanya diisi chip, yang punya aksinya sendiri.
  Badge di bilah kanan menunjukkan **asal booking** — OTA mana, atau
  WA / langsung.
- **Drawer detail booking** — transisi status (Tentative → Confirmed →
  Checked-in → Checked-out, atau Cancelled), total menginap, jejak audit.
- **Form booking cepat** — pilih properti/kamar/tanggal dengan **cek
  ketersediaan langsung** (banner merah kalau bentrok), simpan sebagai
  Tentative atau Confirmed.
- **Laporan** — KPI (okupansi, pendapatan kotor, ADR, lama menginap), bar
  pendapatan per saluran, okupansi per kamar, estimasi komisi OTA.
- **Properti & Kamar** — kartu per properti, tabel kamar dengan kapasitas,
  status Aktif/Renovasi, dan **harga per malam yang bisa diubah langsung di
  tabel** (Owner saja). Harga baru langsung dipakai booking berikutnya.
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
    globals.css               token desain (palet lengkap dari prototype)
    layout.tsx                font DM Sans + JetBrains Mono, metadata
    page.tsx                  render <BookingManager />
  components/
    booking-manager.tsx       ★ SELURUH state aplikasi + view model ada di sini
    top-bar.tsx               logo, pencarian, tombol booking baru, menu profil
    sidebar.tsx               nav, filter properti, filter saluran, status iCal
    booking-drawer.tsx        panel detail booking
    booking-form-modal.tsx    form input booking cepat
    conflict-modal.tsx        tinjau bentrok kamar berdampingan
    dashboard-rail.tsx        bilah kanan: check-in terdekat / daftar per tanggal
    invite-modal.tsx          modal undang pengelola
    login-screen.tsx          login dua panel + panel foto
    screens/
      calendar-screen.tsx     grid kalender + chip booking
      report-screen.tsx       KPI, pendapatan per saluran, okupansi per kamar
      property-screen.tsx     kartu properti + tabel kamar
      users-screen.tsx        tabel pengguna & peran
    ui/
      modal.tsx               shell modal + class field form
      pill.tsx                badge status
  hooks/
    use-viewport-width.ts     lebar viewport terukur (bukan media query)
  lib/
    data.ts                   ★ seed kamar/booking/pengguna (LCG deterministik)
    pricing.ts                satu-satunya tempat nilai booking dihitung
    derive.ts                 sel kalender, statistik bulan, deteksi bentrok
    format.ts                 tanggal & rupiah (id-ID)
    pills.ts                  warna badge per status
    types.ts                  tipe domain
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

### Penyimpangan yang disengaja dari prototype

Tiga belas hal berikut sengaja berbeda dari prototype. Masing-masing satu baris
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
| Styling | Tailwind CSS v4 — palet sebagai token `@theme` di `globals.css` |
| Font | DM Sans + JetBrains Mono via `next/font/google` |
| State | React `useState`/`useMemo` di satu komponen root |
| Data | Seed di memori — belum ada database |

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

### Demo login

Kata sandi tidak divalidasi — isi apa saja, asal tidak kosong.

| Peran | Email (terisi otomatis) | Akses |
|---|---|---|
| Owner | `yud@rumahpapua.id` | Kalender, Laporan, Properti & Kamar, Pengguna & Peran + semua rupiah |
| Staf | `marthen@rumahpapua.id` | Kalender, Properti & Kamar; tanpa nominal uang |

Keluar lewat kartu profil kanan atas → **Keluar dari akun**.

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
