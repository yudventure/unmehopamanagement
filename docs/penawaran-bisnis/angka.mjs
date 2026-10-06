/**
 * Every figure in this offer, in one place.
 *
 * `docs/build.mjs` calls the default export and swaps each `__N_name__` in
 * the markup for the matching string. The markup therefore holds no
 * arithmetic at all: change a price here and every place it reaches — the
 * three option columns, the tax on each, the three totals, the three
 * deposits, the renewal page, the signature page — moves together or not at
 * all.
 *
 * ## Where the numbers come from
 *
 * The owner's own Hostinger checkout dialog for **Unlimited Web Hosting**,
 * 6 October 2026. It lists all four durations at once, and the struck-through
 * price is the same on every one of them:
 *
 *     48 bulan   hemat 70%   Rp129.900 -> Rp38.900 / bln
 *     24 bulan   hemat 65%   Rp129.900 -> Rp44.900 / bln
 *     12 bulan   hemat 54%   Rp129.900 -> Rp59.900 / bln
 *      1 bulan                          Rp129.900 / bln
 *     Biaya perpanjangan paket          Rp121.900 / bln
 *
 * So **Rp 129.900 per bulan is the normal price for any term**, which is what
 * this offer budgets at, on the owner's instruction. It is conservative
 * twice over: the renewal price Hostinger states (Rp121.900) is *below* the
 * figure budgeted here.
 *
 * The same dialog settles the tax: its 48-month summary reads Rp1.867.200
 * plus Rp205.392, and 205.392 / 1.867.200 is exactly 11%.
 *
 * ## Three years is bought as 24 + 12
 *
 * Hostinger sells 1, 12, 24 and 48 months — there is no 36. At the normal
 * price that costs nothing to work around, because the rate does not change
 * with the term: 24 x 129.900 + 12 x 129.900 is 36 x 129.900 to the rupiah.
 * The document says so on the price page rather than leaving it to be
 * discovered at checkout.
 */

/* ------------------------------------------------------------- masukan */

/**
 * The plan.
 *
 * `nama` is what the card says. `DEPLOY.md` still calls it "Business Web
 * Hosting", which is what the tab is called ("Paket Individual & Business");
 * the plan inside it that carries Node.js is **Unlimited**. Naming it wrong
 * in a document somebody orders from is how the wrong thing gets ordered.
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
 * Tiga pilihan, dan apa yang ikut di tiap pilihan.
 *
 * `damping` is what the longer terms buy beyond the setup, and it is the
 * reason the ladder leans the way it does: the Hostinger side alone is
 * slightly *cheaper* per year on the shortest term, because the plan's two
 * one-year gifts land entirely inside it. Without something real attached to
 * the longer terms, recommending them would mean recommending the worse
 * deal. So the longer terms carry support, priced cheaper by the month the
 * longer it runs, and that is what turns the all-in cost per year the right
 * way round.
 */
const PERIODE = [
  { kunci: "a", bulan: 12, label: "1 tahun", dampingBulan: 0, damping: 0, garansi: 14 },
  { kunci: "b", bulan: 24, label: "2 tahun", dampingBulan: 6, damping: 1250000, garansi: 30 },
  { kunci: "c", bulan: 36, label: "3 tahun", dampingBulan: 12, damping: 2000000, garansi: 60 },
];

/**
 * Professional email, one mailbox, at the normal price from the same cart
 * the other offer was built from.
 *
 * Only the months after the plan's free year are budgeted. The plan says
 * "kotak surat tanpa batas per situs — gratis selama 1 tahun"; what a
 * mailbox costs on this plan *after* that year is not on the card, so the
 * known price of Hostinger's separate email product stands in for it.
 */
const EMAIL = { perBulan: 28900 };

/** Dua nama: `turtlehomestay.com` dan `eddohomestay.com`. */
const DOMAIN = { perTahun: 209900, berapa: 2 };

/** ICANN's levy, per name per year. Not Hostinger's, and not waived with the
    plan's free domain, so it is charged on both names every year. */
const ICANN = 9938;

/** Dari ringkasan pembayaran di layar checkout: 205.392 / 1.867.200 = 11%. */
const PAJAK = 0.11;

