# Pasang di Hostinger

Daftar yang tinggal diikuti, untuk jalur yang dipakai sekarang: **deploy lewat
Git, satu domain dulu, domain berikutnya menyusul.** Alasan di balik tiap
pilihan ada di `DEPLOY.md`; halaman ini cuma urutannya.

Tiga situs hidup dari **satu aplikasi**, jadi yang dipasang satu, bukan tiga:

| | |
|---|---|
| Turtle Dive Homestay | situs publik |
| Eddo Homestay | situs publik |
| Unmehopa Management | dashboard booking |

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

| Alamat | Yang disajikan |
|---|---|
| `domainnya.com/` | Dashboard |
| `domainnya.com/kelola` | Dashboard, alamat tetapnya |
| `domainnya.com/turtle` | Situs Turtle |
| `domainnya.com/eddo` | Situs Eddo |
| `domainnya.com/version.json` | Bukti versi mana yang sedang tayang |

### 1. Buat aplikasi Node.js dari Git

Di hPanel, **Node.js Web Apps**, buat aplikasi dengan sumber repositori Git.
Penyambungannya lewat GitHub App, dan repositori ini privat, jadi beri izin
aksesnya saat diminta.

```
Repositori     : yudventure/unmehopamanagement
Branch         : deploy          <- bukan main
Build command  : kosong          <- penting
Entry file     : server.js
Versi Node     : 22
Root directory : ./
```

Deploy otomatis menyala sendiri begitu aplikasinya dibuat dari Git. Tidak ada
webhook yang perlu ditempel.

### 2. Putuskan domain pertamanya, lalu samakan variabel build-nya

Nama domain **tertanam saat build**, bukan dibaca saat jalan, jadi yang satu
ini ditentukan sebelum deploy. Ada di GitHub: **Settings → Secrets and
variables → Actions → Variables**.

| Domain pertamanya | `SITE_DOMAIN_EDDO` / `SITE_DOMAIN_TURTLE` | Akibatnya |
|---|---|---|
| `eddohomestay.com` | biarkan `SITE_DOMAIN_EDDO` terisi | `/` jadi situs Eddo, dashboard di `/kelola` |
| apa pun yang lain | **kosongkan keduanya**, lalu jalankan ulang workflow Build | `/` jadi dashboard, kedua situs di jalurnya |

Kalau variabelnya diubah, **jalankan ulang workflow Build di `main`**. Me-restart
server tidak mengubah apa pun: yang berubah cuma ada di hasil build berikutnya.

### 3. Isi variabel yang dibaca saat jalan

Di panel aplikasi Node-nya, bagian **Variabel environment**. Daftar lengkapnya
berikut penjelasan tiap baris ada di `.env.example`; yang paling sedikit supaya
bisa dipakai:

| Variabel | Tanpa ini |
|---|---|
| `DASHBOARD_PASSWORD` | tidak ada yang bisa masuk ke dashboard sama sekali |
| `SESSION_SECRET` | semua orang keluar sendiri tiap server menyala ulang |
| `DATABASE_URL` | dashboard memakai data contoh, tidak menyimpan apa pun |
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
https://domainnya.com/version.json
```

`commit` di situ harus sama dengan commit terakhir di `main`. Kalau tidak,
yang tayang build lama dan sisanya tidak perlu diperiksa dulu. Sesudah cocok,
buka keempat alamat di tabel atas.

## Tahap 2 — domain berikutnya, setelah semuanya mapan

1. **Arahkan domainnya ke aplikasi yang sama.** Tambahkan domainnya di panel
   aplikasi Node-nya. Kalau nameserver-nya bukan Hostinger, arahkan A record
   apex dan `www` ke alamat yang ditunjukkan panel. **MX record jangan
   disentuh**: emailnya catatan yang berbeda dan tidak ikut pindah.
2. **Isi variabelnya di GitHub**, apex dulu baru `www`, dipisah koma:
   ```
   SITE_DOMAIN_TURTLE = turtlehomestay.com,www.turtlehomestay.com
   SITE_DOMAIN_EDDO   = eddohomestay.com,www.eddohomestay.com
   ```
   Yang pertama dianggap alamat resmi dan dipakai sebagai canonical.
3. **Jalankan ulang workflow Build di `main`.** Sekali lagi: tertanam saat
   build, bukan saat jalan.
4. **Buktikan lagi** lewat `/version.json`, lalu buka tiap domain di akarnya.

Sesudah itu tiap domain menyajikan situsnya sendiri di `/`, dan dashboard
tetap ada di `/kelola` pada domain mana pun.

## Lima hal yang menggagalkan deploy, dan bentuk gagalnya

| Kalau | Yang terjadi |
|---|---|
| Build command tidak dikosongkan | `next build` dijalankan terhadap hasil build, lalu gagal |
| Branch diisi `main`, bukan `deploy` | server menarik kode sumber lalu mencoba membangunnya; memori paket habis |
| Entry diisi `npm start` | di arsip itu tidak ada `next`, yang ada `server.js` |
| Port dipatok di panel | `server.js` membaca `PORT` dan `HOSTNAME` dari lingkungan |
| Domain diisi tanpa build ulang | tidak ada efek apa pun, dan tidak ada pesan apa pun |

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
