/**
 * Lambang untuk nav dan untuk saluran.
 *
 * ## Kenapa digambar di sini, bukan diambil dari paket ikon
 *
 * Enam ikon dan enam lambang tidak sebanding dengan satu dependensi baru yang
 * ikut ke setiap halaman, dan paket ikon apa pun akan membawa ribuan yang
 * tidak dipakai. Digambar sendiri, ketebalan garisnya juga bisa dibuat sama
 * persis dengan berat huruf di sebelahnya, yang justru bagian yang paling
 * terlihat kalau meleset.
 *
 * ## Tidak ada yang berulang, dan itu syaratnya
 *
 * Dua tombol dengan ikon yang sama membuat ikonnya jadi hiasan: mata berhenti
 * memakainya untuk membedakan dan kembali membaca teksnya, yang berarti
 * ikonnya cuma menambah lebar. Jadi keenamnya memang enam bentuk berbeda,
 * bukan enam varian dari bentuk yang sama.
 *
 * ## Saluran: lambang huruf, bukan logo resmi
 *
 * Booking.com, Traveloka, dan Agoda punya logo, dan logo itu berkas milik
 * mereka. Menggambar ulang dari ingatan menghasilkan tiruan yang meleset, dan
 * tiruan logo yang meleset lebih buruk daripada tidak ada logo sama sekali —
 * ia terlihat resmi sambil salah. Jadi yang dipakai di sini lambang huruf
 * dalam warna saluran masing-masing, warna yang memang sudah tersimpan di
 * `CH`. Begitu berkas logo aslinya ada di `public/`, tinggal ditukar di satu
 * tempat: `ChannelMark`.
 *
 * WhatsApp perkecualian. Lambangnya gagang telepon di dalam balon percakapan —
 * bentuk yang sederhana, tidak bergantung pada huruf, dan bisa digambar setia
 * tanpa menebak. Blokir dan "semua saluran" bukan merek, jadi keduanya ikon.
 */

import { CH } from "@/lib/data";
import type { ChannelFilter } from "@/lib/derive";
import type { Screen } from "@/lib/types";

/* Satu gaya untuk keenamnya: garis, tanpa isian, mengikuti warna teksnya.
   Ikon berisian di sebelah teks tipis akan tampak lebih berat daripada
   labelnya dan menarik mata ke tempat yang salah. */
const GARIS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/*
 * Peta, bukan `switch`.
 *
 * Versi pertama berkas ini sebuah `switch` dengan enam cabang, dan layar
 * ketujuh — "Sistem lama" — sudah ada di `Screen` tanpa cabangnya. TypeScript
 * diam saja: cabang yang tidak ada memulangkan undefined, dan React
 * menggambar tidak apa-apa. Yang ketahuan cuma lewat uji browser, sebagai satu
 * tombol tanpa ikon di antara enam yang punya.
 *
 * `Record<Screen, …>` menutup celah itu di tempatnya: layar baru tanpa ikon
 * tidak akan ter-build sama sekali.
 */