/**
 * The setup fee: the six parts on page 12, three working days, once.
 *
 * Rp 3.000.000 is the owner's own figure, the same one the VPS offer
 * carries. The work here is shorter than that one — no VPS to order and
 * harden, no Coolify, no PostgreSQL to install — but the price is the
 * owner's to set, not something to be derived down behind their back.
 *
 * Identical in all three columns. What differs between them is the support
 * attached to the term, in `PERIODE`.
 */
const JASA = { setup: 3000000, hari: 3 };

/* ------------------------------------------------------------ hitungan */

/** `1234567` becomes `Rp 1.234.567`. Written out rather than left to ICU,
 *  which is a build-time dependency this does not need. */
const rp = (n) => `Rp ${Math.round(n).toLocaleString("en-US").replaceAll(",", ".")}`;

/** What stands in for a figure that cannot be computed yet. */
const ISI = '<span class="isi">belum diisi</span>';
const angka = (n) => (n === null || n === undefined ? ISI : rp(n));

/** Harga pendampingan per bulan, untuk kalimat "makin panjang makin murah". */
const perBulanDamping = (p) =>
  p.dampingBulan === 0 ? null : Math.round(p.damping / p.dampingBulan);

/**
 * One term, priced.
 *
 * The free year is subtracted rather than assumed away: email is paid only
 * for the months past it, and of the two domain names only one is free, and
 * only for its first year.
 */
function hitung(p) {
  const perBulan = p.perBulan ?? PAKET.normalPerBulan;
  const tahun = Math.ceil(p.bulan / 12);
  const hosting = perBulan === null ? null : perBulan * p.bulan;

  const bulanEmail = Math.max(0, p.bulan - PAKET.emailGratisBulan);
  const email = bulanEmail * EMAIL.perBulan;

  const tahunDomain = DOMAIN.berapa * tahun - PAKET.domainGratisTahun;
  const domain = tahunDomain * DOMAIN.perTahun;

  const icannTahun = DOMAIN.berapa * tahun;
  const icann = icannTahun * ICANN;

  const sebelumPajak = hosting === null ? null : hosting + email + domain + icann;
  const pajak = sebelumPajak === null ? null : Math.round(sebelumPajak * PAJAK);
  const keHostinger = sebelumPajak === null ? null : sebelumPajak + pajak;

  const jasa = JASA.setup + p.damping;
  const sisa = jasa / 2;

  return {
    jasa,
    sisa,
    ...p,
    perBulan,
    tahun,
    bulanEmail,
    hosting,
    email,
    domain,
    icann,
    pajak,
    keHostinger,
    total: keHostinger === null ? null : keHostinger + jasa,
    dp: keHostinger === null ? null : keHostinger + sisa,
    /* Per tahun dihitung dari total yang dilihat klien, bukan dari sisi
       Hostinger saja: itu angka yang benar-benar dibandingkan orang, dan
       itu yang membuat masa terpanjang jadi yang paling masuk akal. */
    perTahun: keHostinger === null ? null : (keHostinger + jasa) / tahun,
    perTahunHostinger: keHostinger === null ? null : keHostinger / tahun,
  };
}

const H = PERIODE.map(hitung);

/**
 * Whether every term shares one monthly rate.
 *
 * Today they do, and the checkout dialog is where that came from rather than
 * an assumption. But Hostinger is free to price a short term dearer tomorrow,
 * and a single shared "harga satuan" cell would then be quietly wrong for two
 * of three columns. So the rate sits in the shared cell only while it really
 * is shared, and drops into each column the moment it stops being.
 */
const seragam = H.every((h) => h.perBulan === H[0].perBulan);

/** The hosting amount for one term, carrying its own rate only when the
 *  shared cell above it cannot. */
const rinciHosting = (h) =>
  h.hosting === null
    ? ISI
    : seragam
      ? rp(h.hosting)
      : `${rp(h.hosting)}<br><span class="small">${rp(h.perBulan)} / bln</span>`;

/* Perpanjangan, per tahun, sesudah masa paketnya habis. Memakai harga
   perpanjangan yang tertulis di dialognya, bukan harga normal: untuk pos ini
   Hostinger menyebut angkanya sendiri, jadi tidak perlu ditaksir. */
const rHosting = PAKET.perpanjanganPerBulan * 12;
const rEmail = EMAIL.perBulan * 12;
const rDomain = DOMAIN.perTahun * DOMAIN.berapa;
const rIcann = ICANN * DOMAIN.berapa;
const rSebelumPajak = rHosting + rEmail + rDomain + rIcann;
const rPajak = Math.round(rSebelumPajak * PAJAK);

