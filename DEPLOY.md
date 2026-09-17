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
| `PREVIEW_TOKEN` | membuka situs yang sedang ditutup, buat developer | tidak ada jalan masuk ke situs yang ditutup |
| `DASHBOARD_PASSWORD` | kata sandi masuk dashboard booking | tidak ada yang bisa masuk ke dashboard |
| `SESSION_SECRET` | menandatangani cookie sesi dashboard | dibuat acak tiap restart, semua sesi putus |
| `NEXT_PUBLIC_LOGIN_HERO` | foto panel login | panel tampil sebagai bingkai kosong |
| `SITE_DOMAIN_TURTLE` | domain situs Turtle | Turtle tetap di `/turtle` |
| `SITE_DOMAIN_EDDO` | domain situs Eddo | Eddo tetap di `/eddo` |
| `MIDTRANS_SERVER_KEY` | membuat transaksi Snap dan memeriksa notifikasi | tombol di bagian kamar Eddo bertanya, bukan menagih |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | dipakai browser untuk membuka Snap | sama seperti di atas |
| `MIDTRANS_IS_PRODUCTION` | `true` untuk keluar dari sandbox | tetap di sandbox |

### Midtrans

Tiga hal yang harus benar, dan dua di antaranya tidak ada di sini:

1. **Kunci server dan kunci client harus sepasang** dan dari lingkungan yang
   sama. Kunci sandbox dengan `MIDTRANS_IS_PRODUCTION=true` akan ditolak
   Midtrans, bukan gagal diam-diam.
2. **Payment Notification URL** diisi di dashboard Midtrans →
   Settings → Configuration, diarahkan ke `https://<domain>/api/pay/notify`.
   Tanpa itu pembayaran tetap masuk ke Midtrans tapi tidak ada yang memberi
   tahu pemiliknya.
3. **Endpoint notifikasi itu terbuka untuk umum**, jadi yang menentukan bukan
   siapa yang mengirim melainkan tanda tangannya: SHA-512 dari
   `order_id + status_code + gross_amount + server key`. Body yang tidak lolos
   dijawab 401 dan tidak ada email yang dikirim.

Nominalnya dihitung di server dari tabel kamar, tidak pernah diambil dari
permintaan. Nominal yang datang bersama permintaan adalah nominal yang dipilih
pengirimnya.

