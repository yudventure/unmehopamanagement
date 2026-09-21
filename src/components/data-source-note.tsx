"use client";

/**
 * Mengatakan dari mana angka di layar ini berasal.
 *
 * Dashboard ini tumbuh dari prototipe, dan sampai sekarang isinya booking
 * Agustus 2026 yang dibangkitkan pembangkit acak: nama tamu yang tidak pernah
 * ada, di kamar yang nyata, dengan nominal yang ikut terhitung di okupansi dan
 * pendapatan. Selama tidak ada yang mengatakannya, layar itu meyakinkan dan
 * salah — persis bentuk yang aturan proyek ini larang.
 *
 * Jadi tiap keadaan punya kalimatnya sendiri, dan tidak ada keadaan yang diam.
 * Yang paling penting justru yang paling sepi: waktu datanya memang sungguhan,
 * catatan ini tetap muncul, karena perubahan yang dibuat di layar belum
 * tersimpan ke mana pun. Tanpa itu, pemiliknya akan menekan "Tandai Check-in"
 * pada booking sungguhan dan percaya ada yang mencatatnya.
 */

export type SumberData =
  | { keadaan: "memuat" }
  /** Terbaca dari database. `terlewat` = baris yang enum-nya belum dikenal. */
  | { keadaan: "database"; terlewat: number }
  /** Database tersambung, tapi belum ada satu kamar pun di sana. */
  | { keadaan: "kosong" }
  /** `DATABASE_URL` belum diisi di server. Layar memakai data contoh. */
  | { keadaan: "contoh" }
  | { keadaan: "gagal"; pesan: string };

const KOTAK =
  "mb-4 rounded-[14px] border px-4 py-[12px] text-[12.5px] leading-[1.55]";

/**
 * `lamaTersambung` menandai bahwa Turtle di layar ini datang dari sistem lama.
 *
 * Perlu, karena tanpa itu catatan "contoh" berbohong. Kalimatnya berbunyi
 * "tidak satu pun berasal dari booking sungguhan", dan begitu sistem lamanya
 * tersambung, seluruh Turtle di layar itu justru booking sungguhan — tamu
 * sungguhan, di kamar sungguhan, dengan tanggal yang dipakai menjemput orang.
 * Catatan yang ada untuk mencegah data karangan dibaca sebagai kenyataan tidak
 * boleh jadi yang menyatakan kenyataan sebagai karangan.
 */
export function DataSourceNote({
  sumber,
  lamaTersambung = false,
}: {
  sumber: SumberData;
  lamaTersambung?: boolean;
}) {
  const catatanLama = lamaTersambung ? (
    <>
      {" "}
      <strong className="font-semibold">Kecuali Turtle Homestay:</strong> kamar
      dan bookingnya dibaca dari sistem lama dan sungguhan.
    </>
  ) : null;

  if (sumber.keadaan === "memuat") {
    return (
      <div className={`${KOTAK} border-line-strong bg-surface-mute text-slate`}>
        Memuat dari database…
      </div>
    );
  }

  if (sumber.keadaan === "contoh") {
    return (
      <div
        className={`${KOTAK} border-amber-soft bg-amber-soft/40 text-amber-ink`}
      >
        <strong className="font-semibold">
          Ini data contoh, bukan buku Anda.
        </strong>{" "}
        Nama tamu, tanggal, okupansi, dan pendapatan di layar ini dibangkitkan
        untuk mengisi tampilan — tidak satu pun berasal dari booking sungguhan.
        Server belum diberi alamat database (<code>DATABASE_URL</code>).
        {catatanLama}
      </div>
    );
  }

  if (sumber.keadaan === "kosong") {
    return (
      <div
        className={`${KOTAK} border-amber-soft bg-amber-soft/40 text-amber-ink`}
      >
        <strong className="font-semibold">
          Database tersambung, tapi masih kosong.
        </strong>{" "}
        Belum ada kamar di sana, jadi tidak ada yang bisa digambar. Jalankan
        workflow <em>Isi data awal</em> di GitHub Actions untuk menuliskan
        properti dan kamarnya.
      </div>
    );
  }

  if (sumber.keadaan === "gagal") {
    return (
      <div
        className={`${KOTAK} border-danger-line bg-danger-tint text-danger-ink`}
      >
        <strong className="font-semibold">Gagal membaca database.</strong>{" "}
        {sumber.pesan} Yang tampil di bawah ini data contoh, bukan buku Anda —
        jangan dipakai untuk mengambil keputusan.
        {catatanLama}
      </div>
    );
  }

  return (
    <div className={`${KOTAK} border-line-strong bg-surface-mute text-slate`}>
      <strong className="font-semibold text-ink-soft">
        Dibaca dari database.
      </strong>{" "}
      Booking dan kamar di layar ini sungguhan.{" "}
      <strong className="font-semibold text-ink-soft">
        Perubahan belum tersimpan:
      </strong>{" "}
      menandai check-in, membatalkan, atau menambah booking baru hanya berlaku
      di layar ini sampai halamannya dimuat ulang.
      {sumber.terlewat > 0 && (
        /* Baris dengan enum yang belum dikenal sengaja tidak digambar — kamar
           yang terlihat kosong padahal terjual adalah kesalahan terburuk yang
           bisa dibuat kalender ini. Tapi menghilangkannya diam-diam sama
           buruknya, jadi jumlahnya disebut. */
        <>
          {" "}
          <span className="text-danger-ink">
            {sumber.terlewat} booking tidak digambar karena saluran atau
            statusnya belum dikenal layar ini.
          </span>
        </>
      )}
    </div>
  );
}
