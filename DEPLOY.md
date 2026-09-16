# Deploy ke Vercel

Satu proyek Vercel, satu repo, **tiga situs**. Yang membedakan ketiganya bukan
tiga deploy, melainkan domain mana yang diminta pengunjung.

| Alamat | Isi | Siapa yang membukanya |
|---|---|---|
| `/` | Dashboard booking | pemilik dan staf |
| `/turtle` | Situs publik Turtle Dive Homestay | tamu |
| `/eddo` | Situs publik Eddo Homestay | tamu |

Selama belum ada domain, ketiganya dibuka lewat jalur itu apa adanya, termasuk
di alamat `*.vercel.app` yang Vercel berikan otomatis. **Tidak ada yang perlu
disiapkan supaya situs baru ikut tayang**: `/eddo` adalah halaman di aplikasi
yang sama, jadi ia ikut naik pada push berikutnya seperti halaman lain.

## Variabel lingkungan

Diisi di Vercel → Settings → Environment Variables. Semuanya opsional dalam
arti aplikasinya tetap jalan tanpa itu; yang mati cuma fitur yang
bersangkutan, dan matinya dijelaskan di layar, bukan berupa error.

| Variabel | Untuk apa | Tanpa ini |
|---|---|---|
| `RESEND_API_KEY` | mengirim pesan dari formulir | tombol Kirim beralih membuka WhatsApp |
| `ENQUIRY_FROM` | alamat pengirim di domain terverifikasi Resend | sama seperti di atas |
| `GITHUB_TOKEN` | menyimpan dari tab Website | tab Website bisa dilihat, tidak bisa disimpan |
| `GITHUB_REPO` | `yudventure/unmehopamanagement` | sama seperti di atas |
| `GITHUB_BRANCH` | opsional, default `main` | memakai `main` |
| `CMS_PASSWORD` | ditanyakan sebelum menyimpan | endpoint menolak jalan sama sekali |
| `RATES_URL` | opsional, sumber kurs | memakai open.er-api.com |
| `NEXT_PUBLIC_LOGIN_HERO` | foto panel login | panel tampil sebagai bingkai kosong |
| `SITE_DOMAIN_TURTLE` | domain situs Turtle | Turtle tetap di `/turtle` |
| `SITE_DOMAIN_EDDO` | domain situs Eddo | Eddo tetap di `/eddo` |

## Menyambungkan tiga domain

Ini bagian yang **tidak** selesai hanya dengan menambahkan domain di Vercel.
Domain yang ditambahkan ke sebuah proyek akan menyajikan `/`, dan `/` adalah
dashboard. Tamu yang mengetik alamat homestay akan mendarat di halaman login.

Dua langkah, dan urutannya bebas.

**1. Tambahkan ketiga domain di Vercel** → Settings → Domains. Kalau memakai
bentuk `www`, tambahkan keduanya dan biarkan Vercel mengarahkan salah satunya
ke yang lain.

**2. Isi dua variabel berikut**, lalu deploy ulang sekali supaya terbaca:

```
SITE_DOMAIN_TURTLE = turtlehomestay.com,www.turtlehomestay.com
SITE_DOMAIN_EDDO   = eddohomestay.com,www.eddohomestay.com
```

Dipisah koma kalau lebih dari satu. **Yang pertama dianggap yang resmi** dan
dipakai sebagai alamat canonical; sisanya dianggap alias.

Domain dashboard tidak perlu variabel apa pun. Ia menyajikan `/`, yang memang
sudah dashboard.

Sesudah itu:

| Yang diminta | Yang disajikan |
|---|---|
| `turtlehomestay.com/` | situs Turtle |
| `turtlehomestay.com/about` | halaman profil Turtle |
| `turtlehomestay.com/turtle` | memantul ke `turtlehomestay.com/` |
| `eddohomestay.com/` | situs Eddo |
| `unmehoppa.com/` | dashboard |

## Kenapa ini ada di `next.config.ts` dan bukan di setelan Vercel

Pemetaannya ditulis sebagai rewrite berbasis host di `next.config.ts`. Tiga
alasan:

1. **Diselesaikan sebelum apa pun berjalan**, jadi tidak ada biaya per
   permintaan. Proxy akan menagih satu pemanggilan tiap permintaan untuk
   mengerjakan hal yang tidak pernah berubah.
2. **Berlaku sama di mana pun**. Kalau situsnya nanti pindah ke VPS Hostinger
   dengan Coolify seperti di dokumen penawaran, berkas yang sama bekerja
   tanpa diubah. Setelan di dasbor Vercel tidak ikut pindah.
3. **Mati total kalau tidak diisi.** Tanpa kedua variabel itu, daftar
   rewrite-nya kosong dan routing persis seperti sekarang. Jadi berkas ini
   boleh ada di repo hari ini dan baru hidup di hari domainnya dibeli, tanpa
   ada deploy di antaranya yang mengubah perilaku.

Diuji di server produksi dengan header `Host` yang dipalsukan, dalam dua
keadaan: dengan variabel terisi dan tanpa. Yang diperiksa termasuk `/api/*`,
berkas di `public/`, dan aset `_next/*` — ketiganya tidak boleh ikut ditulis
ulang — serta pantulan alamat kembar, yang harus mendarat di 200 dan bukan
berputar.

## Mode perbaikan menutup dua situs sekaligus

Saklar di tab Website (`maintenance` di `content/site.json`) sekarang menutup
**`/turtle` dan `/eddo`** berikut keduanya sekaligus. Dashboard tidak ikut
tertutup, karena pemilik harus tetap bisa bekerja saat situsnya ditutup.

Teks di tab Website masih menyebut `/turtle` saja. Itu perlu diperbaiki, atau
saklarnya dipisah jadi dua, sebelum ada yang menutup Eddo tanpa sengaja.

## Setelah deploy: yang wajib dicek

- Buka ketiga alamat dan pastikan masing-masing membuka situs yang benar.
- Kirim satu pesan percobaan dari formulir tiap situs. Subjek emailnya harus
  menyebut properti mana yang ditanyakan.
- Simpan satu perubahan dari tab Website dan tunggu satu menit; halamannya
  harus ikut berubah.
