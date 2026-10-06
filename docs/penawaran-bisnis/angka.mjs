/**
 * Every figure in this offer, in one place.
 *
 * `docs/build.mjs` calls the default export and swaps each `__N_name__` in
 * the markup for the matching string. The markup therefore holds no
 * arithmetic at all: change a price here and every place it reaches — the
 * three option columns, the per-year row, the deposits, the renewal page,
 * the signature page — moves together or not at all.
 *
 * ## The shape of this offer, and why it is this shape
 *
 * The owner is the one who gets the call when something breaks, so this is
 * not a build-and-walk-away price. It is a yearly service with a price for
 * staying:
 *
 *     Tahun pertama                      Rp  9.000.000
 *     Tiap tahun sesudahnya              Rp  6.000.000
 *     Atau: tiga tahun dikunci di depan  Rp 12.000.000
 *
 * Paying year by year for three years is Rp 21 juta; the three-year package
 * is Rp 12 juta. That gap is the whole argument of page 13, and it is a
 * commitment discount rather than an accounting trick — the document says so
 * in those words rather than leaving the reader to find it.
 *
 * The package prices are round on purpose. They are the owner's numbers, set
 * from the outside in: what the work is worth per year, not what the parts
 * add up to. The Hostinger side is still itemised to the rupiah on page 13
 * and the receipt is still handed over, so what the service costs is plain
 * rather than buried — it is simply priced, not computed.
 *
 * ## Where the Hostinger numbers come from
 *
 * The owner's own Hostinger checkout dialog for Unlimited Web Hosting,
 * 6 October 2026. It lists all four durations at once, and the struck-through
 * price is the same on every one of them:
 *
 *     48 bulan   hemat 70%   Rp129.900 -> Rp38.900 / bln
 *     24 bulan   hemat 65%   Rp129.900 -> Rp44.900 / bln
 *     12 bulan   hemat 54%   Rp129.900 -> Rp59.900 / bln
 *      1 bulan                          Rp129.900 / bln
 *     Biaya perpanjangan paket          Rp121.900 / bln
 *
 * So Rp 129.900 per bulan is the normal price for any term, which is what
 * the Hostinger side is budgeted at. The same dialog settles the tax: its
 * 48-month summary reads Rp1.867.200 plus Rp205.392, exactly 11%.
 *
 * Hostinger sells 1, 12, 24 and 48 months — there is no 36. At the normal
 * price that costs nothing to work around, because the rate does not change
 * with the term: 24 x 129.900 + 12 x 129.900 is 36 x 129.900 to the rupiah.
 */

/* ------------------------------------------------------------- masukan */

/**
 * The plan.
 *
 * `nama` is what the card says. `DEPLOY.md` still calls it "Business Web
 * Hosting", which is what the tab is called ("Paket Individual & Business");
 * the plan inside it that carries Node.js is Unlimited. Naming it wrong in a
 * document somebody orders from is how the wrong thing gets ordered.
 */
const PAKET = {
  nama: "Unlimited Web Hosting",
  /** Harga coret, sama di keempat durasi di layar checkout. */
  normalPerBulan: 129900,
  /** Tertulis sendiri di dialognya, di bawah ringkasan pembayaran. */
  perpanjanganPerBulan: 121900,
  /* Keduanya tertulis di kartu paketnya, dan keduanya mengubah angka di
     bawah: tahun pertama tidak membayar email maupun satu nama domain. */
  emailGratisBulan: 12,
  domainGratisTahun: 1,
};

/**
 * Tiga pilihan, dengan harga paketnya masing-masing.
 *
 * `harga` is set, not derived. Rp 9 juta for the first year and Rp 12 juta
 * for three are the owner's figures; Rp 10,5 juta for two years is the
 * midpoint between them, and the one number here nobody has confirmed —
 * change it in this line if it should be something else.
 */
const PERIODE = [
  { kunci: "a", bulan: 12, label: "1 tahun", harga: 9000000, periksa: 1 },
  { kunci: "b", bulan: 24, label: "2 tahun", harga: 10500000, periksa: 2 },
  { kunci: "c", bulan: 36, label: "3 tahun", harga: 12000000, periksa: 3 },
];

