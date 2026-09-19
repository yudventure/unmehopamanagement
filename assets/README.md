# Aset situs

Catatan tentang isi `public/`, yang **tidak** disimpan di sini bersamanya.

Berkas di `public/` disajikan apa adanya di root situs: `public/hero.jpg`
menjadi `https…/hero.jpg`. Itu juga berlaku untuk berkas yang bukan gambar,
dan itulah sebabnya catatan ini pindah ke `assets/`. Selama ia berada di
`public/`, ia bisa dibaca siapa pun di `https://eddohomestay.com/README.md`:
dua puluh tiga kilobita catatan kerja, lengkap dengan alasan tiap keputusan,
terbuka untuk umum tanpa ada yang meminta.

**Nama berkas peka huruf besar-kecil.** Server-nya Linux; Mac bukan. `Hero.jpg`
yang ditimpakan ke `hero.jpg` akan jadi berkas kedua dan halamannya kehilangan
foto tanpa terlihat salah di komputermu. Pakai huruf kecil semua.

## `hero.jpg` — foto besar di website `/turtle`

Untuk mengganti fotonya, **timpa berkas ini** dengan nama yang sama persis.
Tidak ada kode yang perlu diubah.

- **Rasio** melebar (landscape). Bagian tengah gambar yang paling aman —
  atas dan bawah terpotong tergantung tinggi layar. Di HP, crop-nya digeser
  sedikit ke kiri.
- **Lebar** minimal 1920px. Lebih dari 2560px tidak menambah apa-apa.
- **Ukuran berkas** usahakan di bawah 400 KB. Yang sekarang 120 KB — bagus.

Kalau berkasnya hilang atau namanya salah, hero jatuh ke ilustrasi SVG — bukan
ke gambar rusak.

## `1.jpg`, `2.jpg`, `3.jpg` — tiga kartu di bagian "Satu dermaga"

Urutannya sesuai urutan berkas, kiri ke kanan:

| Berkas | Isi foto | Judul kartu |
|---|---|---|
| `1.jpg` | tamu di ujung dermaga saat senja | Sore di dermaga |
| `2.jpg` | dua tamu makan di pondok | Makan bersama |
| `3.jpg` | jalur papan di depan bungalow | Kamar di tepi air |

Judulnya mengikuti isi fotonya, bukan sebaliknya. Kalau fotonya diganti, cek
lagi judulnya di `src/components/web/site.tsx` — bagian bertanda "values".

Rasio kartunya 3:4; foto 4:5 (1080×1350) terpotong sedikit di atas-bawah.

**Ketiganya masih berat**: 755 KB, 1,1 MB, dan 840 KB — bersama hero jadi
sekitar 3 MB untuk satu halaman. Dimuat malas (`loading="lazy"`) jadi tidak
menahan tampilan pertama, tapi di sinyal pulau tetap terasa. Simpan ulang di
lebar 1080px dengan kualitas 80 biasanya turun ke 150–250 KB per foto.

## `standard.jpg`, `family.jpg` — foto kartu kamar

Satu foto per tipe kamar, dinamai sesuai tipenya, bukan diberi nomor. Jadi
mengganti foto kamar keluarga berarti menimpa berkas bernama `family.jpg` dan
tidak ada yang perlu dihitung urutannya.

| Berkas | Kartu | Isi foto sekarang |
|---|---|---|
| `standard.jpg` | Kamar Standar | deretan kamar kayu berpanggung di tepi pasir |
| `family.jpg` | Kamar Keluarga | satu kamar keluarga dari depan, teras lebar + hammock |

Rasio kartunya 16:10, jadi foto mendatar paling pas. Foto tegak akan terpotong
banyak di atas dan bawah.

Kalau fotonya diganti, cek lagi teks `alt`-nya di `src/lib/web-content.ts`
(`rooms.types.<tipe>.alt`, dua bahasa) — teks itu menerangkan isi foto untuk
pembaca yang tidak bisa melihatnya, jadi ikut basi kalau fotonya berubah.

## `manta.jpg` — latar bagian selam

Dipasang sebagai background seluruh bagian "Turtle Dive Center", dengan lapisan
gelap kebiruan di atasnya (66%) supaya teksnya tetap terbaca. Kartu paketnya
punya latar gelap sendiri, jadi lapisan itu tidak perlu setebal kalau kartunya
transparan.

Rasio melebar, bagian tengah yang paling aman. Bagiannya tinggi di HP, jadi
fotonya terpotong banyak di kiri-kanan dan lebih terbaca sebagai tekstur air
daripada sebagai foto manta. Itu wajar dan tidak perlu diperbaiki.

Kalau berkasnya hilang, bagian itu kembali jadi blok gelap polos seperti
sebelumnya, bukan gambar rusak.

Foto ini juga dipakai sebagai kepala halaman detail paket Fun Dive dan
Snorkelling, dengan lapisan gelap yang sama.

## Foto kepala halaman detail paket selam

Diatur di `src/lib/dive-detail.ts`, satu baris `photo` per paket:

| Paket | Foto | Alasan |
|---|---|---|
| Fun Dive 2 & 3 tank, Snorkelling | `manta.jpg` | isinya memang menyelam |
| Discover Scuba | `hero.jpg` | air dangkal toska depan homestay, persis tempat paket ini dimulai |
| Open Water Course, Sewa Alat | `3.jpg` | jalur papan dan air tenang di depannya |

`1.jpg` **sengaja tidak dipakai** di sini: itu potret dekat seorang tamu, dan
wajah yang bisa dikenali sebaiknya tidak jadi kepala halaman produk berbayar
tanpa kita tahu orangnya setuju.

## Perahu di kartu musim

Bukan berkas foto — digambar sebagai SVG di `src/components/web/season-scenes.tsx`.
Perahu yang sama di ketiga kartu, yang berbeda cuma cara geraknya, dan itu diatur
di satu tempat (`BOAT`): Oktober–Februari meluncur nyaris rata, bulan peralihan
terguncang sedang, Mei–Juli melompat keluar dari air dan mendarat keras lengkap
dengan cipratan. Diukur di browser: geraknya 3px, 11px, dan 22px.

Posisinya dipatok dalam piksel dari dasar kartu, bukan persen, karena pita
airnya adalah padding tetap 64px sementara tinggi kartunya ikut panjang
paragrafnya.

## Galeri di halaman `/turtle/about`

Ada dua galeri: **Tempatnya sendiri** (homestay) dan **Di bawah perahu**
(selam). Isinya diatur di `src/lib/gallery.ts`, bukan dengan memindai isi
folder ini — galeri yang mengambil apa saja yang kebetulan ada di `public/`
suatu hari akan menampilkan logo, tangkapan layar, atau foto yang tidak
dimaksudkan untuk publik.

Sekarang: 6 foto untuk homestay (`hero`, `3`, `standard`, `family`, `2`, `1`)
dan **1 foto untuk selam** (`manta`). Yang selam tipis karena memang cuma ada
satu foto bawah air di repo ini. Dengan satu foto, galerinya tampil melebar
penuh, bukan sebagai grid berlubang.

