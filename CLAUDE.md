@AGENTS.md

# Aturan proyek ini

## Windows dan Mac tidak sama, dan Windows yang lebih sering dilupakan

Pekerjaan visual belum selesai sebelum diperiksa di kedua-duanya. Yang
mengembangkan ini memakai Mac, jadi keadaan Mac yang terlihat terus dan keadaan
Windows yang diam-diam rusak berminggu-minggu.

### Animasi: jangan pernah digantungkan seluruhnya pada `prefers-reduced-motion`

Ini sudah pernah terjadi di sini dan memakan waktu lama untuk ketahuan.

`prefers-reduced-motion: reduce` **bukan sinyal yang sama di kedua sistem**:

- **macOS** melaporkannya dari Accessibility → Display → **Reduce motion**, yang
  mati kecuali ada yang sengaja menyalakannya.
- **Windows** melaporkannya dari Accessibility → Visual effects → **Animation
  effects**, yang **mati** pada mesin mana pun yang disetel "adjust for best
  performance", dan pada banyak laptop sejak keluar dari toko.

Web memberi keduanya satu nama. Jadi kode yang mematikan semua gerak begitu
sinyal itu muncul tidak sedang melayani orang yang mabuk gerakan, melainkan
mematikan situs pada sebagian besar mesin Windows.

**Aturannya: putuskan per animasi, bukan sekaligus.**

Keputusan yang berlaku sekarang, 20 September 2026, sesudah pemiliknya tiga
kali melaporkan situsnya mati di mesinnya sendiri:

| Tetap jalan walau diminta tenang | Berhenti |
|---|---|
| gambar garis kecil di dalam kotak seukuran kartu pos | benda yang menyeberangi kartunya sendiri lalu keluar: manta di kartu musim tenang, hujan di kartu campuran, tiga embusan angin di kartu berangin (`[data-cross]`) |
| gerak beberapa piksel yang tidak melintasi layar | |
| hero yang tumbuh 8% mengikuti scroll pembacanya sendiri | |
| seksi yang mendarat saat tiba | |

Jadi di situs ini `prefers-reduced-motion` tinggal mengerjakan satu hal, dan
itu disengaja. Yang berhenti adalah yang bergerak **tanpa diminta dan tidak
bisa dihindari dengan memalingkan mata**. Hero dan seksi yang mendarat tidak
begitu: keduanya digerakkan oleh scroll pembacanya sendiri, berhenti begitu
tangannya berhenti.

**Harganya, disebut terang-terangan.** Pembaca Mac yang sengaja menyalakan
Reduce motion tetap mendapat hero dan reveal-nya. Itu pembebanan yang nyata,
dan itu keputusan pemiliknya atas situsnya sendiri; pilihan lainnya adalah
halaman diam untuk sebagian besar tamu Windows-nya. Kalau suatu saat ditinjau
ulang, jawabannya **bukan** mengembalikan aturan-aturan itu ke stylesheet,
melainkan memberi halamannya saklar sendiri — yang artinya sama di mesin mana
pun.

**Jangan pernah** membuat `prefers-reduced-motion` berakhir pada konten yang
tidak kelihatan. Kalau sebuah elemen disembunyikan sampai animasinya berjalan,
animasi yang dimatikan berarti elemen yang hilang selamanya.

**Ini sudah kambuh sekali, dan begini bentuk kambuhnya.** Aturannya dipatuhi
di satu tempat lalu dilanggar di tempat lain, dengan satu penanda yang
kelihatan tidak berbahaya. Di situs Turtle ada
`@media (prefers-reduced-motion: reduce) { [data-sea], [data-move] { animation: none } }`
— dua penanda, dan kebetulan keduanya memuat **seluruh** gerak menerus di
halaman itu: air di balik kartu musim, perahu di gambar langkah perjalanan,
garis putus-putus di peta sketsa. Jadi satu aturan itu tidak menenangkan satu
adegan selebar halaman; ia membuat halaman Turtle benar-benar diam di setiap
mesin Windows yang disetel "adjust for best performance". Pemiliknya
melaporkannya sebagai "animasinya mati lagi".

Yang benar: penandanya per animasi, bukan per komponen. Sekarang yang berhenti
cuma `[data-cross]` — manta di kartu tenang, hujan di kartu campuran, tiga
embusan angin di kartu berangin: benda yang betul-betul menyeberangi kartunya
dan keluar. Sisanya jalan terus.

Kalau menulis `prefers-reduced-motion` di stylesheet, hitung dulu: apa saja
yang berhenti karena baris itu, dan apakah masih ada yang bergerak sesudahnya.
Kalau jawabannya "tidak ada", baris itu salah.

### Membuktikannya, bukan menduganya

Playwright melaporkan diri persis seperti mesin Windows yang mematikan efek
animasi:

```js
await browser.newContext({ reducedMotion: "reduce" });
```