export function NavIcon({ screen, size = 17 }: { screen: Screen; size?: number }) {
  const bingkai = {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    "aria-hidden": true as const,
    className: "shrink-0",
  };

  switch (screen) {
    /* Dua penggeser, bentuk pengaturan yang tidak bisa disangka lain. */
    case "pengaturan":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <path d="M3 6h14M3 14h14" />
            <circle cx="7" cy="6" r="2" />
            <circle cx="13" cy="14" r="2" />
          </g>
        </svg>
      );

    /* Garis naik di atas alas: statistik kunjungan, bukan batang laporan. */
    case "statistik":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <path d="M2.5 16.5h15" />
            <path d="M3.5 12.5 7.5 8.5l3 3 5-6" />
            <path d="M12.5 5.5h3v3" />
          </g>
        </svg>
      );

    /* Empat petak, satu lebih lebar: meja ringkasan, bukan daftar. */
    case "ringkasan":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <rect x="2.5" y="2.5" width="6" height="8" rx="1.8" />
            <rect x="11.5" y="2.5" width="6" height="4.5" rx="1.8" />
            <rect x="2.5" y="13.5" width="6" height="4" rx="1.8" />
            <rect x="11.5" y="10" width="6" height="7.5" rx="1.8" />
          </g>
        </svg>
      );

    /* Kisi berbingkai dengan dua gantungan — bentuk kalender dinding, bukan
       kotak polos yang bisa berarti apa saja. */
    case "kalender":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <rect x="2.5" y="4" width="15" height="13" rx="2.5" />
            <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" />
            <path d="M6.5 11.5h2M11.5 11.5h2M6.5 14h2M11.5 14h2" />
          </g>
        </svg>
      );

    /* Tiga batang beda tinggi di atas satu alas. Tinggi yang berbeda itu yang
       membuatnya terbaca sebagai laporan dan bukan sebagai daftar. */
    case "laporan":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <path d="M2.5 16.5h15" />
            <path d="M6 16.5V9M10 16.5V4.5M14 16.5v-4" />
          </g>
        </svg>
      );

    /* Ranjang: sandaran, kasur, satu bantal. Bukan gedung — yang dikelola di
       layar itu kamar, dan gedung akan bertabrakan artinya dengan properti
       sebagai perusahaan. */
    case "properti":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <path d="M2.5 16v-4.5h15V16" />
            <path d="M2.5 11.5V5" />
            <path d="M17.5 16v-1.5" />
            <path d="M5.5 11.5V9h4.5v2.5" />
            <path d="M10 9h4.5a3 3 0 0 1 3 2.5" />
          </g>
        </svg>
      );

    /* Dua busur berujung panah yang saling mengejar — siklus, bukan satu
       panah yang cuma berarti "kirim". */
    case "sinkron":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <path d="M16.5 8a7 7 0 0 0-12.1-3.3L2.5 6.5" />
            <path d="M3.5 12a7 7 0 0 0 12.1 3.3l1.9-1.8" />
            <path d="M2.5 3v3.5H6" />
            <path d="M17.5 17v-3.5H14" />
          </g>
        </svg>
      );

    /* Arsip: peti berlaci dengan satu gagang. Sistem lama dibaca dan tidak
       pernah ditulisi, dan laci arsip membawa arti itu — bukan jam mundur,
       yang akan berarti riwayat, dan bukan basis data, yang sudah dipakai
       ikon sinkron. */
    case "lama":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <rect x="2.5" y="3" width="15" height="14" rx="2.5" />
            <path d="M2.5 8h15" />
            <path d="M8 5.5h4" />
            <path d="M8 12.5h4" />
          </g>
        </svg>
      );

    /* Bola dunia: lingkaran, khatulistiwa, satu meridian. */
    case "website":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <circle cx="10" cy="10" r="7.5" />
            <path d="M2.5 10h15" />
            <path d="M10 2.5c2 2.2 3 4.8 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.8-3-7.5s1-5.3 3-7.5Z" />
          </g>
        </svg>
      );

    /* Lembaran uang: persegi panjang dengan satu lingkaran di tengah. */
    case "keuangan":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <rect x="2" y="5" width="16" height="10" rx="2" />
            <circle cx="10" cy="10" r="2.4" />
            <path d="M5 8v.01M15 12v.01" />
          </g>
        </svg>
      );

    /* Tanda pengenal pegawai: kartu dengan kepala dan dua garis. Bukan dua
       orang, yang sudah dipakai layar akun dan peran. */
    case "sdm":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
            <circle cx="7.5" cy="9" r="1.8" />
            <path d="M4.8 13.5c.4-1.3 1.5-2 2.7-2s2.3.7 2.7 2" />
            <path d="M12 8h3.5M12 11h3.5" />
          </g>
        </svg>
      );

    /* Kardus: kotak dengan tutup dan satu lipatan. */
    case "gudang":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7Z" />
            <path d="M3 6.5 10 10l7-3.5M10 10v7" />
          </g>
        </svg>
      );

    /* Dua orang, bukan satu: layarnya soal peran dan siapa boleh melihat apa,
       dan itu selalu tentang lebih dari satu orang. */
    case "pengguna":
      return (
        <svg {...bingkai}>
          <g {...GARIS}>
            <circle cx="7.5" cy="7" r="3" />
            <path d="M1.5 16.5c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5" />
            <path d="M13.5 5.2a3 3 0 0 1 0 5.6" />
            <path d="M15 12.4c2.1.6 3.5 2 3.5 4.1" />
          </g>
        </svg>
      );
  }

  /* Penjaga habis-pilihan. Versi pertama berkas ini enam cabang, sementara
     `Screen` sudah punya tujuh — layar "Sistem lama" lewat tanpa ikon dan
     tanpa keluhan, karena cabang yang tidak ada memulangkan undefined dan
     React menggambar tidak apa-apa. Yang ketahuan cuma lewat uji browser.
     Baris ini menutupnya di tempatnya: layar baru tanpa ikon tidak akan
     ter-build sama sekali. */
  const belumDigambar: never = screen;
  return belumDigambar;
}