**Yang belum diuji:** panggilan sebenarnya ke Midtrans. Jaringan di lingkungan
pengembangan ini memblokir `app.sandbox.midtrans.com`, jadi jalur sampai
sebelum panggilan itu sudah diuji (503 tanpa kunci, 422 tanpa kontak, 502 kalau
Midtrans menolak) dan pemeriksaan tanda tangannya diuji dengan digest asli,
tapi transaksi sungguhan di sandbox belum pernah dijalankan. Lakukan satu
pembayaran uji di sandbox sebelum kuncinya diganti ke produksi.

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
SITE_DOMAIN_EDDO   = eddohomestay.com,www.eddohomestay.com   <- sudah dibeli
SITE_DOMAIN_TURTLE = turtlehomestay.com,www.turtlehomestay.com
```

Baris pertama bukan contoh lagi: `eddohomestay.com` adalah domain yang sudah
dibeli, dan nilai di atas itu yang dipakai apa adanya. Baris kedua masih
contoh sampai domain Turtle dibeli, dan selama variabelnya kosong Turtle tetap
hidup di `/turtle` tanpa ada yang rusak.

Daftar lengkap semua variabel beserta bentuk nilainya ada di `.env.example`,
terpisah antara yang dibaca saat build dan yang dibaca saat jalan.

Dipisah koma kalau lebih dari satu. **Yang pertama dianggap yang resmi** dan
dipakai sebagai alamat canonical; sisanya dianggap alias.

**Variabel ini dibaca waktu build, bukan waktu server menyala.** Next menulis
daftar rewrite-nya ke `.next/routes-manifest.json` sewaktu `next build`, jadi
mengisi variabelnya lalu menyalakan ulang server saja tidak mengubah apa pun:
domainnya akan tetap menyajikan dashboard. Diuji, bukan dikira. Di Vercel ini
otomatis benar karena setiap deploy adalah build baru; di VPS, pastikan
variabelnya ada di lingkungan yang menjalankan build, bukan cuma di yang
menjalankan `next start`.

**3. Arahkan DNS-nya.** Dua catatan yang perlu diubah dan satu yang tidak
boleh disentuh:

- **A record** untuk apex `eddohomestay.com`, dan **CNAME** untuk
  `www.eddohomestay.com`, diarahkan ke tempat aplikasinya berjalan. Nilai
  persisnya jangan ditebak dari dokumen ini: panel tujuannya yang memberi
  angka atau alamat yang benar, dan angka itu bisa berubah sewaktu-waktu.
- **MX record jangan diubah.** Kalau emailnya di Hostinger, MX tetap ke
  Hostinger sementara A record menyeberang ke tempat lain. Keduanya catatan
  yang berbeda dan tidak saling mengganggu, jadi memindahkan situsnya tidak
  ikut mematikan emailnya.

Kalau domainnya memakai nameserver Hostinger, ketiga catatan itu diubah di
hPanel bagian DNS Zone Editor, bukan di panel tempat aplikasinya berjalan.

Domain dashboard tidak perlu variabel apa pun. Ia menyajikan `/`, yang memang
sudah dashboard.

Sesudah itu:

| Yang diminta | Yang disajikan |
|---|---|
| `turtlehomestay.com/` | situs Turtle |
| `turtlehomestay.com/about` | halaman profil Turtle |
| `turtlehomestay.com/turtle` | memantul ke `turtlehomestay.com/` |
| `eddohomestay.com/` | situs Eddo |
| `unmehopamanagement.com/` | dashboard |
| `eddohomestay.com/turtle` | situs Turtle |

Baris terakhir itu bukan kebocoran, melainkan yang membuat tautan "homestay
saudara kami" di footer Eddo tetap hidup selama Turtle belum punya domain
sendiri. Rewrite jalur dijalankan **setelah** filesystem, jadi `/turtle` yang
memang halaman sungguhan ditemukan lebih dulu dan tidak pernah ikut ditulis
ulang. Begitu `SITE_DOMAIN_TURTLE` diisi, tautannya berhenti memakai jalur itu
dan langsung menyeberang ke domain Turtle.

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

## Mode perbaikan, satu saklar per situs

Tab Website punya satu saklar untuk tiap situs publik, disimpan di
`content/site.json` pada `sites.<situs>.maintenance`. Menutup Turtle untuk
dikerjakan tidak ikut menutup Eddo yang sedang menerima tamu, dan itu memang
alasannya dipisah: ketiga pekerjaan ini dikerjakan bergantian, bukan bersamaan.

Dashboard tidak pernah ikut tertutup, karena pemilik harus tetap bisa bekerja
saat situsnya ditutup.

Saklar bersama `maintenance` di akar berkas masih ada dan dipakai sebagai
cadangan untuk situs yang belum punya nilainya sendiri, supaya berkas yang
ditulis CMS versi lama tetap berlaku apa adanya.

## Masuk ke dashboard

Sampai hari ini kata sandinya tidak pernah diperiksa. `doLogin` menguji kolom
sandi hanya untuk memastikan tidak kosong, lalu meloloskan siapa pun, dan
seluruh pemeriksaannya berjalan di browser. Itu tertahankan selama dashboard-nya
demo pribadi, dan berhenti tertahankan begitu domain sebuah homestay menyajikan
`/kelola`.

Sekarang:

- Kata sandi diperiksa `/api/login` di server, dibandingkan dengan
  `DASHBOARD_PASSWORD` dalam waktu yang tetap sama berapa pun isinya.
- Yang kembali cookie `httpOnly` berisi masa berlaku beserta tanda tangannya,
  jadi masa berlakunya tidak bisa diubah oleh yang memegangnya. Delapan jam,
  selama satu hari kerja dan cukup pendek untuk laptop yang dipinjam.
- **Halamannya sendiri yang menjaga.** `/` dan `/kelola` memeriksa cookie di
  server, dan tanpa cookie yang sah dashboard-nya tidak dikirim sama sekali,
  bukan dikirim lalu ditutupi layar login. Layar yang digambar di atas halaman
  yang sudah tiba itu tirai, bukan pintu.
- `DASHBOARD_PASSWORD` kosong berarti tidak ada yang bisa masuk, dan
  `/api/login` menjawab 503 supaya yang mengelola langsung mengenali sebabnya.

**Satu kata sandi bersama, bukan satu akun per orang.** Tidak ada database
tempat menyimpan kata sandi tiap orang, dan alternatifnya, menaruh hash di
repositori atau menumbuhkan daftar variabel lingkungan, lebih buruk daripada
mengakuinya. Email dan peran yang dipilih di layar masuk tetap menentukan layar
dan angka mana yang ditampilkan, jadi staf tetap melihat tampilan staf. Tapi
yang berdiri antara internet dan semuanya adalah satu kata sandi ini. Ini
sambungan yang harus diganti begitu ada tempat menyimpan akun.

## Di mana dashboard-nya kalau domainnya milik homestay

Di domain yang terdaftar di `SITE_DOMAIN_*`, `/` milik homestay dan jalur lain
ditulis ulang di bawah awalan situsnya. Akibatnya dashboard tidak punya alamat
sama sekali di sana, dan itu ditemukan dengan cara yang tidak enak: setelah
`eddohomestay.com` live, `/` menyajikan Eddo dan semua jalur lain menjawab 404.

Jadi dashboard punya alamat kedua:

```
eddohomestay.com/kelola        dashboard dan CMS
unmehopamanagement.com/kelola  sama, nanti
unmehopamanagement.com/        juga dashboard, seperti biasa
```

Bekerja karena penulisan ulang jalur berjalan **sesudah** filesystem, jadi
route sungguhan menang atasnya. Itu alasan yang sama kenapa `/turtle`,
`/api/...` dan `/preview` tetap hidup di domain homestay.

**Subdomain di panel Hostinger bukan jalan keluarnya.** Subdomain di sana
dipetakan ke folder dokumen, misalnya
`/home/u.../domains/eddohomestay.com/public_html/kelola`, sedangkan aplikasi
Node kita hidup di `hbuilds/versions/<uuid>` dan dijalankan lsnode untuk domain
utama. Subdomain semacam itu akan menyajikan folder kosong, bukan dashboard.
Menjadikannya website Node tersendiri juga bisa, tapi berarti men-deploy arsip
yang sama dua kali dan menjaganya tetap seiring selamanya, dan hari keduanya
melenceng adalah hari seseorang mengubah harga di salinan yang tidak disajikan
siapa pun.

Halaman `/kelola` diberi `noindex`: pintunya bukan rahasia, tapi juga bukan
pintu masuk.

## Mengerjakan situs yang domainnya sudah menyala

Mode perbaikan dulu berarti semua orang melihat halaman tunggu, termasuk yang
mengerjakan situsnya, sehingga tidak berguna justru untuk keadaan yang paling
sering membutuhkannya.

Sekarang ada jalan masuk. Isi `PREVIEW_TOKEN` di panel server, lalu buka sekali
di tiap perangkat:

```
https://eddohomestay.com/preview?token=<isi PREVIEW_TOKEN>
https://eddohomestay.com/preview?clear=1     mengembalikan cookie-nya
```

Cookie-nya `httpOnly`, jadi tidak ada skrip di halaman yang bisa membacanya,
dan `sameSite=lax`, jadi ikut pada kunjungan biasa tapi tidak pada permintaan
yang dibuat situs lain atas namamu. `secure` menyala sendiri di https dan mati
di http, supaya pengujian lokal tetap bisa jalan tanpa token pernah lewat
terbuka di produksi.

Token yang salah dan token yang tidak diisi dijawab sama persis, 404, dan
keduanya tidak menyebutkan yang mana. Tidak ada yang bisa dipelajari dari
bedanya selain apakah menebak layak diteruskan.

`PREVIEW_TOKEN` yang kosong berarti tidak ada jalan masuk sama sekali. Arah itu
disengaja: token yang belum diisi tidak boleh berarti semua orang boleh melihat.

**Soal performa, karena ini sering jadi alasan menolak fitur semacam ini.**
Halaman publik membaca cookie hanya sesudah saklar build-time bilang situsnya
tertutup. Jadi situs yang hidup tetap dibangun sekali saat build dan tidak
pernah menyentuh bagian ini; yang tertutup jadi dinamis, dan itu tidak ada
biayanya karena tidak ada yang sedang dilayani. Terlihat di keluaran `next
build`: dengan Eddo ditutup dan Turtle terbuka, keluarannya `ƒ /eddo` dan
`○ /turtle`.

## Kontak per situs

Dua homestay dengan dua pemilik tidak boleh berbagi satu kotak masuk hanya
karena dulu situsnya cuma satu. `content/site.json` sekarang punya
`sites.turtle` dan `sites.eddo`, masing-masing bisa menyetel `contact`,
`social`, dan `maintenance` sendiri.

**Kolom yang dikosongkan berarti mewarisi nilai bersama**, bukan mengosongkan
tampilan. Itu disengaja: pemisahan bisa dilakukan satu kolom sekali jalan, dan
formulir yang baru terisi separuh tidak membuat footer jadi kosong.

**Keadaan hari ini: kontak Eddo masih kosong, jadi masih ikut Turtle.** Artinya
tamu yang membuka `eddohomestay.com` melihat alamat email di
`turtlehomestay.com`, dan pesannya masuk ke kotak masuk Turtle. Mekanismenya
sudah jalan dan sudah diuji; yang kurang tinggal tiga nilai yang cuma
pemiliknya tahu, diisi lewat tab Kontak bagian "Kontak per situs":

```
sites.eddo.contact.whatsapp     nomor WhatsApp Eddo
sites.eddo.contact.email        email yang tampil di footer Eddo
sites.eddo.contact.ownerEmail   ke mana pesan dan notifikasi bayar Eddo dikirim
```

Perutean pesan tidak memakai nama properti yang tampil di layar, melainkan
kunci tersendiri (`siteKey`). Nama bisa diganti kapan saja oleh siapa saja yang
mengedit teks, dan perutean yang ikut berubah saat nama diganti adalah
perutean yang akan salah tanpa ada yang tahu.

## Bisa tidak di hosting bersama, dan khususnya di Hostinger?

Yang menentukan bukan harga paketnya, melainkan satu hal: **hosting itu bisa
menjalankan proses Node yang hidup terus atau tidak.** Aplikasi ini Next.js dan
lima endpoint-nya ditulis khusus untuk runtime Node:

```
src/app/api/content/route.ts      runtime = "nodejs"
src/app/api/enquiry/route.ts      runtime = "nodejs"
src/app/api/pay/route.ts          runtime = "nodejs"
src/app/api/pay/notify/route.ts   runtime = "nodejs"
src/app/api/rates/route.ts        runtime = "nodejs"
```

**Cara memastikannya satu menit:** buka panel hosting, cari menu "Node.js" atau
"Setup Node.js App". Tidak ada menu itu, jawabannya tidak, dan bukan cuma
pembayarannya yang mati melainkan seluruh situsnya.

**Untuk Hostinger, jawabannya ada.** Paket Business Web Hosting mencantumkan
"5 Aplikasi Node.js", dan dokumentasi Next 16 yang ikut terpasang di repositori
ini mencantumkan Hostinger sebagai target deploy resmi, di
`node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` baris
38. Ketiga situs ini satu aplikasi yang sama, jadi yang terpakai satu slot
Node, bukan tiga.

### Kenapa payment gateway yang paling mengunci pilihan hosting

Kalau situsnya diubah jadi berkas statis supaya muat di hosting yang tidak
punya Node, pembayarannya tetap mati, dan bukan karena kodenya kurang pintar:

1. **Kunci server Midtrans tidak boleh sampai ke browser.** Kunci itu yang
   menandatangani permintaan Snap. Di situs statis tidak ada tempat
   menyimpannya selain di dalam halaman, dan di dalam halaman artinya siapa pun
   bisa membacanya.
2. **Notifikasi Midtrans butuh alamat yang bisa menerima POST.**
   `/api/pay/notify` memeriksa tanda tangan SHA-512 sebelum percaya. Berkas
   statis tidak bisa menerima POST, apalagi memeriksa tanda tangan.
3. **Nominalnya dihitung di server** dari tabel kamar. Tanpa server, nominalnya
   datang dari browser, dan nominal yang datang dari browser adalah nominal
   yang dipilih pengirimnya.

## Pindah ke Hostinger

### Aturan pertama: jangan pernah build di server itu

Diukur di repositori ini, `next build` memuncak di sekitar **1,4 GB memori**
tersebar di proses pekerjanya. Di mesin build itu lega, di hosting bersama itu
jatah paket, dan build yang kehabisan memori mati di tengah jalan tanpa pesan
yang jelas. Jadi build dilakukan di luar, lalu hasilnya yang diunggah.

`next.config.ts` memakai `output: "standalone"`, yang membuat `next build`
menelusuri berkas apa saja yang benar-benar dipakai tiap route lalu menyalin
hanya itu ke `.next/standalone`, lengkap dengan `server.js` kecil pengganti
`next start`. Bedanya bukan sedikit:

```
node_modules             563 MB
.next                    164 MB
.next/standalone          30 MB   <- ini saja yang perlu diunggah
dist/app.tar.gz           14 MB   <- terkompresi
```

Angka itu sudah termasuk satu pembuangan yang disengaja. Penelusuran Next ikut
membawa `sharp`, si pengoptimal gambar, karena `next/image` *mungkin* dipakai.
Di aplikasi ini tidak dipakai sama sekali: semua foto di ketiga situs disajikan
`<img>` atau `<picture>` biasa, tidak ada satu pun impor `next/image`, dan tidak
ada konfigurasi `images`. Yang terbawa jadinya 45 MB dari 64 MB berupa libvips
siap pakai yang tidak pernah dipanggil, rangkap tiga pula: versi glibc, versi
musl, dan cadangan WebAssembly, untuk server yang cuma akan jadi salah satunya.

Jadi `scripts/package.mjs` membuangnya, tapi lebih dulu memeriksa apakah
`next/image` benar-benar tidak ada. Ketemu, sharp dipertahankan dan skripnya
memberi tahu. Ini bukan dibuang lewat `outputFileTracingExcludes`: opsi itu
sudah dicoba dan tidak berpengaruh, karena kuncinya berbasis route sedangkan
sharp ditarik oleh penelusuran server Next-nya sendiri, jadi tidak ada glob
route yang pernah cocok.

Yang di sebelah kanan jalan **tanpa `npm install`** di server.

`server.js` tidak menyajikan `public/` dan `.next/static` dengan sendirinya,
karena Vercel menyajikan keduanya dari edge-nya sendiri. Satu proses Node tidak
punya edge, jadi keduanya harus disalin masuk. Itu tugas `npm run package`.
**Kalau langkah ini terlewat situsnya tetap menyala tapi tanpa CSS dan tanpa
foto**, yang kelihatan seperti build rusak padahal cuma penyalinan yang tidak
jalan. Karena itu skripnya memeriksa hasil kerjanya sendiri di akhir.

### Langkahnya

1. **Build di GitHub Actions.** Workflow `.github/workflows/build.yml` jalan
   setiap push ke `main` dan bisa dijalankan manual. Hasilnya `app.tar.gz` di
   bagian Artifacts. Mau build di laptop sendiri juga boleh:
   `npm ci && npm run build && npm run package:archive`.
2. **Isi dulu variabel yang dibaca saat build** (lihat tabel di bawah), di
   Settings, Secrets and variables, Actions, tab Variables. Kalau ini kosong
   saat build, domainnya tidak akan dikenali dan tombol bayarnya tidak punya
   client key, dan mengisinya setelah build tidak memperbaiki apa pun.
3. **Unggah dan bongkar** `app.tar.gz` ke folder aplikasi di Hostinger, lalu
   **buka `BUILD-INFO.txt`** yang ikut di dalamnya sebelum menjalankan apa pun.
   Berkas itu ditulis saat pengemasan dengan membaca kembali routing manifest
   hasil build, jadi isinya bukan niat melainkan kenyataan:

   ```
   Domain aktif  : eddohomestay.com, www.eddohomestay.com
   ```

   Tertulis `TIDAK ADA`, hentikan di situ dan ulangi dari langkah 2. Arsip
   tanpa domain tidak rusak dan tidak mengeluh, ia cuma menyajikan dashboard di
   alamat homestay. Sudah diuji: `eddohomestay.com` menjawab dengan halaman
   berjudul "Unmehopa Management · Booking Manager".
4. **Perintah start:** `node server.js`. Bukan `npm start`, karena di dalam
   arsip itu tidak ada `next`, yang ada `server.js` hasil standalone.
5. **Port:** jangan dipatok. `server.js` membaca `PORT` dan `HOSTNAME` dari
   lingkungan, dan Hostinger yang menentukan portnya.
6. **Isi variabel runtime** di panel Node.js-nya, lalu restart aplikasinya.
7. **Daftarkan URL notifikasi Midtrans** ke `https://<domain>/api/pay/notify`
   di dashboard Midtrans. Tanpa ini pembayaran tetap jalan tapi tidak ada yang
   memberi tahu servernya bahwa uangnya sudah masuk.

