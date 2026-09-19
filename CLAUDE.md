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

| Tetap jalan walau diminta tenang | Berhenti |
|---|---|
| gambar garis kecil di dalam kotak seukuran kartu pos | hero yang ikut menggulung |
| gerak beberapa piksel yang tidak melintasi layar | bagian yang meluncur naik saat tiba |
| | adegan selebar halaman |

Yang berhenti adalah yang melintasi layar, mengikuti scroll, atau datang tanpa
diminta. Itu yang dimaksud setelannya.

**Jangan pernah** membuat `prefers-reduced-motion` berakhir pada konten yang
tidak kelihatan. Kalau sebuah elemen disembunyikan sampai animasinya berjalan,
animasi yang dimatikan berarti elemen yang hilang selamanya.

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
