/**
 * Every figure in this offer, in one place.
 *
 * `docs/build.mjs` calls the default export and swaps each `__N_name__` in
 * the markup for the matching string. The markup therefore holds no
 * arithmetic at all: change a price here and every place it reaches — both
 * option columns, the tax on each, the two totals, the two deposits, the
 * renewal page, the signature page — moves together or not at all.
 *
 * ## Where the hosting price comes from
 *
 * Read off the owner's own Hostinger checkout screen on 6 October 2026, the
 * 48-month card for the plan named **Unlimited**: "Paket 48 bln mulai
 * Rp1.867.200 (harga normal Rp6.235.200). Biaya perpanjangan Rp121.900/bln."
 *
 *     6.235.200 / 48 = 129.900 per bulan   <- harga normal, yang dipakai
 *     1.867.200 / 48 =  38.900 per bulan   <- harga promo, tidak dipakai
 *
 * Normal rather than promo, on the owner's instruction and for the same
 * reason the other offer does it: a budget built on a promo breaks on the
 * day the promo ends. Here it is conservative twice over, because the stated
 * renewal price (Rp121.900) is *below* the normal price it is budgeted at.
 *
 * **The catch, and it is in RINCIAN-INTERNAL.md too:** Hostinger shows a
 * different struck-through price on each duration card. Rp129.900 is the
 * 48-month card's. The 12-month card was not open in the screenshot, and a
 * shorter term is usually dearer per month, so check that card before
 * sending the one-year column — `PERIODE[0].perBulan` below is the one line
 * to change.
 */

/* ------------------------------------------------------------- masukan */

/**
 * The plan itself.
 *
 * `nama` is what the card says. `DEPLOY.md` still calls it "Business Web
 * Hosting", which is what the tab is called ("Paket Individual & Business");
 * the plan inside it that carries Node.js is **Unlimited**. Naming it wrong
 * in a document somebody orders from is how the wrong thing gets ordered.
 */
const PAKET = {
  nama: "Unlimited",
  perpanjanganPerBulan: 121900,
  /* Keduanya tertulis di kartu paketnya, dan keduanya mengubah angka di
     bawah: tahun pertama tidak membayar email maupun satu nama domain. */
  emailGratisBulan: 12,
  domainGratisTahun: 1,
};

/**
 * The two terms the owner asked to offer. `perBulan` is per term on purpose,
 * because Hostinger prices each term differently; both carry the 48-month
 * card's figure today, and the comment says which one still needs checking.
 */