**Menambah foto:**

1. Taruh berkasnya di `public/`, huruf kecil semua, mis. `dive-2.jpg`.
2. Tambahkan satu baris di `src/lib/gallery.ts` dengan `caption` baru.
3. Tambahkan kunci caption itu di `about.gallery.captions` **di dua bahasa**
   pada `src/lib/web-content.ts`. Bertipe, jadi terjemahan yang lupa diisi akan
   menggagalkan build, bukan menayangkan caption Inggris di halaman Indonesia.

Grid-nya pas untuk **6 foto** (satu memimpin 2 kolom × 2 baris, lima sisanya
mengisi tepat). Jumlah lain tetap jalan, cuma barisan terakhirnya bisa
menyisakan lubang.

## `piaynemo.jpg` — latar footer

Foto puncak Piaynemo, dipasang sebagai background seluruh footer dengan lapisan
gelap kehijauan **88%** (`#08291c`) di atasnya. Rata, bukan gradien: foto ini
terang hampir di semua bagiannya — air toska, langit pucat, daun kena matahari
— jadi gradien akan menyisakan satu sudut terbaca dan sudut lain tidak.

Diukur: seluruh 18 potongan teks di footer lolos AA, yang paling lemah 9,0:1.
Latarnya sendiri kira-kira separuh lebih gelap dibanding versi 82% sebelumnya
(luminansi tengahnya 0,024 dari 0,045), tapi bentuk pulau, air, dan pagar
dermaganya masih kelihatan — jadi gelap, bukan blok hitam.

Kalau mau diubah lagi, cuma satu baris di `src/components/web/site.tsx`,
bertanda "footer": angka setelah garis miring itu persen kepekatannya. Naikkan
untuk lebih gelap, turunkan untuk lebih terang.

`bg-teal` tetap ada di bawahnya sebagai lantai, jadi kalau berkasnya hilang
footernya kembali hijau polos seperti sebelumnya, bukan gambar rusak.

Nama aslinya `PIAYNEMO.jpg` (huruf besar) dan sudah diganti jadi huruf kecil
supaya konsisten dengan yang lain dan aman di server yang peka huruf.

## Ikon media sosial di footer

Digambar sebagai SVG (`src/components/web/icons.tsx`), bukan berkas gambar.
Ikonnya **selalu tampil**; yang menentukan cuma apakah dia jadi tautan atau
belum. Kalau URL-nya dikosongkan di tab Website, ikonnya jadi lingkaran redup
yang tidak bisa diklik, dan pembaca layar tidak diberi tahu soal sesuatu yang
tidak bisa diikuti.

**Yang terisi sekarang cuma halaman depan platformnya** —
`https://www.facebook.com`, `https://www.instagram.com`,
`https://www.tiktok.com`. Itu sengaja: ikonnya jadi terlihat memang bisa
diklik, jadi tata letaknya bisa dinilai apa adanya. Tapi ini **belum akun
Turtle Dive Homestay**, dan pengunjung yang mengklik akan mendarat di beranda
Facebook, bukan di halaman homestay. Ganti ketiganya di tab Website sebelum
situsnya diumumkan.

## `ssi-white.png` dan `ssi-red.png` — logo SSI di bagian selam

Dua berkas, satu dipakai:

| Berkas | Isi | Dipakai di |
|---|---|---|
| `ssi-red.png` | aslinya, merah `#E32117`, 1920×1080, latar transparan | **tidak dipakai**, disimpan sebagai master |
| `ssi-white.png` | mark yang sama, putih, dipotong pas, 373×200 | bagian selam di `/turtle` |

Yang putih **dibuat dari** yang merah, bukan digambar ulang: kanal alpha-nya
disalin apa adanya lalu tintanya dicat putih, jadi lengkungannya masih punya
tepi halus dan bentuknya persis sama dengan yang dikirim SSI. Yang asli juga
sudah dipotong dari 1920×1080 (sebagian besar isinya ruang kosong) jadi
1436×770, lalu dikecilkan ke tinggi 200px. Dari 90 KB jadi 18 KB.

Ditaruh **di samping judul** bagian selam, rata tengah terhadap dua barisnya.
Sebelumnya di pojok kanan seksi, dan dari sana dia kelihatan seperti nyasar:
ada setengah lebar judul air kosong di antaranya. Di HP dia turun ke bawah
judul, di atas paragrafnya.

**Ukurannya ikut judulnya**, bukan angka tetap: tingginya
`clamp(31px, 4.7vw, 52px)` sementara judulnya `clamp(34px, 5.2vw, 58px)`, jadi
logonya selalu sekitar 0,9× ukuran hurufnya di lebar berapa pun. Sengaja
sedikit lebih kecil — mark ini blok padat sementara hurufnya punya rongga,
kalau tingginya disamakan persis logonya terbaca lebih berat daripada judul
yang didampinginya. Diukur dari 320px sampai 2560px: rasionya tetap di
0,89–0,92× dan judulnya tetap patah di baris yang sama.

**Kalau logonya diganti**, timpa `ssi-red.png` lalu buat ulang yang putih.
Skripnya tidak disimpan di repo karena sekali pakai; intinya: ambil kanal
alpha berkas aslinya, cat RGB-nya jadi putih, potong sesuai isi.

Diukur di 11 bentuk layar dari 360×640 sampai 2560×1200: yang paling lemah
7,67:1 terhadap piksel paling terang di belakangnya. Perlu diukur karena foto
mantanya `cover` dan bergeser mengikuti bentuk layar, jadi perut mantanya yang
hampir putih bisa saja mendarat di belakang logo putih. Ternyata tidak pernah,
jadi logonya tidak diberi bayangan.

**Tulisan di atasnya "Mitra pelatihan" / "Training partner".** Itu istilah
umum yang aman. Kalau SSI memberi status resmi tertentu ke Turtle Dive Center
(misalnya "SSI Dive Center" atau tingkat lain), ganti tulisannya supaya sesuai
— lembaga sertifikasi biasanya cukup ketat soal istilah ini. Ada di
`src/lib/web-content.ts`, kunci `dive.partner`, dua bahasa.

## `logo.png` — lencana Turtle Dive Homestay

Dipakai di footer website, dan disalin ke `src/app/turtle/icon.png` sebagai
ikon tab browser. **Kalau logonya diganti, ganti kedua berkas itu.**

Latarnya putih pekat (bukan transparan), jadi di kode ia dipotong jadi
lingkaran supaya sudut putihnya tidak terlihat. Tinta lencana ini paling jauh
134px dari pusat kanvas 300px — masih di dalam lingkaran potong 150px, jadi
tidak ada bagian logo yang terpotong. **Logo pengganti perlu proporsi serupa**:
lencana bulat di tengah kanvas persegi. Logo mendatar akan terpotong.

Logo ini hanya dipakai di website. Dashboard `/` memakai lencana Unmehopa
(`src/components/brand-logo.tsx`) — dua merek berbeda, sengaja dipisah.

