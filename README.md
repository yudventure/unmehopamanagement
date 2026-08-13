# Unmehopa Management — Booking Manager

Webapp internal untuk mengelola booking Turtle Homestay (10 kamar) dan Eddo
Homestay (2 kamar) di Raja Ampat, dari semua saluran — Booking.com, Traveloka,
Agoda, dan WhatsApp — dalam satu kalender terpadu.

Implementasi UI dari prototype Claude Design di `project/`. Tahap ini adalah
**UI lengkap dengan data seed di memori**: seluruh layar dan interaksi jalan,
tapi belum ada database, autentikasi asli, maupun sinkronisasi iCal.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm run start   # build produksi
npm run typecheck                # tsc --noEmit
```

### Demo login

Halaman login muncul pertama kali. Pilih peran di **Masuk sebagai** — email
terisi otomatis (`yud@rumahpapua.id` untuk Owner, `marthen@rumahpapua.id` untuk
Staf) — isi kata sandi dengan apa saja, lalu **Masuk ke dashboard**.

| Peran | Akses |
|---|---|
| Owner | Kalender, Laporan, Properti & Kamar, Pengguna & Peran, semua angka rupiah |
| Staf  | Kalender, Properti & Kamar; seluruh nominal uang disembunyikan |

Keluar lewat kartu profil di kanan atas → **Keluar dari akun**.

### Foto panel login

Panel kanan halaman login adalah slot foto. Taruh gambar di `public/`, lalu set:

```bash
# .env.local
NEXT_PUBLIC_LOGIN_HERO=/login-hero.jpg
```

Tanpa variabel itu, panel menampilkan bingkai kosong sesuai desain.

## Struktur

```
src/
  app/            layout, halaman, token desain (globals.css)
  components/     UI — top bar, sidebar, layar, drawer, modal, login
  hooks/          useViewportWidth
  lib/
    data.ts       seed properti, kamar, booking, pengguna (deterministik)
    derive.ts     sel kalender, statistik bulan, deteksi bentrok
    format.ts     tanggal & rupiah
    pills.ts      warna badge status
    types.ts      tipe domain
```

Seluruh state aplikasi ada di `components/booking-manager.tsx`. Data seed
dibangkitkan LCG ber-seed tetap, jadi kalender Agustus 2026 selalu sama di
setiap mesin — termasuk satu bentrok iCal yang disengaja di Turtle 03 pada
19–23 Agustus, untuk menguji banner konflik (PRD F2.4).

### Knob prototype

`<BookingManager />` menerima tiga prop yang setara dengan knob di prototype:

| Prop | Default | Arti |
|---|---|---|
| `layarAwal` | `"kalender"` | Layar yang dibuka setelah login |
| `modeStaf` | `false` | Sembunyikan semua angka rupiah |
| `bookingPerHari` | `4` | Jumlah chip per hari sebelum "+N lagi" |

## Yang belum ada

Sesuai keputusan scope tahap ini — bukan kelalaian:

- **Database.** Semua perubahan hilang saat refresh. Skema Postgres lengkap
  dengan constraint anti-overlap (`EXCLUDE USING gist`) ada di dokumen handoff.
- **Autentikasi asli.** Login hanya menolak kolom kosong; kata sandi tidak
  divalidasi. Pembatasan peran masih di UI saja — di produksi harus dicek di
  setiap API route.
- **Sinkronisasi iCal.** Status "12 menit lalu / 5 feed aktif" dan jumlah feed
  per kamar masih statis.
- **Ekspor CSV & perbandingan bulan.** Tombolnya ada, aksinya belum.
- **Upload bukti transfer, harga musiman, halaman "Hari Ini".**

Urutan pengerjaannya ada di `project/Handoff Teknis Booking Manager.dc.html`.

## Sumber desain

- `project/Booking Manager Homestay.dc.html` — prototype yang diimplementasikan
- `project/Handoff Teknis Booking Manager.dc.html` — skema DB, endpoint, alur iCal
- `project/uploads/PRD-booking-manager-homestay.md` — PRD
- `chats/chat1.md` — transkrip sesi desain
- `project/README-handoff.md` — instruksi bundle handoff aslinya
