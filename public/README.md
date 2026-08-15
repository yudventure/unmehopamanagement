# public/

Berkas di folder ini disajikan apa adanya di root situs — `public/hero.jpg`
menjadi `https…/hero.jpg`.

## `hero.jpg` — foto besar di website `/turtle`

Taruh fotonya persis di `public/hero.jpg`. Tidak perlu mengubah kode apa pun;
begitu berkasnya ada, foto itu langsung menggantikan ilustrasi di hero.

- **Rasio** melebar (landscape). Bagian tengah gambar yang paling aman —
  atas dan bawah terpotong tergantung tinggi layar.
- **Lebar** minimal 1920px. Lebih dari 2560px tidak menambah apa-apa.
- **Ukuran berkas** usahakan di bawah 400 KB. Ini gambar pertama yang dimuat
  dan sebagian tamu membukanya dari sinyal pulau.
- **Nama** harus `hero.jpg`. Kalau fotonya PNG, ubah `HERO_PHOTO` di
  `src/components/web/site.tsx`.

Selama berkasnya belum ada, hero jatuh ke ilustrasi SVG — bukan ke gambar
rusak. Jadi aman kalau di-deploy sebelum fotonya siap.
