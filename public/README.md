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

## Situs Eddo Homestay (`/eddo`)

Situs kedua, untuk properti kedua. **Logo dan foto hero-nya sudah ada; foto
yang lain belum.** Halamannya tetap lengkap tanpa yang belum ada, karena setiap
foto punya ilustrasi SVG di bawahnya yang tampil selama berkasnya kosong.
Begitu berkasnya ditaruh, fotonya yang tampil, tanpa mengubah kode.

| Berkas | Dipakai di | Rasio |
|---|---|---|
| `website_logo_eddo_homestay.png` | **tidak dipakai**, disimpan sebagai master | aslinya dari pemilik: 2000×2000, latar transparan, 388 KB |
| `eddo-logo.png` | **tidak dipakai lagi**, disimpan sebagai master siap pakai | 164×240, 45 KB. Dibuat dari master di atas |
| `Eddo_Homestay_1.png` | **tidak dipakai**, disimpan sebagai master | aslinya dari pemilik: 4,0 MB |
| `eddo-hero.jpg` | latar hero di layar ≥1024px | 2:1, 1760×880, 218 KB. Dibuat dari master di atas. **Berkas ini juga menentukan bentuk hero** — lihat di bawah |
| `eddo-hero-900.jpg` | pita foto hero di layar <1024px | 2:1, 900×450, 65 KB. Isi yang sama, dikecilkan |
| `eddo-bawah.jpg` | kartu kamar Eddo Bawah | 16:10 |
| `eddo-atas.jpg` | kartu kamar Eddo Atas | 16:10 |
| `eddo-around-1.jpg` | kartu "Dermaga Sawinggrai" | 3:4 (tegak) |
| `eddo-around-2.jpg` | kartu "Burung cendrawasih" | 3:4 |
| `eddo-around-3.jpg` | kartu "Arborek" | 3:4 |
| `eddo-around-4.jpg` | kartu "Piaynemo" | 3:4 |
| `eddo-cta.jpg` | kartu ajakan di bagian "Kenapa Eddo" | mendatar, akan ditutup lapisan toska gelap |

Aturannya sama seperti situs Turtle: huruf kecil semua, lebar 1080 sampai
1920px, usahakan di bawah 300 KB per foto.

**Lencana tikinya sekarang tidak dipakai di halaman.** Nama situsnya ditulis
sebagai huruf saja, di bar maupun di footer: tiga hal dalam bar setinggi 46px
(lencana, nama, baris kampung) membuat lencananya berebut tinggi dan baris
kampungnya mengecil sampai terbaca sebagai tekstur, bukan sebagai kata. Kedua
berkasnya tetap disimpan sebagai master, dan catatan di bawah ini tetap berlaku
kalau suatu saat lencananya dipasang lagi.

`eddo-logo.png` dibuat dari masternya, bukan digambar ulang. Masternya kanvas
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

### Foto hero: `eddo-hero.jpg` dan `eddo-hero-900.jpg`

Dua berkas dari satu master, dan **keduanya perlu diganti bersamaan** kalau
fotonya diganti. Masternya `Eddo_Homestay_1.png` (4,0 MB) disimpan apa adanya.

**Bentuk hero ditentukan oleh ada-tidaknya `eddo-hero.jpg`**, dicek di disk
sewaktu build (`src/app/eddo/page.tsx`), bukan di browser. Kalau dicek di
browser, pembacanya akan melihat halamannya berubah bentuk setelah tampil.
Tanpa berkas itu, hero jadi blok warna pucat polos. Dengan berkas itu:

- **≥1024px** fotonya **memenuhi seluruh hero**, dari puncak sampai dasar,
  termasuk di belakang bar. Tidak ada penutup putih di mana pun. Tulisannya
  putih di atas foto.
- **<1024px** fotonya keluar dari hero dan turun jadi pita sendiri di bawah
  tulisan, tinggi 240px (320px dari 640px ke atas).

Pembagian itu bukan dua desain untuk gaya-gayaan. Di layar 390px tidak ada ruang
untuk menaruh tulisan di samping foto, dan menutup fotonya sampai tulisannya
terbaca menyisakan foto yang tidak kelihatan, di HP, tempat sebagian besar tamu
membukanya. Turun ke bawah tulisan, fotonya tidak perlu ditutup sama sekali.

**Kenapa harus ada sesuatu di antara tulisan dan foto.** Diukur tanpa penutup
apa pun, latar di belakang **satu baris yang sama** berkisar dari luminansi
**0,003 sampai 0,837**: langit dan pasirnya di satu ujung, palem dan pulaunya di
ujung lain. Tidak ada satu warna huruf yang selamat dari rentang itu. Tinta
gelap perlu latar lebih terang dari 0,31; putih perlu latar lebih gelap dari
0,18; dan foto ini dua-duanya, di dalam satu baris.

Halo saja juga sudah dicoba dan diukur: **1,3 sampai 1,9:1 bahkan di tepi
huruf**, karena bayangan yang cukup lebar untuk berarti jadi terlalu tipis untuk
menggelapkan apa pun.

**Jadi yang dipilih arahnya, bukan ada-tidaknya.** Gelap sudah dicoba dan
memang berhasil, tapi ia mengubah pagi jadi sore, dan yang dijual homestay ini
bukan sore. Dua gradien di sini arahnya **terang**: kabut tipis di atas air,
bukan senja di atasnya.

| | Untuk | Kekuatan |
|---|---|---|
| `[data-hero-lift]` | tulisan hero | 0,72 di kiri, penuh sampai 52%, habis di 76% lebar |
| `[data-hero-lift-top]` | bar | 132px, 0,80 di puncak |

Titik 52% itu batas tulisannya, bukan angka bulat: di 1024px baris terpanjang
berakhir di 50% lebar jendela, jadi kabutnya dipertahankan penuh sampai lewat
situ lalu dijatuhkan cepat supaya warna fotonya kembali sesegera mungkin.

**Angkanya bukan selera.** Tinta perlu latarnya 0,308 atau lebih terang, dan
piksel paling gelap di belakang tulisannya ada di 0,003. Mengangkat piksel itu
saja sampai 0,308 butuh putih 0,56. Semua titik di atas adalah lantai itu
ditambah margin yang ditunjukkan pengukuran di bagian tepinya. Lebih tipis dari
ini, paragrafnya mulai tidak lolos; itu sebabnya angkanya tidak lebih kecil.

Titiknya persen, dan di sini persen aman padahal untuk panel putih dulu tidak:
diukur dari 1024 sampai 2560 di dua bahasa, baris terpanjang hero selalu
berakhir di antara 46% dan 50% lebar jendela, jadi satu titik di 50% mengikuti
tulisannya di lebar berapa pun.

Gradien bar dibuat terpisah karena bar membentang selebar layar, jadi tidak
mungkin tertutup gradien sisi.

**Dua warna huruf digelapkan supaya putihnya bisa tetap tipis**, bukan
sebaliknya. Baris skripnya (`by the water`) jadi `eddo-dark`, sebelumnya
`eddo-deep` dan terukur 2,53:1 dari 3 yang dibutuhkan. Paragraf hero-nya jadi
`eddo-ink`, sebelumnya `ink-soft` dan terukur 4,21:1 dari 4,5. Menambah putih
untuk keduanya akan memucatkan fotonya lebih jauh dari yang perlu.

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
