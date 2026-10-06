/**
 * Every figure in this offer, in one place.
 *
 * `docs/build.mjs` calls the default export and swaps each `__N_name__` in
 * the markup for the matching string. The markup therefore holds no
 * arithmetic at all: change a price here and all eleven places it reaches —
 * the 24-month column, the tax, the two totals, the deposit, the renewal
 * page, the signature page — move together or not at all.
 *
 * ## The one number that is not here yet
 *
 * `BISNIS.perBulan` is `null`, and that is deliberate rather than
 * unfinished. The price of Hostinger's Business Web Hosting plan is not
 * written down anywhere in this repository, and `docs/README.md` says where
 * a Hostinger price may come from: the cart or the checkout screen, never a
 * third-party article — an older version of the other offer used an estimate
 * from such an article and the figure was badly wrong.
 *
 * So until somebody opens the cart, every figure that depends on it prints
 * as a fill-in rather than as a number, and the cover and the two price
 * pages carry a band saying the document is not ready to send. Fill in the
 * two fields below, rebuild, and the band disappears by itself.
 *
 *     node docs/build.mjs penawaran-bisnis
 *     node docs/render.mjs penawaran-bisnis docs/penawaran-hosting-bisnis.pdf
 */

/* ------------------------------------------------------------- masukan */

/**
 * Hostinger Business Web Hosting.
 *
 * `perBulan` is the normal price — the struck-through one, not the promo —
 * for the same reason the other offer uses normal prices: a two-year budget
 * built on a promo is a budget that breaks on the day the promo ends. Write
 * down both when you read them off the cart; only the normal one is used
 * here, and the promo one belongs in RINCIAN-INTERNAL.md.
 */
const BISNIS = {
  perBulan: null,
  bulan: 24,
};

/**
 * Professional email, one mailbox, at the normal price from the same cart
 * the other offer was built from.
 *
 * Budgeted separately on purpose. Shared hosting plans often carry mailboxes
 * of their own, and if the Business plan turns out to include one this line
 * is struck out at checkout rather than quietly assumed away now.
 */
const EMAIL = { perBulan: 28900, bulan: 24 };

/** Two names this time, not three: the dashboard lives under the Eddo domain. */
const DOMAIN = { perTahun: 209900, tahun: 2, berapa: 2 };

/** ICANN's levy, once per name per year of registration. Not Hostinger's. */
const ICANN = 9938;

/** From the Hostinger checkout screen. Confirm it is still 11% when ordering. */
const PAJAK = 0.11;

/**
 * The fee. Three working days at the Rp 750.000 per day the other offer was
 * priced at — that one scoped four days because a VPS has to be ordered,
 * hardened, given Coolify and a PostgreSQL of its own. None of that applies
 * to a managed plan, so the day that paid for it is gone rather than hidden.
 */
const JASA = { hari: 3, perHari: 750000 };

/* ------------------------------------------------------------ hitungan */

/** `1234567` becomes `Rp 1.234.567`. Written out rather than left to ICU,
 *  which is a build-time dependency this does not need. */
const rp = (n) => `Rp ${Math.round(n).toLocaleString("en-US").replaceAll(",", ".")}`;

/** What stands in for a figure that cannot be computed yet. */
const ISI = '<span class="isi">belum diisi</span>';

/** A figure, or the fill-in if anything it rests on is still unknown. */
const angka = (n) => (n === null ? ISI : rp(n));

const kali = (a, b) => (a === null ? null : a * b);
const tambah = (...xs) => (xs.some((x) => x === null) ? null : xs.reduce((a, b) => a + b, 0));

const bisnis24 = kali(BISNIS.perBulan, BISNIS.bulan);
const email24 = EMAIL.perBulan * EMAIL.bulan;
const domain24 = DOMAIN.perTahun * DOMAIN.tahun * DOMAIN.berapa;
const icann24 = ICANN * DOMAIN.berapa * DOMAIN.tahun;
const sebelumPajak = tambah(bisnis24, email24, domain24, icann24);
const pajak24 = sebelumPajak === null ? null : Math.round(sebelumPajak * PAJAK);
const hostinger24 = tambah(sebelumPajak, pajak24);

const jasa = JASA.hari * JASA.perHari;
const total = tambah(hostinger24, jasa);
const sisa = jasa / 2;
const dp = tambah(hostinger24, sisa);

/**
 * The band. It is the difference between a draft and a document somebody
 * signs, so it is loud, and it leaves on its own the moment the price above
 * stops being null — nobody has to remember to delete it.
 */
const pita =
  BISNIS.perBulan === null
    ? '<div class="draf"><strong>Draf — angka paket Business Web Hosting belum diisi.</strong> ' +
      "Harganya diambil dari keranjang atau halaman checkout Hostinger, bukan dari artikel, " +
      "lalu dituliskan di <span class=\"mono\">docs/penawaran-bisnis/angka.mjs</span>. " +
      "Dokumen ini belum boleh dikirim.</div>"
    : "";

export default function () {
  return {
    pita,
    "bisnis-bln": BISNIS.perBulan === null ? ISI : `${rp(BISNIS.perBulan)} / bln`,
    "bisnis-24": angka(bisnis24),
    "email-bln": `${rp(EMAIL.perBulan)} / bln`,
    "email-24": rp(email24),
    "domain-thn": `${rp(DOMAIN.perTahun)} / thn`,
    "domain-24": rp(domain24),
    "icann-satuan": `${rp(ICANN)} &times; ${DOMAIN.berapa * DOMAIN.tahun}`,
    "icann-24": rp(icann24),
    "pajak-persen": `${Math.round(PAJAK * 100)}%`,
    "pajak-24": angka(pajak24),
    "hostinger-24": angka(hostinger24),
    jasa: rp(jasa),
    "jasa-hari": String(JASA.hari),
    total: angka(total),
    dp: angka(dp),
    sisa: rp(sisa),
    "bulan": String(BISNIS.bulan),
  };
}