## Situs Eddo Homestay (`/eddo`)

Situs kedua, untuk properti kedua. **Logo, hero, karosel kamar, dan kartu
ajakan sudah berfoto; empat kartu "di sekitar" belum.** Halamannya tetap
lengkap tanpa yang belum ada, karena setiap foto punya ilustrasi SVG di
bawahnya yang tampil selama berkasnya kosong. Begitu berkasnya ditaruh,
fotonya yang tampil, tanpa mengubah kode.

| Berkas | Dipakai di | Rasio |
|---|---|---|
| `website_logo_eddo_homestay.png` | **tidak dipakai**, disimpan sebagai master | aslinya dari pemilik: 2000×2000, latar transparan, 388 KB |
| `eddo-logo.webp` | kepala halaman, footer, halaman perbaikan | 164×240, 20 KB. Dibuat dari master di `assets/foto-asli/`. Di atas foto ditampilkan putih lewat filter |
| `eddo-hero.jpg` | latar hero di layar ≥1024px | 2:1, 1760×880, 218 KB. **Berkas ini juga menentukan bentuk hero** — lihat di bawah |
| `eddo-hero-tall.webp` | latar hero di layar <1024px | 9:16, 1080×1920, 305 KB |
| `eddo-hero-tall-800.webp` | sama, untuk layar yang tidak butuh selebar itu | 800×1422, 166 KB |
| `eddo-kamar-1.webp` … `-10.webp` | karosel foto di bagian kamar | 4:3, 1200×900, 76 sampai 168 KB |
| `eddo-kamar-1-720.webp` … `-10-720.webp` | sama, untuk layar sempit | 4:3, 720×540, 35 sampai 69 KB |
| `eddo-around-1.jpg` | kartu "Dermaga Yenbuba" | 3:4 (tegak). **Belum ada** |
| `eddo-around-2.jpg` | kartu "Burung cendrawasih" | 3:4. **Belum ada** |
| `eddo-around-3.jpg` | kartu "Arborek" | 3:4. **Belum ada** |
| `eddo-around-4.jpg` | kartu "Piaynemo" | 3:4. **Belum ada** |
| `eddo-cta.webp` | kartu ajakan di bagian "Kenapa Eddo" | 4:3, 1200×900, 134 KB. Ditutup lapisan toska gelap dari kiri |
| `eddo-cta-720.webp` | sama, untuk layar sempit | 4:3, 720×540, 54 KB |

Aturannya sama seperti situs Turtle: huruf kecil semua, lebar 1080 sampai
1920px, usahakan di bawah 300 KB per foto.

Empat kartu `eddo-around-*` masih kosong karena tidak ada fotonya. Semua foto
yang dikirim pemilik adalah foto homestay-nya sendiri, dan menaruh foto rumah
di bawah tulisan "Piaynemo" akan membuat situsnya berbohong. Selama kosong,
yang tampil ilustrasi, dan itu jujur. Empat slot itu masih menunggu `.jpg`,
bukan `.webp`, karena alamatnya ditulis pasti di dalam kode.

### Master fotonya tidak disimpan di sini

Ada di `assets/foto-asli/`, di luar folder ini. Folder `public/` disalin
seluruhnya ke dalam paket yang dikirim ke server (`scripts/package.mjs`), jadi
berkas yang disimpan di sini ikut terkirim di setiap deploy walaupun tidak
pernah ditampilkan. Master 12 foto kamar plus dua master hero berjumlah sekitar
14 MB; disimpan di sini, itu 14 MB yang diunggah ulang setiap kali harga kamar
berubah.

Yang ada di `assets/foto-asli/`: `1.png` sampai `11.png` (1440×1080, asli dari
pemilik), `Hero_Mobile.png` (1080×1920), dan `Eddo_Homestay_1.png` (3780×1890,
master hero layar lebar).

**Karosel kamarnya tidak punya batas jumlah foto.** Yang menentukan isinya
adalah isi folder ini, bukan angka di dalam kode: `src/app/eddo/page.tsx`
membaca `public/` sewaktu build dan mengambil semua berkas bernama
`eddo-kamar-<angka>.jpg` (juga `.jpeg`, `.png`, `.webp`), diurutkan menurut
angkanya. Jadi menambah foto kesebelas berarti menaruh satu berkas, bukan
menyunting kode. Urutan angkanya tidak harus rapat, tapi rapat lebih mudah
dibaca orang berikutnya.

Selama belum ada satu pun, karoselnya menampilkan dua ilustrasi seperti bagian
lain di situs ini. Titik-titik penandanya berhenti digambar kalau fotonya lebih
dari dua belas, karena di atas itu titiknya tidak bisa dibedakan lagi dan
penghitung di pojok yang mengerjakan tugasnya.

**Lencananya dipakai lagi, bersama nama dalam huruf.** Yang dilepas cuma baris
kampung di bawah nama: tiga hal dalam bar setinggi 46px membuat baris itu
mengecil sampai terbaca sebagai tekstur, bukan sebagai kata. Tinggi lencananya
2,1 kali ukuran huruf namanya, jadi bar, footer, dan halaman perbaikan tetap
sebanding tanpa disetel satu per satu.

`eddo-logo.webp` dibuat dari masternya, bukan digambar ulang. Masternya kanvas
2000×2000 dengan lencananya menempati 60% lebar dan 87% tinggi, jadi sepertiga
kanvasnya udara kosong: dipakai apa adanya di kepala halaman, lencananya akan
mengecil sendiri untuk muat di kotak persegi dan menyisakan ruang kosong di
kiri-kanan. Jadi ia dipotong ke isinya lalu diperkecil ke tinggi 240px. Dari
388 KB jadi 45 KB, untuk gambar yang di layar cuma 40px tingginya.

Lencananya **tegak**, 164×240, bukan persegi. Di kode ukurannya diatur lewat
tinggi dan lebarnya ikut sendiri; kalau dipaksa ke kotak persegi, hasilnya
lencana kecil di tengah kotak yang kebanyakan kosong.

Kode sengaja tidak menggambar bingkai atau sudut membulat apa pun di
sekelilingnya, karena lencananya sudah punya garis tepi sendiri.

**Kalau logonya diganti**, timpa masternya lalu buat ulang yang dipakai:
potong ke isinya, skalakan ke tinggi 240px, simpan PNG. Skripnya tidak
disimpan di repo karena sekali pakai.

Kalau berkasnya hilang, kepala halaman memakai nama dalam huruf, bukan gambar
rusak.

**Warna toska situs ini diambil dari logonya**, bukan dikira-kira: `#04acb4`,
hasil membaca piksel berkasnya. Nilai sebelumnya `#17a9ae` adalah tebakan mata
dan meleset. Warna itu terang, jadi ia cuma untuk hiasan; yang membawa huruf
adalah `#06777d`. Alasannya ada di `src/app/globals.css`.

### Foto hero: `eddo-hero.jpg` dan `eddo-hero-tall.webp`

Dua berkas untuk satu tempat, dan **keduanya perlu diganti bersamaan** kalau
fotonya diganti.