Jalankan itu sebelum mengatakan sebuah animasi bekerja. Contoh yang sudah ada:
`gerak2.mjs` di scratchpad memeriksa keduanya sekaligus, bahwa tidak ada yang
tersembunyi, bahwa gambarnya tetap bergerak, dan bahwa hero-nya tetap diam.

Hal lain yang berbeda antar sistem dan pantas dilihat dua kali: lebar dan
perilaku scrollbar, penampilan `<input type="date">` dan `<select>`, serta
pembulatan font.

## Nama tempat, harga, dan stok tidak boleh dikarang

Situs ini dibaca tamu yang lalu naik perahu atau membayar. Jadi nama pulau,
nama kampung, harga, kapasitas, dan ketersediaan barang adalah fakta yang bisa
diperiksa, bukan isian sementara yang kedengarannya masuk akal.

Yang belum diketahui ditulis sebagai belum diketahui, dengan tempatnya
disiapkan supaya pemilik tinggal mengisi. Halaman yang jujur mengatakan
"belum kami tulis, tanyakan saja" lebih berguna daripada halaman yang
meyakinkan dan salah.

Kalau ada daftar resminya, biarkan build yang menjaga: cocokkan ke sumber itu
dan hentikan build kalau tidak cocok. Waktu peta Selat Dampier dibuat, aturan
itu langsung menangkap satu kekeliruan — pulau kecil di timur laut Gam yang
disangka Friwen ternyata Pulau Kurai. Tanpa pemeriksaan itu nama yang salah
sudah tayang dan terbaca seolah-olah resmi.

Cara mendapat data wilayah Indonesia yang benar, sumbernya, dan jebakan di
tiap berkasnya ada di `.claude/skills/peta-wilayah-indonesia/`.

## Dua peta, satu generator

`npm run peta` membangun keduanya dari sumber yang sama dalam sekali jalan:

- **`src/lib/perjalanan.ts`** dipakai di halaman Eddo, bagian "Cara ke sini",
  lewat `src/components/eddo/journey-map.tsx`. Bingkainya memuat Sorong,
  Waisai, dan rumahnya.
- **`src/lib/dampier.ts`** untuk peta Selat Dampier yang bisa diklik,
  komponennya `src/components/eddo/dampier-map.tsx`. Sudah jadi tapi sengaja
  tidak dipasang; pemiliknya menyimpannya dulu, bisa jadi dipakai di sini, di
  Turtle, atau di situs lain. Jangan dihapus karena terlihat tidak terpakai.
  Cara memasangnya kembali ditulis di tempat seksinya dulu berada, di
  `site.tsx`.

Salinannya ada di `eddo-content.ts` untuk tujuh bahasa (`journey` dan `map`),
dan animasinya di `globals.css`.

Titik Eddo Homestay ada di `EDDO_LOCATION` di `eddo-content.ts`, dari pemilik
sendiri. Kode plusnya dihitung dari titik itu, bukan diketik.

## Pekerjaan selesai berarti sudah di `main`, bukan menunggu di pull request

Pemiliknya memutuskan ini pada 20 September 2026: perubahan situs digabung
sendiri begitu selesai, supaya yang tayang selalu yang terbaru. `main` adalah
yang tayang — `build.yml` berjalan pada tiap push ke sana, membangun,
memublikasikan ke branch `deploy`, lalu menunggu sampai `/version.json`
menyebut commit itu. Jadi pull request yang menganggur sama dengan situs yang
tertinggal.

Alurnya tetap lewat pull request, dan itu bukan formalitas: PR-nya yang
menyimpan alasan sebuah perubahan, dan judul commit gabungannya yang muncul di
riwayat. Yang hilang cuma jedanya.

1. Kerjakan di branch, push.
2. Buka PR dengan penjelasan yang utuh.
3. **Validasi dulu, sebelum menggabung** — bukan sesudah: `npx tsc --noEmit`,
   `npm run build`, dan skrip browser yang menyangkut bagian yang disentuh
   (alur pesan-bayar, ketujuh bahasa, `reducedMotion` sesuai aturan gerak di
   atas, lebar 390 px).
4. Gabung. Lalu periksa `build.yml` di `main` sampai hijau; merah di sana
   berarti situsnya sedang rusak, dan itu pekerjaan sekarang, bukan besok.

**Yang tetap ditanyakan dulu, walau aturannya "gabung saja".** Menggabung
berarti menayangkan, dan sebagian hal tidak bisa ditarik kembali dengan
menekan undo:

- angka yang menagih uang sungguhan — harga, tarif, kunci Midtrans;
- apa pun yang menyentuh data klien di hosting mereka, atau memindahkan
  domain;
- menghapus konten yang belum tentu tidak dipakai (lihat peta Selat Dampier
  di atas).

Untuk yang seperti itu: siapkan perubahannya lengkap, PR-nya dibuka, lalu
katakan apa yang akan berubah begitu digabung — dan tunggu jawabannya.