### Variabel mana yang dibaca kapan

Salah menaruh yang kiri ke kanan adalah kesalahan paling sering di sini, dan
gejalanya membingungkan karena tidak ada yang error, cuma perilakunya salah.

| Dibaca saat **build** (di GitHub Actions) | Dibaca saat **jalan** (di panel Hostinger) |
| --- | --- |
| `SITE_DOMAIN_TURTLE` | `MIDTRANS_SERVER_KEY` |
| `SITE_DOMAIN_EDDO` | `MIDTRANS_IS_PRODUCTION` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `RESEND_API_KEY`, `ENQUIRY_FROM` |
| `NEXT_PUBLIC_LOGIN_HERO` | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` |
| | `CMS_PASSWORD` |
| | `RATES_URL` (opsional) |

Yang kiri ikut tertanam ke dalam hasil build, jadi **ganti domain berarti build
ulang**, bukan sekadar ubah variabel lalu restart. Yang berawalan
`NEXT_PUBLIC_` ikut tertanam ke JavaScript yang diunduh browser, jadi jangan
pernah menaruh rahasia di sana. Yang kanan tidak pernah ikut ke arsip dan tidak
pernah sampai ke browser.

### Yang perlu dipastikan ada di sana

- **Node 22.** Versi yang dipakai mengembangkan dan yang dipatok di workflow.
- **Koneksi HTTPS keluar.** `/api/rates` memanggil sumber kurs, `/api/pay`
  memanggil Midtrans, `/api/enquiry` memanggil Resend, dan CMS menulis ke
  GitHub. Kalau keluarnya diblokir, `/api/rates` menjawab 503 dan harga tampil
  dalam rupiah saja, sementara pembayaran dan enquiry ikut mati.
- **Proses yang dihidupkan lagi kalau mati**, dan yang mulai sendiri setelah
  server reboot.

### Yang berubah dalam cara kerja sehari-hari

Di Vercel, CMS menyimpan ke GitHub lalu Vercel build ulang sendiri dan semenit
kemudian perubahannya tayang. Di Hostinger rantai itu putus di langkah
terakhir: buildnya jalan di Actions, tapi hasilnya tidak berjalan sendiri ke
server. Jadi **setiap kali pemiliknya mengubah harga atau nomor WhatsApp lewat
CMS, ada satu langkah unggah manual**, kecuali nanti dipasang deploy otomatis.
Ini bukan alasan untuk tidak pindah, cuma hal yang harus diketahui sebelum
menjanjikannya ke pemilik homestay.

### Yang tetap boleh tinggal di hosting bersama

Email. Domain bisa menunjuk ke Vercel atau ke VPS lewat A record sementara
emailnya tetap di Hostinger lewat MX record. Keduanya catatan DNS yang berbeda
dan tidak saling mengganggu, jadi paket yang sudah dibeli tidak mubazir.

## Pindah server nanti, misalnya dari VPS kecil ke yang lebih besar

Aplikasi ini **tidak punya database**, dan itu yang membuat pindahan jadi
pekerjaan setengah jam, bukan proyek sendiri. Yang biasanya bikin pindahan
menakutkan adalah data yang cuma ada di satu mesin; di sini tidak ada:

| Yang orang kira ada di server | Sebenarnya di mana |
|---|---|
| Isi tab Website | di repo GitHub, ditulis lewat `GITHUB_TOKEN` |
| Foto dan logo | di repo, folder `public/` |
| Pesan dari formulir | di kotak masuk email, tidak pernah disimpan |
| Pembayaran | di dashboard Midtrans, plus email pemberitahuan |
| Harga kamar | di tabel kamar dalam kode |

Jadi yang benar-benar pindah cuma tiga: **repo, variabel lingkungan, dan
DNS.** Urutan yang aman:

1. Turunkan TTL DNS domainnya ke 5 menit, sehari sebelum pindah.
2. Siapkan server barunya sampai situsnya jalan di alamat sementara, dengan
   **variabel lingkungan yang sama persis**. Cocokkan satu per satu dengan
   tabel di atas; yang paling sering ketinggalan adalah `SITE_DOMAIN_*`, dan
   ketinggalan itu tidak terlihat sebagai error, melainkan sebagai domain yang
   menyajikan dashboard.
3. Arahkan DNS ke server baru, tunggu TLS-nya terbit di sana.
4. Cek daftar di bawah, lalu matikan server lama setelah sehari, bukan
   langsung.

Yang **tidak** ikut pindah sendiri dan harus dicek ulang:

- **Payment Notification URL di Midtrans**, kalau domainnya ikut berubah.
  Kalau domainnya sama, ini aman.
- **Backup harian.** Di aplikasi tanpa database, isi backup yang berharga
  bukan datanya melainkan variabel lingkungan dan konfigurasi servernya.
  Simpan salinan variabelnya di tempat lain juga, bukan cuma di server.

Satu hal yang perlu dipastikan sebelum memakai VPS kecil: **`next build` butuh
memori.** Kalau server barunya 1 vCPU dengan RAM kecil dan Coolify ikut
berjalan di situ, build bisa mati di tengah jalan karena kehabisan memori.
Dua jalan keluarnya, pilih salah satu: tambahkan swap 2 GB di server, atau
build di GitHub Actions dan kirim hasilnya ke server. Yang kedua juga bikin
deploy tidak lagi membebani server yang sedang melayani tamu.

## Setelah deploy: yang wajib dicek

- Buka ketiga alamat dan pastikan masing-masing membuka situs yang benar.
- Kirim satu pesan percobaan dari formulir tiap situs. Subjek emailnya harus
  menyebut properti mana yang ditanyakan.
- Simpan satu perubahan dari tab Website dan tunggu satu menit; halamannya
  harus ikut berubah.