Dulu keduanya satu foto yang sama: berkas layar sempit adalah `eddo-hero.jpg`
yang dikecilkan, 900×450, mendatar, dipasang di bingkai yang tegak setinggi
layar. Browser membesarkannya sampai sekitar 1688px lalu membuang sisi
kiri-kanannya, jadi pembaca di HP, yang jumlahnya paling banyak, justru
mendapat gambar terburuk di situs ini. Titik jangkar mendatarnya disetel ke 62%
untuk mengejar rumah-rumahnya yang tergeser oleh peregangan itu.

Sekarang berkas layar sempit adalah fotonya sendiri, 1080×1920, sebentuk dengan
bingkainya. Tidak ada yang dibesarkan, potongannya cuma beberapa persen, dan
jangkarnya kembali ke tengah.

**Bentuk hero ditentukan oleh ada-tidaknya `eddo-hero.jpg`**, dicek di disk
sewaktu build (`src/app/eddo/page.tsx`), bukan di browser. Kalau dicek di
browser, pembacanya akan melihat halamannya berubah bentuk setelah tampil.
Tanpa berkas itu, hero jadi blok warna pucat polos. Dengan berkas itu:

- **≥1024px** fotonya **memenuhi seluruh hero**, dari puncak sampai dasar,
  termasuk di belakang bar. Tidak ada penutup putih di mana pun. Tulisannya
  putih di atas foto.
- **<1024px** sama: fotonya memenuhi layar (`min-height: 100svh`), bukan lagi
  pita di bawah tulisan.

Dulu di HP fotonya turun jadi pita sendiri, karena lapisan putih yang cukup kuat
untuk membaca satu paragraf di atasnya menutupi seluruh bingkai dan menyisakan
foto yang tidak kelihatan. Yang berubah arah lapisannya: gelap memperdalam
airnya, bukan memucatkannya, jadi fotonya selamat dibaca di atasnya dan HP dapat
hero yang sama dengan desktop.

`svh`, bukan `vh`: `vh` diukur terhadap browser dengan bar-nya disembunyikan,
jadi hero yang memakainya mulai lebih tinggi dari layarnya lalu menyusut sambil
digulir.

Crop-nya dua, karena kotaknya dua bentuk. Layar lebar: seluruh lebar fotonya
kelihatan, jadi yang tersisa cuma potongan tegaknya, agak ke bawah karena
puncaknya langit yang tidak diperlukan hero. Layar sempit: bingkainya lebih
tinggi daripada fotonya, jadi potongannya berjalan ke arah sebaliknya, ke kanan
dari tengah tempat rumah dan perahunya berada.

Berkas kecilnya jadi `<img>` dan yang lebar jadi `<source>`, jadi tiap layar
mengunduh satu dan hanya satu.

**Kenapa harus ada sesuatu di antara tulisan dan foto.** Diukur tanpa penutup
apa pun, latar di belakang **satu baris yang sama** berkisar dari luminansi
**0,003 sampai 0,837**: langit dan pasirnya di satu ujung, palem dan pulaunya di
ujung lain. Tidak ada satu warna huruf yang selamat dari rentang itu. Tinta
gelap perlu latar lebih terang dari 0,31; putih perlu latar lebih gelap dari
0,18; dan foto ini dua-duanya, di dalam satu baris.

Halo saja juga sudah dicoba dan diukur: **1,3 sampai 1,9:1 bahkan di tepi
huruf**, karena bayangan yang cukup lebar untuk berarti jadi terlalu tipis untuk
menggelapkan apa pun.

**Jadi yang dipilih arahnya, bukan ada-tidaknya.** Terang sudah dicoba: ia
mengangkat bingkainya, tapi juga memucatkannya, dan airnya berubah dari toska
jadi susu. Dua gradien di sini arahnya **gelap**: airnya makin dalam, bukan
makin pucat, dan palemnya tetap bertepi.

| | Untuk | Kekuatan |
|---|---|---|
| `[data-hero-deep]` | tulisan hero | 0,64 di kiri, penuh sampai 52%, habis di 76% lebar |
| `[data-hero-deep-top]` | bar | 132px, 0,58 di puncak |

Titik 52% itu batas tulisannya, bukan angka bulat: di 1024px baris terpanjang
berakhir di 50% lebar jendela, jadi gradiennya dipertahankan penuh sampai lewat
situ lalu dijatuhkan cepat supaya warna fotonya kembali sesegera mungkin.

Titiknya persen, dan di sini persen aman padahal untuk panel putih dulu tidak:
diukur dari 1024 sampai 2560 di dua bahasa, baris terpanjang hero selalu
berakhir di antara 46% dan 50% lebar jendela, jadi satu titik di 50% mengikuti
tulisannya di lebar berapa pun.

Gradien bar dibuat terpisah karena bar membentang selebar layar, jadi tidak
mungkin tertutup gradien sisi.

**Hurufnya putih dan berhalo di setiap lebar**, dan kembali jadi tinta begitu
bar-nya buram di atas halaman putih. Yang menentukan dua hal saja: ada-tidaknya
foto di hero, dan sudah-belum digulir. Keduanya dipasang oleh markup, bukan oleh
media query.

Gradien sisinya sendiri memang cuma untuk layar lebar, tempat tulisannya
menepi. Di bawah 1024 tulisannya memenuhi lebar, jadi tidak ada sisi yang bisa
disisakan untuk fotonya dan gradiennya berjalan ke bawah, menutupi semuanya,
sedikit lebih ringan di kaki tempat kartu alasan memang akan naik menimpanya.

Halo di huruf bukan itu yang membuatnya terbaca, gradiennya yang membuat.
Halo cuma menjaga goresan huruf tidak larut di tempat fotonya kebetulan pucat,
dan itu gratis.

**Lencananya jadi putih lewat filter, bukan berkas kedua.** `brightness(0)`
membawa semua piksel ke hitam dan membiarkan alpha-nya, `invert(1)` membalik
jadi putih; jadi tikinya tetap punya garis tepi dan tepi halusnya sendiri tanpa
harus ada salinan putih yang mesti ikut diperbarui setiap kali logonya ganti.

**Tinggi hero-nya satu angka juga.** Padding bawahnya 212px di atas 1024px:
itu yang menentukan seberapa banyak fotonya kelihatan sekaligus seberapa jauh
tombol hero berdiri dari kartu booking, karena kartunya naik 72px menimpa kaki
hero. Terukur: hero 700px, dan 140px udara di bawah tombolnya.

**Crop-nya `object-position: center 58%`.** Selebar layar berarti seluruh lebar
fotonya kelihatan, jadi yang tersisa untuk dipilih cuma potongan tegaknya: agak
ke bawah, karena puncak bingkainya langit yang tidak diperlukan hero dan
dasarnya airnya yang diperlukan.

**Keterbacaannya diukur, bukan dikira.** Latarnya foto, dan tidak ada cara
menghitungnya dari CSS: yang dilakukan adalah membuat tulisannya transparan,
memotret halamannya, lalu membaca piksel yang tadinya tertutup huruf. Piksel
terburuk yang menentukan, bukan rata-ratanya.

