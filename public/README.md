# public/

Berkas di folder ini disajikan apa adanya di root situs — `public/hero.png`
menjadi `https…/hero.png`.

## `hero.png` — foto besar di website `/turtle`

Untuk mengganti fotonya, **timpa berkas ini** dengan nama yang sama. Tidak ada
kode yang perlu diubah.

- **Rasio** melebar (landscape). Bagian tengah gambar yang paling aman —
  atas dan bawah terpotong tergantung tinggi layar.
- **Lebar** minimal 1920px. Lebih dari 2560px tidak menambah apa-apa.
- **Ukuran berkas** usahakan di bawah 400 KB. Ini gambar pertama yang dimuat
  dan sebagian tamu membukanya dari sinyal pulau. Berkas sekarang **822 KB**
  karena PNG; menyimpannya ulang sebagai JPEG kualitas 80 biasanya turun ke
  sekitar 250 KB tanpa beda yang terlihat. Kalau diganti ke `.jpg`, ubah juga
  `HERO_PHOTO` di `src/components/web/site.tsx`.

Kalau berkasnya hilang, hero jatuh ke ilustrasi SVG — bukan ke gambar rusak.

## `logo.png` — lencana Turtle Dive Homestay

Dipakai di header dan footer website, dan disalin ke
`src/app/turtle/icon.png` sebagai ikon tab browser. **Kalau logonya diganti,
ganti kedua berkas itu.**

Latarnya putih pekat (bukan transparan), jadi di kode ia dipotong jadi
lingkaran supaya sudut putihnya tidak terlihat di atas header gelap. Tinta
lencana ini paling jauh 134px dari pusat kanvas 300px — masih di dalam
lingkaran potong 150px, jadi tidak ada bagian logo yang terpotong. **Logo
pengganti perlu proporsi serupa**: lencana bulat di tengah kanvas persegi.
Logo mendatar (wordmark memanjang) akan terpotong.

Logo ini hanya dipakai di website. Dashboard `/` memakai lencana Unmehopa
(`src/components/brand-logo.tsx`) — dua merek berbeda, sengaja dipisah.