/** Huruf yang mewakili tiap OTA pada lambangnya. */
const HURUF: Record<string, string> = {
  "Booking.com": "B",
  Traveloka: "t",
  Agoda: "a",
};

export function ChannelMark({ channel }: { channel: ChannelFilter }) {
  const kotak =
    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px]";

  /* Tiga keping bertumpuk: bukan satu saluran, melainkan semuanya sekaligus. */
  if (channel === "all") {
    return (
      <span className={`${kotak} bg-surface-hover text-slate-mute`}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <g fill="currentColor">
            <rect x="0" y="0" width="5" height="5" rx="1.2" />
            <rect x="7" y="0" width="5" height="5" rx="1.2" />
            <rect x="0" y="7" width="5" height="5" rx="1.2" />
            <rect x="7" y="7" width="5" height="5" rx="1.2" />
          </g>
        </svg>
      </span>
    );
  }

  const warna = CH[channel].dot;

  /* Blokir bukan merek dan tidak menjual apa-apa: lingkaran bercoret, dan
     abu-abu miliknya sendiri, bukan warna saluran. */
  if (channel === "Blokir") {
    return (
      <span className={`${kotak} bg-surface-hover`} style={{ color: warna }}>
        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="5.2" />
            <path d="M3.3 10.7 10.7 3.3" />
          </g>
        </svg>
      </span>
    );
  }

  /* Bukan merek: booking yang terbaca dari sistem staf lama. Laci arsip yang
     sama dengan ikon navnya, supaya dua tempat yang menyebut hal yang sama
     tidak memakai dua bentuk berbeda. */
  if (channel === "Sistem lama") {
    return (
      <span className={kotak} style={{ background: warna }}>
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <g
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2.2" y="2.6" width="11.6" height="10.8" rx="2" />
            <path d="M2.2 6.6h11.6" />
            <path d="M6.4 4.6h3.2" />
            <path d="M6.4 10h3.2" />
          </g>
        </svg>
      </span>
    );
  }

  /* Gagang telepon di dalam balon percakapan. Digambar, bukan huruf, karena
     bentuknya memang bisa digambar setia tanpa menebak. */
  if (channel === "WhatsApp") {
    return (
      <span className={kotak} style={{ background: warna }}>
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <path
            fill="#fff"
            d="M8 1.5a6.4 6.4 0 0 0-5.5 9.7L1.6 14.5l3.4-.9A6.4 6.4 0 1 0 8 1.5Zm0 1.5a4.9 4.9 0 1 1-2.6 9l-.3-.2-1.7.5.5-1.7-.2-.3A4.9 4.9 0 0 1 8 3Z"
          />
          <path
            fill="#fff"
            d="M6.1 5.4c.1-.3.3-.3.4-.3h.4c.1 0 .3 0 .4.3l.5 1.2c0 .1 0 .2-.1.3l-.3.3c-.1.1-.2.2-.1.4.2.4.6.9 1 1.2.4.3.7.4.9.5.1 0 .2 0 .3-.1l.4-.4c.1-.1.2-.1.4-.1l1.1.6c.2.1.2.2.2.3 0 .2 0 .6-.3.9-.2.3-.7.5-1.1.5-.5 0-1.7-.4-2.8-1.4-1.1-1-1.5-2.1-1.6-2.6-.1-.5.1-1 .3-1.3Z"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`${kotak} text-[11px] leading-none font-bold text-white`}
      style={{ background: warna }}
    >
      {HURUF[channel] ?? channel.slice(0, 1)}
    </span>
  );
}