Diukur dua cara, dan dua-duanya lolos:

| Ukuran | Yang dilihat | Terburuk |
|---|---|---|
| kotak | seluruh kotak barisnya, termasuk sela antar huruf | 3,19:1 (syaratnya 3 untuk huruf besar) |
| tepi | piksel dalam 3px dari goresan huruf | 3,20:1 |

Ukuran "tepi" ditambahkan waktu mencoba halo, karena "kotak" adalah pertanyaan
yang benar untuk penutup dan salah untuk halo. Versi pertamanya keliru: mask
hurufnya diambil dari potret magenta lawan transparan, jadi halonya sendiri
ikut tertandai sebagai huruf dan hasilnya 1,67:1 untuk tulisan yang jelas
terbaca. Sekarang mask-nya dari dua potret yang cuma beda warna tinta dengan
halo dimatikan.

Kalau susunan hero-nya diubah, **ukur ulang**.

**Kenapa dua berkas.** `hidden` di Tailwind itu `display: none`, dan Chromium
tetap mengunduh gambar di dalam elemen yang disembunyikan begitu. Diukur: HP
390px mengunduh berkas 1760px **dan** yang 900px sekaligus, 283 KB untuk pita
yang cuma perlu 65 KB. Jadi lapisan lebarnya dibungkus `<picture>` dengan satu
`<source media="(min-width: 1024px)">`; di bawah 1024 ia jatuh ke piksel
transparan yang ditulis langsung di kode, dan HP tidak meminta apa-apa.
Sesudahnya: HP **0,43 MB**, desktop 0,58 MB satu halaman penuh.

Jadi kalau suatu saat susunannya diubah, **jangan** cukup memasang `hidden` di
gambar yang tidak dipakai — biayanya tetap dibayar pembacanya.

**Bar tidak punya latar sendiri waktu diam** di puncak: tanpa isian, tanpa
garis, tanpa blur. Begitu digulir ia jadi buram tembus pandang di atas halaman
putih. Tulisannya tinta di kedua keadaan, dan itu hanya benar karena gradien
terang di puncak hero mengangkat fotonya di belakang bar. Kalau gradien itu
dilepas, warna tulisan di bar harus ikut diurus, bukan dibiarkan.

Kontak dan tautan media sosialnya **masih memakai isian yang sama dengan
Turtle** (tab Website di dashboard). Kalau Eddo perlu nomor WhatsApp atau
akun Instagram sendiri, itu perlu kolom baru di tab Website; belum ada.

## Foto layanan: `eddo-layanan-*.webp`

Belum ada satu pun. Bagian **Layanan** di situs Eddo menampilkan kartu produk
dan tiap kartu punya slot foto sendiri. Yang belum berfoto menampilkan gambar
garis jenisnya beserta tulisan "fotonya menyusul", bukan kotak kosong.

Delapan golongannya, urutannya seperti yang tampil:

| Kunci | Judulnya |
| --- | --- |
| `snorkeling` | Trip snorkeling |
| `diving` | Trip diving |
| `excursion` | Trip sehari penuh, diving atau snorkeling |
| `transfer` | Antar-jemput perahu antar pulau |
| `camera` | Sewa kamera |
| `motorbike` | Sewa motor di Waisai |
| `car` | Sewa mobil di Waisai |
| `merch` | Merch Eddo |

Kuncinya dipakai di tiga tempat sekaligus: judul di daftar, isian di
`content/site.json`, dan pilihan di dialog tanya-jawab. Jadi menambah atau
melepas satu golongan cuma perlu diubah di `SERVICE_KEYS`, dan yang lain ikut.

### Kartunya mengisi barisnya sendiri

Jumlah kolomnya mengikuti jumlah barangnya, tidak dipatok tiga. Dua barang di
grid tiga kolom menyisakan satu kartu penuh ruang kosong di kanan, dan itu
kelihatan sekali. Aturannya: satu barang dibaringkan, fotonya di kiri dan
keterangannya di sebelahnya; dua jadi dua kolom; empat jadi dua kali dua; sisanya
tiga kolom. Sudah diukur, tiap barisnya menyentuh tepi kanan panel dalam 1 piksel.

Isinya diatur di `content/site.json` pada kunci `eddoServices`, bukan di kode:

```json
"motorbike": [
  {
    "id": "beat",
    "name": "Honda Beat",
    "photo": "/eddo-layanan-beat.webp",
    "price": 100000,
    "unit": "day",
    "specs": [
      { "key": "engine", "value": "110cc, matic" },
      { "key": "seats", "value": "2" }
    ]
  }
]
```

### Nilai yang berbeda antar bahasa

`name` dan `specs[].value` boleh berupa satu teks, atau peta per bahasa:

```json
{ "key": "includes", "value": { "en": "2 helmets, fuel to start", "id": "Helm 2, bensin awal" } }
```

Satu teks berarti sama di semua bahasa, dan itu benar untuk sebagian besar
isinya: "Honda Beat", "110cc", "15 PK", "S, M, L, XL". Peta untuk yang tidak.
Tanpa ini situsnya punya cacat nyata: spek yang ditulis "Katun, sablon satu
warna" muncul apa adanya di halaman berbahasa Inggris, jadi tamu yang membaca
Inggris bertemu bahasa Indonesia tepat di tengah perbandingan harga.

Bahasa yang tidak ditulis diisi dari `en`, bukan dari kunci pertama, supaya
pembaca Perancis tidak mendapat bahasa Jepang atau Indonesia tergantung urutan
mengetiknya.

### Tiga bentuk barang, dan `unit` yang menentukannya

Satu formulir yang bertanya "tanggal berapa" dan "berapa banyak" tidak cocok
untuk ketiganya, dan yang paling salah adalah sewa: pertanyaannya bukan berapa
motor yang disewa, melainkan berapa lama satu motor dipakai.

| `unit` | Yang ditanya | Contohnya |
|---|---|---|
| `piece` | jumlah saja | kaos |
| `day` | tanggal mulai dan tanggal kembali, harinya dihitung sendiri | motor, mobil, kamera |
| lainnya | satu tanggal dan jumlah | trip selam, antar pulau |

Jadi mengubah satu barang dari "berapa banyak" jadi "berapa lama" cukup dengan
menulis `"unit": "day"`. Tidak ada daftar kedua yang menyebut barang mana yang
disewa harian, karena daftar kedua adalah daftar yang lupa diperbarui.

Untuk sewa, hari dihitung sebagai selisih tanggal, sama seperti malam pada
kamar: diambil 10 sampai 14 November berarti 4 hari. Batasnya 30 hari; lebih
dari itu, orang yang menjawab.

### Pulang pergi: `returnPrice`

```json
{ "id": "waisai-yenbuba", "price": 1800000, "returnPrice": 3600000, "unit": "trip" }
```