/**
 * The band. It is the difference between a draft and a document somebody
 * signs, so it is loud, and it leaves on its own the moment every term has a
 * price — nobody has to remember to delete it.
 */
const belum = H.filter((h) => h.perBulan === null);
const pita = belum.length
  ? `<div class="draf"><strong>Draf — harga paket ${PAKET.nama} untuk ` +
    belum.map((h) => h.label).join(" dan ") +
    " belum diisi.</strong> " +
    "Harganya diambil dari keranjang atau halaman checkout Hostinger, bukan dari artikel, " +
    'lalu dituliskan di <span class="mono">docs/penawaran-bisnis/angka.mjs</span>. ' +
    "Dokumen ini belum boleh dikirim.</div>"
  : "";

export default function () {
  const keluar = {
    pita,
    "nama-paket": PAKET.nama,
    "pajak-persen": `${Math.round(PAJAK * 100)}%`,
    "hosting-satuan": seragam ? `${rp(PAKET.normalPerBulan)} / bln` : "&mdash;",
    "hosting-normal": `${rp(PAKET.normalPerBulan)} / bln`,
    "email-bln": `${rp(EMAIL.perBulan)} / bln`,
    "domain-thn": `${rp(DOMAIN.perTahun)} / thn`,
    "icann-satuan": rp(ICANN),
    setup: rp(JASA.setup),
    /* Selisih biaya per tahun antara masa terpendek dan terpanjang. Dihitung
       di sini, bukan diketik di halamannya: angka yang diketik tangan di
       sebelah angka yang dihitung adalah angka yang akan basi sendiri. */
    "hemat-c":
      H[0].perTahun === null || H[H.length - 1].perTahun === null
        ? ISI
        : rp(H[0].perTahun - H[H.length - 1].perTahun),
    "jasa-hari": String(JASA.hari),
    "r-hosting-bln": `${rp(PAKET.perpanjanganPerBulan)} / bln`,
    "r-hosting": rp(rHosting),
    "r-email": rp(rEmail),
    "r-domain": rp(rDomain),
    "r-icann": rp(rIcann),
    "r-pajak": rp(rPajak),
    "r-total": rp(rSebelumPajak + rPajak),
  };

  /* Satu set kunci per masa paket, dibangkitkan dari daftarnya sendiri, jadi
     menambah atau mengurangi pilihan tidak meninggalkan kunci yatim. */
  for (const h of H) {
    keluar[`${h.kunci}-label`] = h.label;
    keluar[`${h.kunci}-bulan`] = String(h.bulan);
    keluar[`${h.kunci}-hosting`] = rinciHosting(h);
    keluar[`${h.kunci}-email`] = h.bulanEmail === 0 ? "gratis" : rp(h.email);
    keluar[`${h.kunci}-domain`] = rp(h.domain);
    keluar[`${h.kunci}-icann`] = rp(h.icann);
    keluar[`${h.kunci}-pajak`] = angka(h.pajak);
    keluar[`${h.kunci}-hostinger`] = angka(h.keHostinger);
    keluar[`${h.kunci}-jasa`] = rp(h.jasa);
    if (h.damping !== 0) keluar[`${h.kunci}-damping`] = rp(h.damping);
    keluar[`${h.kunci}-damping-bulan`] =
      h.dampingBulan === 0 ? "tidak termasuk" : `${h.dampingBulan} bulan`;
    /* Cuma masa paket yang benar-benar membawa pendampingan yang punya
       harga per bulannya. Kunci kosong untuk yang tidak akan ditolak
       build.mjs sebagai nilai yang tidak dipakai halaman mana pun, dan itu
       memang yang diinginkan. */
    const perBulan = perBulanDamping(h);
    if (perBulan !== null) keluar[`${h.kunci}-damping-per-bulan`] = `${rp(perBulan)} / bln`;
    keluar[`${h.kunci}-garansi`] = `${h.garansi} hari`;
    keluar[`${h.kunci}-total`] = angka(h.total);
    keluar[`${h.kunci}-dp`] = angka(h.dp);
    keluar[`${h.kunci}-sisa`] = rp(h.sisa);
    keluar[`${h.kunci}-per-tahun`] = angka(h.perTahun);
    keluar[`${h.kunci}-per-tahun-hostinger`] = angka(h.perTahunHostinger);
  }
  return keluar;
}