/**
 * Tiap tahun sesudah masa paketnya habis, dan tiap tahun kalau dibayar
 * tahunan sejak awal.
 *
 * This is the number the whole offer turns on: what being the person who
 * answers when something breaks is worth per year. It covers the Hostinger
 * bill for that year and the support on top of it, and page 14 splits it
 * into exactly those two so nobody has to guess which is which.
 */
const LANJUT = 6000000;

/** Harga tahun pertama kalau dibayar tahunan, bukan dikunci di depan. */
const TAHUN_PERTAMA = PERIODE[0].harga;

/**
 * Professional email, one mailbox, at the normal price from the same cart
 * the other offer was built from. Only the months after the plan's free year
 * are budgeted.
 */
const EMAIL = { perBulan: 28900 };

/** Dua nama: `turtlehomestay.com` dan `eddohomestay.com`. */
const DOMAIN = { perTahun: 209900, berapa: 2 };

/** ICANN's levy, per name per year. Not Hostinger's, and not waived with the
    plan's free domain, so it is charged on both names every year. */
const ICANN = 9938;

/** Dari ringkasan pembayaran di layar checkout: 205.392 / 1.867.200 = 11%. */
const PAJAK = 0.11;

/** Enam bagian pengerjaan di halaman 12, sekali jalan. */
const HARI_KERJA = 3;

/** Uang muka dibayar di depan karena Hostinger menagih penuh di depan;
    sisanya setelah semuanya dicek bersama. */
const MUKA = 0.7;

/* ------------------------------------------------------------ hitungan */

/** `1234567` becomes `Rp 1.234.567`. Written out rather than left to ICU,
 *  which is a build-time dependency this does not need. */
const rp = (n) => `Rp ${Math.round(n).toLocaleString("en-US").replaceAll(",", ".")}`;

/** What stands in for a figure that cannot be computed yet. */
const ISI = '<span class="isi">belum diisi</span>';
const angka = (n) => (n === null || n === undefined ? ISI : rp(n));

/**
 * The Hostinger bill for one term.
 *
 * The plan's free year is subtracted rather than assumed away: email is paid
 * only for the months past it, and of the two domain names only one is free,
 * and only for its first year.
 */
function hostinger(bulan) {
  const tahun = Math.ceil(bulan / 12);
  const paket = PAKET.normalPerBulan * bulan;
  const bulanEmail = Math.max(0, bulan - PAKET.emailGratisBulan);
  const email = bulanEmail * EMAIL.perBulan;
  const domain = (DOMAIN.berapa * tahun - PAKET.domainGratisTahun) * DOMAIN.perTahun;
  const icann = DOMAIN.berapa * tahun * ICANN;
  const sebelumPajak = paket + email + domain + icann;
  const pajak = Math.round(sebelumPajak * PAJAK);
  return { tahun, paket, bulanEmail, email, domain, icann, pajak, jumlah: sebelumPajak + pajak };
}

function hitung(p) {
  const h = hostinger(p.bulan);
  /* Kalau dibayar tahunan: tahun pertama harga tahun pertama, sisanya harga
     perpanjangan. Itu pembanding yang membuat paket panjang masuk akal. */
  const tahunan = TAHUN_PERTAMA + LANJUT * (h.tahun - 1);
  const muka = Math.round(p.harga * MUKA);
  return {
    ...p,
    ...h,
    /* Sisa harga paket sesudah bagian Hostinger: pengerjaan dan
       pendampingan. Dihitung sebagai sisa, bukan dipatok, supaya totalnya
       tetap bulat dan bagian Hostinger tetap apa adanya. */
    jasa: p.harga - h.jumlah,
    perTahun: p.harga / h.tahun,
    muka,
    sisa: p.harga - muka,
    tahunan,
    hemat: tahunan - p.harga,
    /** Tahun keberapa tagihan perpanjangan pertama datang. */
    mulaiLanjut: h.tahun + 1,
  };
}

const H = PERIODE.map(hitung);

/* Perpanjangan, per tahun. Sisi Hostinger-nya memakai harga perpanjangan
   yang tertulis di dialognya sendiri, bukan harga normal: untuk pos ini
   Hostinger menyebut angkanya, jadi tidak perlu ditaksir. */