Ada `returnPrice`, kotaknya menawarkan dua tombol, sekali jalan dan pulang
pergi, lengkap dengan harga masing-masing supaya tidak perlu menekan dulu baru
tahu bedanya. Tidak ada, tidak ada pilihan sama sekali, yang benar untuk semua
yang bukan perjalanan.

Angkanya berdiri sendiri, bukan dua kali harga di atasnya. Perahu yang menunggu
dan mengantar balik bukan penjualan yang sama dengan perahu yang sekadar
menurunkan, dan cuma pemiliknya yang tahu punyanya yang mana.

**Memilih pulang pergi memunculkan kotak tanggal balik**, persis seperti
pencarian tiket pesawat. Polanya diambil dari sana: kotaknya tidak ada untuk
sekali jalan, memilih pulang pergi yang memunculkannya, paling awal tanggal
baliknya adalah hari berangkatnya sendiri, dan kembali ke sekali jalan
menghilangkannya lagi beserta isinya, bukan menyembunyikannya. Tanggal yang
tidak kelihatan adalah tanggal yang tidak disetujui siapa pun, dan itu akan
tetap sampai ke keluarganya sebagai perahu yang harus dikirim.

Satu hal yang **tidak** ditiru: OTA mengisi tanggal otomatis, dan di sini tidak.
Layar pertama OTA adalah pencarian, tebakan yang salah cuma berarti mencari
ulang. Yang ini halaman bayar, dan tanggal yang diisikan halaman adalah tanggal
yang dibayar tanpa pernah dipilih.

Paling awal tanggal baliknya hari yang sama, bukan besoknya, karena penyeberangan
bukan menginap: berangkat pagi lalu balik sore itu hari jalan biasa. Berbeda dari
sewa, yang minimalnya memang satu hari.

Servernya menolak pulang pergi tanpa tanggal balik, atau dengan tanggal balik
sebelum berangkat, bukan cuma browsernya. Pesanan yang tertulis pulang pergi
tapi tidak membawa harinya lebih buruk daripada sekali jalan: sudah dibayar dan
tidak bisa dipenuhi.

> **Angka `returnPrice` yang ada sekarang masih tempelan**, diisi dua kali tarif
> sekali jalan supaya bentuknya bisa dilihat. Ganti dengan tarif yang sebenarnya
> sebelum Midtrans dipindah ke produksi.

### Ukuran dan stok: `sizes`

```json
"sizes": [
  { "label": "S", "stock": 4 },
  { "label": "M", "stock": 2 },
  { "label": "L" },
  { "label": "XL", "stock": 0 }
]
```

Ada `sizes`, ukurannya wajib dipilih sebelum bisa dibayar, dan di bawah barisnya
muncul catatan bahwa ukurannya ukuran bule sehingga pembeli lokal biasanya
turun satu ukuran. Catatan itu ada di tujuh bahasa dan tidak perlu ditulis di
sini.

`stock` tidak diisi dan `"stock": 0` **bukan hal yang sama**, dan halamannya
memperlakukannya berbeda:

- tidak diisi berarti belum dihitung: tidak ada angka yang ditampilkan, ukurannya
  tetap bisa dipilih
- `0` berarti sudah dihitung dan habis: ukurannya tetap tampil, dicoret, tidak
  bisa dipilih
- angka lain tampil sebagai sisa sekian, dan pesanan melebihi sisanya ditolak

Dibedakan karena menyamakannya berarti memilih antara mengarang angka di halaman
tempat orang membayar, atau menyembunyikan ukuran yang sebetulnya ada di lemari.

Stoknya diperiksa di server juga, bukan cuma di browser: salinan yang ada di
browser adalah keadaan waktu halaman dibuka. Yang **belum** ada: tidak ada yang
menahan stok antara memilih dan membayar, jadi dua orang masih bisa membeli kaos
terakhir dalam menit yang sama. Itu butuh tempat mencatat, dan situs ini belum
punya.

> **Angka stok belum ada sama sekali** karena belum ada yang menghitungnya, dan
> mengarang stok di halaman jual bukan hal yang pantas dikarang. Isi `stock` per
> ukuran dan angkanya langsung tampil.

### Email yang datang waktu ada yang membayar

Dulu isinya cuma nomor order, jumlah, cara bayar dan status. Jadi yang sampai ke
keluarganya kira-kira: "LUNAS, TRANSFER-20261104-A1B2C3D4, Rp 3.600.000". Siapa
yang datang, hari apa, ukuran berapa, perahunya harus berlayar sekali atau dua
kali, semuanya ada di dashboard Midtrans, di balik login, di tab lain, pada jam
berapa pun pembayarannya mendarat.

Sebabnya: pemberitahuan dari Midtrans memang cuma membawa itu. Yang dikembalikan
apa adanya cuma `custom_field1` sampai `3`, jadi pesanannya sekarang ditulis ke
situ waktu pembayaran dibuat, dan emailnya membacanya kembali:

```
Pesanan     Waisai to Yenbuba, return, going 2026-11-04, back 2026-11-08
Tamu        Siti Rahma / 6281234567890
Email tamu  siti@contoh.id
```

Baris ini cuma muncul kalau ada isinya, supaya pembayaran lama yang dibuat
sebelum ini ada tetap menghasilkan email yang masuk akal, bukan tiga baris
kosong.

Email ini untuk **keluarganya**, jadi bahasanya Indonesia.

### Email yang diterima tamunya

Midtrans sudah mengirim kuitansi ke pembeli, dan kuitansi itu memang kuitansi:
jumlah, status, nomor pesanan, dari perusahaan yang belum pernah mereka dengar.
Yang tidak ada di situ adalah sepatah kata dari orang yang rumahnya akan mereka
tinggali, dan satu hal yang harus mereka lakukan dengan kuitansi itu: menyimpannya.

Jadi begitu pembayarannya benar-benar masuk, tamunya menerima satu email lagi:
terima kasih, simpan kuitansi Midtrans-nya, tombol WhatsApp kalau ada yang mau
ditanyakan sebelum berangkat, dan ditunggu kedatangannya.

**Bahasanya mengikuti bahasa yang dipakai tamunya waktu membaca situs.** Tujuh
bahasa, jatuh ke Inggris kalau kodenya tidak dikenal. Tamu yang membaca seluruh
halaman dalam bahasa Perancis lalu menerima konfirmasi berbahasa Inggris sudah
diserahkan kembali ke orang asing di langkah terakhir. Bahasanya ikut di
`custom_field2` bersama nama dan nomor, jadi keluarganya juga tahu harus
menjawab dalam bahasa apa.

Teksnya ada di `src/lib/eddo-mail.ts`, terpisah dari `eddo-content.ts` karena
yang ini cuma dibaca server dan tidak perlu ikut diunduh setiap pembaca.

Tiga hal yang dijaga:

- **Cuma waktu lunas.** Transfer bank yang masih menunggu bukan hal yang perlu
  diterimakasihi, dan kartu yang gagal sudah mereka ketahui sendiri.
