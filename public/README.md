# public/

Berkas di folder ini disajikan apa adanya di root situs — `public/hero.jpg`
menjadi `https…/hero.jpg`.

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
