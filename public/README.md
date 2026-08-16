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