- **Sekali saja.** Kartu kredit memberi tahu dua kali, `capture` lalu
  `settlement`, dan dua-duanya berarti lunas. Keluarganya boleh dapat dua email;
  tamu yang diterimakasihi dua kali untuk satu pembayaran mulai menghitung ulang
  rekeningnya. Penjaganya ada di memori, jadi hilang kalau server di-restart:
  menutup kejadian yang lazim, bukan semuanya.
- **Balasannya ke keluarga.** `reply_to` diarahkan ke alamat pemilik, bukan ke
  `noreply@`. Tamu yang membalas email konfirmasi sedang bertanya, dan pertanyaan
  yang mendarat di `noreply@` adalah pertanyaan yang tidak didengar siapa pun.

### Ada harganya berarti bisa dibayar

Satu aturan, bukan dua. Dulu ada daftar terpisah yang menyebut golongan mana
saja yang boleh ditagih, jadi trip perahu tidak pernah bisa dibayar walaupun
harganya diisi. Daftar itu dilepas: **harga yang tertulis di kartu adalah harga
yang berlaku**, dan yang tidak berlaku tidak usah ditulis.

Jadi sekarang: ada `price` di atas nol, kunci Midtrans terpasang, dan barangnya
tidak bertanda contoh, maka tombolnya "pesan dan bayar". Tidak ada `price`,
tombolnya "tanya harga" dan yang menjawab orang.

Menekan tombol bayar membuka kotak checkout, bukan langsung ke Midtrans. Di
situ ditanya apa yang perlu ditanya menurut bentuk barangnya, lalu nama,
WhatsApp dan email. Sebelum ini kartunya
mengirim nama **barangnya** sebagai nama pembeli dan nomor WhatsApp
**homestay** sebagai nomor pembeli, jadi keluarganya menerima pembayaran yang
tidak bisa dicocokkan dengan tamu mana pun. Sudah diuji: yang sampai ke
Midtrans sekarang nama dan kontak tamunya.

Harganya sendiri **selalu** dihitung server dari berkas ini. Diuji dengan
permintaan yang menitipkan `price: 1` dan `gross_amount: 1`: yang terkirim
tetap Rp 300.000 untuk dua kaos.

### Halaman ringkasan: `/eddo/checkout`

Menekan **Pesan dan bayar**, baik di panel kamar maupun di kartu layanan,
tidak langsung membuka Midtrans. Pesanannya dibawa ke halaman ringkasan
sendiri, tamunya memeriksa dulu, lalu tombol di situ yang membuka Midtrans.

Sebabnya: Midtrans membuka lembar pembayarannya di atas halaman apa pun yang
sedang tampil, dan yang sedang tampil adalah puncak halaman depan. Jendela
pembayaran melayang di atas foto pantai dengan judul besar di belakangnya.
Jalan, tapi kelihatan seperti kecelakaan.

Pesanannya dititipkan di `sessionStorage`, **bukan di URL**. Di URL, nama,
nomor, dan email tamunya akan tercatat di riwayat peramban, di log server, di
header referrer tautan berikutnya, dan ikut tersalin kalau tautannya dikirim ke
orang lain. Di session storage, datanya tinggal di satu tab yang mengisinya dan
hilang waktu tab-nya ditutup.

Yang dititipkan cuma **apa yang dipilih, tidak pernah harganya**. Halaman
ringkasannya menghitung ulang dari berkas yang sama dengan kartunya, dan
`/api/pay` menghitung ketiga kalinya sebelum menagih. Tiga kali baca satu
angka, tidak ada salinan yang dioper.

Pada domain hidup halamannya menjawab di `/checkout`: `/eddo/checkout` dibelokkan
ke bentuk pendeknya lalu ditulis ulang balik untuk dirender, sama seperti
`/turtle/about`. Halamannya tidak diindeks, karena isinya baru ada setelah
seorang tamu memilih sesuatu di tab-nya sendiri.

Sesudah dibayar, halamannya menunjukkan keadaan lunas dan draft-nya dihapus,
jadi kembali ke alamat itu tidak menawarkan membayar untuk kedua kalinya.

### Nama, WhatsApp, dan email: tiga kotak, ketiganya wajib

**Jangan pernah menggabungnya jadi "WhatsApp atau email".** Kotak yang menerima
salah satu memberi keluarganya salah satu secara acak, padahal nomornya dipakai
menjawab dan emailnya dipakai memetakan pesanannya nanti. Dulu memang begitu,
dan sekarang tidak lagi, di kotak checkout maupun di panel kamar.

Ketiganya wajib. Yang kosong ditandai garis merah pada kotaknya sendiri dengan
tulisan "Wajib diisi" di bawahnya, jadi yang kurang itu jelas yang mana, bukan
satu kalimat di bawah tombol yang bilang ada yang kurang. Tandanya hilang
begitu kotaknya diisi.

`/api/pay` juga menolak dengan 422 kalau salah satu dari ketiganya kosong. Itu
yang membuat aturannya berlaku untuk pesanannya, bukan cuma untuk formulirnya.

Formulir **tanya-jawab** beda: di situ WhatsApp dan email sudah terpisah, tapi
cukup salah satu, karena bertanya bukan membayar dan tidak ada yang dipetakan.

### Kamar: bayar itu pesan

Tamu memilih **tanggal check-in dan tanggal check-out**, lalu malamnya
dihitung sendiri dan tampil di bawah kotaknya. Daftar "berapa malam" sudah
tidak ada: orang memesan dengan menyebut kapan datang dan kapan pulang, bukan
dengan menghitung sendiri.

Selisih harinya dihitung dalam UTC, bukan waktu lokal. Menginap yang melewati
jam pergantian waktu musim panas kurang 23 jam dari kelipatan hari kalau
dihitung lokal, jadi tamu yang memilih dua tanggal berjarak seminggu ditagih
enam malam tanpa ada yang sadar. Sudah diuji di Europe/London melewati 29 Maret
2026: tetap 7 malam.

Sebelum kedua tanggalnya dipilih, totalnya memakai 1 malam supaya sama dengan
angka besar di atasnya. Begitu juga kalau tanggalnya tidak masuk akal, dan itu
penting: check-out 68 malam sesudah check-in sempat memasang **Total
Rp 91.800.000** tepat di atas tombol bayar, padahal `/api/pay` memotong apa pun
di atas 30 malam jadi 30. Memasang harga yang tidak mungkin ditagih lebih buruk
daripada tidak memasang harga sama sekali, jadi sekarang pasangan tanggal yang
di luar 1–30 malam dihitung nol dan totalnya kembali ke satu malam, sambil
kotak check-out-nya ditandai merah.


Tombol kamar langsung ke Midtrans, dan kalimat "tanggalnya kami cek di kalender
lalu kami kabari" sudah dilepas atas permintaan pemiliknya. Yang perlu
disadari: **tidak ada satu pun kode di sini yang menahan kamar**. Membayar
mengirim uang dan pesan, tidak menandai kalender, jadi dua orang bisa membayar
untuk minggu yang sama dan keduanya berhasil. Kalendernya tetap harus dilihat
manual di dashboard.

### Menandai isian contoh