const PERIODE = [
  { kunci: "a", bulan: 12, label: "1 tahun", perBulan: 129900 /* belum dicek di kartu 12 bulan */ },
  { kunci: "b", bulan: 36, label: "3 tahun", perBulan: 129900 /* dari kartu 48 bulan */ },
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

/** From the Hostinger checkout screen. Confirm it is still 11% when ordering. */
const PAJAK = 0.11;

/**
 * The fee. Three working days at the Rp 750.000 per day the other offer was
 * priced at — that one scoped four days because a VPS has to be ordered,
 * hardened, given Coolify and a PostgreSQL of its own. None of that applies
 * to a managed plan, so the day that paid for it is gone rather than hidden.
 * The same fee either way: the work does not change with the term.
 */
const JASA = { hari: 3, perHari: 750000 };

/* ------------------------------------------------------------ hitungan */

/** `1234567` becomes `Rp 1.234.567`. Written out rather than left to ICU,
 *  which is a build-time dependency this does not need. */
const rp = (n) => `Rp ${Math.round(n).toLocaleString("en-US").replaceAll(",", ".")}`;

/** What stands in for a figure that cannot be computed yet. */
const ISI = '<span class="isi">belum diisi</span>';
const angka = (n) => (n === null || n === undefined ? ISI : rp(n));

/**
 * One term, priced.
 *
 * The free year is subtracted rather than assumed away: email is paid only
 * for the months past it, and of the two domain names only one is free, and
 * only for its first year.
 */
function hitung(p) {
  const tahun = Math.ceil(p.bulan / 12);
  const hosting = p.perBulan === null ? null : p.perBulan * p.bulan;

  const bulanEmail = Math.max(0, p.bulan - PAKET.emailGratisBulan);
  const email = bulanEmail * EMAIL.perBulan;

  const tahunDomain = DOMAIN.berapa * tahun - PAKET.domainGratisTahun;
  const domain = tahunDomain * DOMAIN.perTahun;

  const icannTahun = DOMAIN.berapa * tahun;
  const icann = icannTahun * ICANN;

  const sebelumPajak = hosting === null ? null : hosting + email + domain + icann;
  const pajak = sebelumPajak === null ? null : Math.round(sebelumPajak * PAJAK);
  const keHostinger = sebelumPajak === null ? null : sebelumPajak + pajak;

  const jasa = JASA.hari * JASA.perHari;
  const sisa = jasa / 2;

  return {
    tahun,
    bulanEmail,
    tahunDomain,
    icannTahun,
    hosting,
    email,
    domain,
    icann,
    pajak,
    keHostinger,
    total: keHostinger === null ? null : keHostinger + jasa,
    dp: keHostinger === null ? null : keHostinger + sisa,
  };
}

const H = Object.fromEntries(PERIODE.map((p) => [p.kunci, { ...p, ...hitung(p) }]));

const jasa = JASA.hari * JASA.perHari;
const sisa = jasa / 2;

/**
 * The hosting amount for one term, with its own monthly rate under it.
 *
 * The rate lives in the column rather than in a shared "harga satuan" cell
 * because Hostinger prices each term differently: the moment the two terms
 * stop sharing a rate, one shared cell would be quietly wrong for one of
 * them, and that is a wrong number on a price page nobody re-checks.
 */
const rinciHosting = (h) =>
  h.hosting === null
    ? ISI
    : `${rp(h.hosting)}<br><span class="small">${rp(h.perBulan)} / bln</span>`;

/* Perpanjangan, per tahun, sesudah masa paketnya habis. Memakai harga
   perpanjangan yang tertulis di kartunya, bukan harga normal: untuk pos ini
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
const belum = PERIODE.filter((p) => p.perBulan === null);
const pita = belum.length
  ? '<div class="draf"><strong>Draf — harga paket ' +
    PAKET.nama +
    " untuk " +
    belum.map((p) => p.label).join(" dan ") +
    " belum diisi.</strong> " +
    "Harganya diambil dari keranjang atau halaman checkout Hostinger, bukan dari artikel, " +
    'lalu dituliskan di <span class="mono">docs/penawaran-bisnis/angka.mjs</span>. ' +
    "Dokumen ini belum boleh dikirim.</div>"
  : "";

export default function () {
  return {
    pita,
    "nama-paket": PAKET.nama,
    "pajak-persen": `${Math.round(PAJAK * 100)}%`,
    "email-bln": `${rp(EMAIL.perBulan)} / bln`,
    "domain-thn": `${rp(DOMAIN.perTahun)} / thn`,
    "icann-satuan": rp(ICANN),
    jasa: rp(jasa),
    "jasa-hari": String(JASA.hari),
    sisa: rp(sisa),

    /* --- pilihan A, 1 tahun --- */
    "a-label": H.a.label,
    "a-bulan": String(H.a.bulan),
    "a-hosting-rinci": rinciHosting(H.a),
    "a-email": H.a.bulanEmail === 0 ? "gratis" : rp(H.a.email),
    "a-domain": rp(H.a.domain),
    "a-icann": rp(H.a.icann),
    "a-pajak": angka(H.a.pajak),
    "a-hostinger": angka(H.a.keHostinger),
    "a-total": angka(H.a.total),
    "a-dp": angka(H.a.dp),

    /* --- pilihan B, 3 tahun --- */
    "b-label": H.b.label,
    "b-bulan": String(H.b.bulan),
    "b-hosting-bln": H.b.perBulan === null ? ISI : `${rp(H.b.perBulan)} / bln`,
    "b-hosting-rinci": rinciHosting(H.b),
    "b-email": H.b.bulanEmail === 0 ? "gratis" : rp(H.b.email),
    "b-domain": rp(H.b.domain),
    "b-icann": rp(H.b.icann),
    "b-pajak": angka(H.b.pajak),
    "b-hostinger": angka(H.b.keHostinger),
    "b-total": angka(H.b.total),
    "b-dp": angka(H.b.dp),

    /* --- perpanjangan, per tahun --- */
    "r-hosting-bln": `${rp(PAKET.perpanjanganPerBulan)} / bln`,
    "r-hosting": rp(rHosting),
    "r-email": rp(rEmail),
    "r-domain": rp(rDomain),
    "r-icann": rp(rIcann),
    "r-pajak": rp(rPajak),
    "r-total": rp(rSebelumPajak + rPajak),

    /* --- bandingan per tahun, sisi Hostinger saja --- */
    "a-per-tahun": angka(H.a.keHostinger === null ? null : H.a.keHostinger / H.a.tahun),
    "b-per-tahun": angka(H.b.keHostinger === null ? null : H.b.keHostinger / H.b.tahun),
  };
}