const lHosting = PAKET.perpanjanganPerBulan * 12;
const lEmail = EMAIL.perBulan * 12;
const lDomain = DOMAIN.perTahun * DOMAIN.berapa;
const lIcann = ICANN * DOMAIN.berapa;
const lSebelumPajak = lHosting + lEmail + lDomain + lIcann;
const lPajak = Math.round(lSebelumPajak * PAJAK);
const lKeHostinger = lSebelumPajak + lPajak;
/** Sisa biaya perpanjangan sesudah tagihan Hostinger: itulah pendampingannya. */
const lDamping = LANJUT - lKeHostinger;

/**
 * The band. It is the difference between a draft and a document somebody
 * signs, so it is loud, and it leaves on its own the moment every term has a
 * price — nobody has to remember to delete it.
 */
const belum = H.filter((h) => !h.harga);
const pita = belum.length
  ? "<div class=\"draf\"><strong>Draf — harga paket untuk " +
    belum.map((h) => h.label).join(" dan ") +
    " belum diisi.</strong> Isi di <span class=\"mono\">docs/penawaran-bisnis/angka.mjs</span>. " +
    "Dokumen ini belum boleh dikirim.</div>"
  : "";

export default function () {
  const keluar = {
    pita,
    "nama-paket": PAKET.nama,
    "pajak-persen": `${Math.round(PAJAK * 100)}%`,
    "hosting-satuan": `${rp(PAKET.normalPerBulan)} / bln`,
    "email-bln": `${rp(EMAIL.perBulan)} / bln`,
    "domain-thn": `${rp(DOMAIN.perTahun)} / thn`,
    "icann-satuan": rp(ICANN),
    "jasa-hari": String(HARI_KERJA),
    "muka-persen": `${Math.round(MUKA * 100)}%`,
    "sisa-persen": `${Math.round((1 - MUKA) * 100)}%`,

    /* --- biaya lanjutan, per tahun --- */
    lanjut: rp(LANJUT),
    "lanjut-bln": `${rp(Math.round(LANJUT / 12))} / bln`,
    "lanjut-hostinger": rp(lKeHostinger),
    "lanjut-damping": rp(lDamping),
    "lanjut-damping-bln": `${rp(Math.round(lDamping / 12))} / bln`,
    "l-hosting-bln": `${rp(PAKET.perpanjanganPerBulan)} / bln`,
    "l-hosting": rp(lHosting),
    "l-email": rp(lEmail),
    "l-domain": rp(lDomain),
    "l-icann": rp(lIcann),
    "l-pajak": rp(lPajak),
    "tahun-pertama": rp(TAHUN_PERTAMA),
  };

  /* Satu set kunci per masa paket, dibangkitkan dari daftarnya sendiri, jadi
     menambah atau mengurangi pilihan tidak meninggalkan kunci yatim. */
  for (const h of H) {
    const k = h.kunci;
    keluar[`${k}-label`] = h.label;
    keluar[`${k}-bulan`] = String(h.bulan);
    keluar[`${k}-hosting-paket`] = rp(h.paket);
    keluar[`${k}-email`] = h.bulanEmail === 0 ? "gratis" : rp(h.email);
    keluar[`${k}-domain`] = rp(h.domain);
    keluar[`${k}-icann`] = rp(h.icann);
    keluar[`${k}-pajak`] = rp(h.pajak);
    keluar[`${k}-hostinger`] = rp(h.jumlah);
    keluar[`${k}-jasa`] = rp(h.jasa);
    keluar[`${k}-periksa`] = `${h.periksa}&times;`;
    keluar[`${k}-total`] = angka(h.harga);
    keluar[`${k}-per-tahun`] = angka(h.perTahun);
    keluar[`${k}-muka`] = rp(h.muka);
    keluar[`${k}-sisa`] = rp(h.sisa);
    keluar[`${k}-tahunan`] = rp(h.tahunan);
    keluar[`${k}-mulai-lanjut`] = `tahun ke-${h.mulaiLanjut}`;
    /* Hemat cuma ada artinya kalau masanya lebih dari setahun; di masa
       setahun harga paket memang harga tahunannya. */
    if (h.hemat > 0) keluar[`${k}-hemat`] = rp(h.hemat);
  }
  return keluar;
}