`"example": true` pada sebuah barang berarti barang itu tidak bisa dibayar,
apa pun harganya. Kartunya tetap tampil utuh; tombolnya cuma berubah jadi
bertanya.

Per 19 September 2026 tandanya sudah dilepas dari ketiga belas barang yang ada
harganya, atas permintaan pemiliknya, dengan alasan Midtrans-nya masih sandbox
jadi tidak ada uang sungguhan yang berpindah. **Angka-angka itu masih angka
contoh yang dikarang, bukan angka yang pernah dipastikan pemiliknya.** Sebelum
Midtrans dipindah ke produksi, ketiga belasnya wajib dicocokkan satu per satu.

Cara memastikan Midtrans-nya masih sandbox: buka `/api/health` sambil login
dashboard. Ada baris `midtrans.mode` di atas yang menyebut `sandbox` atau
`produksi`, dibaca dari fungsi yang sama dengan yang dipakai jalur
pembayarannya, jadi tidak bisa berbeda dengannya. Jangan menebak dari awalan
kuncinya: dashboard Sandbox pun mengeluarkan kunci bernama `Mid-…` tanpa
awalan `SB-`.

Pasang lagi tandanya kalau ada harga yang belum pasti. Hapus barisnya kalau
sudah.

## Gambar garis di sebelah judul seksi

Empat gambar, satu warna, tanpa isian, di `src/components/eddo/section-art.tsx`.
Bukan berkas foto, jadi tidak ada yang perlu diunggah dan tidak ada yang perlu
diganti nanti: ini hiasan, bukan tempat kosong yang menunggu foto.

| Seksi | Gambarnya |
| --- | --- |
| Kamar | rumah panggung, pohon kelapa, tangga turun ke air |
| Sekitar kami | pulau berpohon, burung di atasnya, ikan di bawah |
| Layanan | perahu panjang bermesin dengan buih di belakangnya |
| Tanya | penyu |

Semuanya kotak 300x96 dengan garis air di ketinggian yang kira-kira sama, biar
keempatnya terbaca satu set walau letaknya berjauhan. Warnanya `text-eddo-deep`
di opasitas 35 persen supaya judulnya tetap yang pertama dibaca.

Geraknya dua macam. Pertama garisnya ditarik satu per satu waktu seksinya
sampai di layar; itu jalan sekali. Sesudah itu airnya bergeser, perahunya
bergoyang, ikannya lewat, gelembungnya naik, terus selama halamannya dibuka.
Semuanya `transform` saja, jadi tidak ada satu frame pun yang memicu layout,
dan seluruhnya berhenti kalau peramban bilang pembacanya minta gerak
dikurangi. Gambarnya tetap utuh, cuma diam. Aturannya di `globals.css`, bagian
"eddo section drawings".

Seluruhnya 1,5 KB sesudah gzip dari total 1,3 MB halaman itu.

Mau melepas salah satunya: hapus satu baris `<HouseArt …>` dan kawan-kawannya
di `site.tsx`. Tidak ada yang lain yang bergantung padanya.

## Ikon situs: favicon, tab, dan layar utama

Berkasnya di `src/app/`, bukan di `public/`, karena Next menautkannya sendiri
ke halaman lewat nama berkasnya. Tidak ada kode yang menyebut nama-nama ini.

| Berkas | Dipakai di | Ukuran |
|---|---|---|
| `src/app/favicon.ico` | permintaan buta ke akar domain, penanda buku | 16 dan 32 di satu berkas, 2,5 KB |
| `src/app/icon.png` | tab peramban, semua halaman kecuali yang menimpa | 32x32, 1,5 KB |
| `src/app/apple-icon.png` | pintasan layar utama iOS | 180x180, 10,4 KB |
| `src/app/eddo/icon.png` dan `apple-icon.png` | halaman Eddo | sama dengan akar |
| `src/app/turtle/icon.png` dan `apple-icon.png` | halaman Turtle | 1,8 dan 15,6 KB |

**Ikon akar memakai mark Eddo, dan itu sengaja.** Satu-satunya domain yang hidup
adalah eddohomestay.com, dan di sana `/` ditulis ulang ke `/eddo`, jadi peramban
yang meminta favicon ke akar sedang memintanya atas nama Eddo. Turtle menimpanya
di jalurnya sendiri, dan itu tempat Turtle dibaca.

Kalau nanti turtlehomestay.com hidup, `/favicon.ico` di domain itu masih akan
mengembalikan mark Eddo. Tab-nya sendiri tetap benar karena halamannya
menautkan ikonnya sendiri; yang salah cuma permintaan buta ke akar. Perbaikannya
satu route handler yang membaca header Host, dan belum dibuat karena belum ada
yang membacanya.

### Kenapa marknya diputihkan di atas ubin toska

Master Eddo itu garis toska tipis di atas transparan, 2000 piksel dan 389 KB.
Dikecilkan ke 16, goresannya jatuh di bawah satu piksel dan seluruh gambarnya
jadi noda samar yang hilang di bar tab terang.

Tiga perlakuan digambar lalu dilihat pada 16, 32, dan 64: di atas putih hilang,
transparan hilang, putih-di-atas-toska bertahan. Yang bertahan di ukuran itu
memang bloknya, bukan gambar di dalamnya. Mengisi 88 persen ubin, bukan 74,
menambah satu piksel ketebalan goresan.

Di 16 wajahnya tetap hilang, dan itu memang yang terjadi pada gambar garis di
ukuran 16. Yang tersisa ubin toska pekat, dan itu sudah cukup untuk menemukan
tab. Di 32, yang justru diambil layar berkerapatan tinggi, wajahnya terbaca.

### Dua jebakan yang sudah ditemui

**Trik pemutihan itu salah untuk logo Turtle.** Mark Eddo garis di atas
transparan, jadi saluran alfanya adalah gambarnya sendiri dan mengecat ulang
warnanya tidak merusak apa pun. Logo Turtle ilustrasi berwarna penuh yang
alfanya cuma lingkaran luarnya, jadi operasi yang sama mengecat seluruh
piringannya putih dan menghasilkan koin kosong. Logo Turtle cuma dikecilkan,
tidak diapa-apakan.

**PNG di dalam ICO harus RGBA.** Palet terindeks menghemat sekitar satu kilobait
dan membuat build berhenti dengan "The PNG is not in RGBA format", karena Next
membongkar berkas itu saat build untuk membaca ukurannya. Yang di dalam ICO
tidak diindeks; yang berdiri sendiri diindeks.

### Membuat ulang

Skripnya tidak disimpan di repo karena sekali pakai, sama seperti pembuat
`eddo-logo`. Resepnya: pangkas transparan di tepi master, cat ulang seluruh
piksel jadi putih sambil menyimpan alfanya, tempel di tengah ubin `#06777d`
dengan mengisi 88 persen, render di empat kali ukuran sasaran lalu kecilkan
(antialias yang menahan gambarnya di ukuran itu), simpan PNG. ICO-nya wadah
dengan header enam bait plus enam belas bait per gambar, isinya PNG utuh.

