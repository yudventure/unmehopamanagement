import { EDDO_DEFAULT_LANG, WHATSAPP, type EddoLang } from "@/lib/eddo-content";
import { esc } from "@/lib/notify";

/**
 * The note a guest gets once their payment has gone through.
 *
 * Midtrans already sends them a receipt, and that receipt is a receipt: an
 * amount, a status and an order number, from a company they have never heard
 * of. What it is not is a word from the people whose house they are coming to,
 * and it does not tell them the one thing they need to do with it, which is
 * keep it.
 *
 * ## Why it is in seven languages rather than one
 *
 * The site is, and a guest who read every page in French and then gets a
 * confirmation in English has been handed back to a stranger at the last step.
 * The language the guest was reading in travels with the order and comes back
 * on the notification, so this is written in the language they chose. English
 * is the fallback, not the assumption.
 *
 * ## Why it lives here and not in `eddo-content.ts`
 *
 * That file is imported by the page and ships to every browser. This is read
 * once, on a server, by a webhook nobody visits. Keeping it apart is a few
 * kilobytes off every page load for words no reader will ever see on screen.
 */

export interface GuestMail {
  subject: (order: string) => string;
  greeting: (name: string) => string;
  thanks: string;
  labelBooking: string;
  labelOrder: string;
  /** The one instruction in the whole email: keep the Midtrans receipt. */
  keep: string;
  ask: string;
  cta: string;
  /** What the WhatsApp message is filled in with, so the guest need not type. */
  waText: (order: string) => string;
  see: string;
  sign: string;
}

export const GUEST_MAIL: Record<EddoLang, GuestMail> = {
  en: {
    subject: (o) => `Your Eddo Homestay booking is paid · ${o}`,
    greeting: (n) => `Dear ${n},`,
    thanks: "Thank you. Your payment has gone through.",
    labelBooking: "Booking",
    labelOrder: "Order",
    keep: "Midtrans sends you a separate receipt for this payment. Please keep it, it is your proof of payment.",
    ask: "If anything is unclear before you travel, message us on WhatsApp and one of the family will answer.",
    cta: "Message us on WhatsApp",
    waText: (o) => `Hello Eddo Homestay, I have a question about booking ${o}`,
    see: "We look forward to welcoming you.",
    sign: "Eddo Homestay",
  },
  id: {
    subject: (o) => `Pembayaran Eddo Homestay sudah diterima · ${o}`,
    greeting: (n) => `Halo ${n},`,
    thanks: "Terima kasih. Pembayaran Anda sudah masuk.",
    labelBooking: "Pesanan",
    labelOrder: "Nomor pesanan",
    keep: "Midtrans mengirim kuitansi terpisah untuk pembayaran ini. Mohon disimpan, itu bukti pembayaran Anda.",
    ask: "Kalau ada yang ingin ditanyakan sebelum berangkat, kirim pesan lewat WhatsApp dan keluarga kami yang menjawab.",
    cta: "Kirim pesan lewat WhatsApp",
    waText: (o) => `Halo Eddo Homestay, saya mau tanya soal pesanan ${o}`,
    see: "Kami tunggu kedatangan Anda.",
    sign: "Eddo Homestay",
  },
  fr: {
    subject: (o) => `Votre réservation Eddo Homestay est payée · ${o}`,
    greeting: (n) => `Bonjour ${n},`,
    thanks: "Merci. Votre paiement est bien arrivé.",
    labelBooking: "Réservation",
    labelOrder: "Commande",
    keep: "Midtrans vous envoie un reçu séparé pour ce paiement. Conservez-le, c'est votre preuve de paiement.",
    ask: "Si quelque chose n'est pas clair avant votre départ, écrivez-nous sur WhatsApp et la famille vous répondra.",
    cta: "Nous écrire sur WhatsApp",
    waText: (o) => `Bonjour Eddo Homestay, j'ai une question sur la réservation ${o}`,
    see: "Nous serons heureux de vous accueillir.",
    sign: "Eddo Homestay",
  },
  ja: {
    subject: (o) => `Eddo Homestay のご予約のお支払いを確認しました · ${o}`,
    greeting: (n) => `${n} 様`,
    thanks: "お支払いいただき、ありがとうございます。無事に確認できました。",
    labelBooking: "ご予約",
    labelOrder: "注文番号",
    keep: "このお支払いの領収書は Midtrans から別途届きます。お支払いの証明になりますので、保管してください。",
    ask: "ご出発前に分からないことがあれば、WhatsApp でお知らせください。家族の者がお答えします。",
    cta: "WhatsApp で問い合わせる",
    waText: (o) => `Eddo Homestay さん、予約 ${o} について質問があります`,
    see: "お越しをお待ちしております。",
    sign: "Eddo Homestay",
  },
  de: {
    subject: (o) => `Eure Buchung bei Eddo Homestay ist bezahlt · ${o}`,
    greeting: (n) => `Hallo ${n},`,
    thanks: "Danke. Eure Zahlung ist angekommen.",
    labelBooking: "Buchung",
    labelOrder: "Bestellnummer",
    keep: "Midtrans schickt euch für diese Zahlung eine eigene Quittung. Hebt sie auf, sie ist euer Zahlungsnachweis.",
    ask: "Wenn vor der Anreise etwas unklar ist, schreibt uns auf WhatsApp, jemand aus der Familie antwortet.",
    cta: "Schreibt uns auf WhatsApp",
    waText: (o) => `Hallo Eddo Homestay, ich habe eine Frage zur Buchung ${o}`,
    see: "Wir freuen uns auf euch.",
    sign: "Eddo Homestay",
  },
  ru: {
    subject: (o) => `Бронирование в Eddo Homestay оплачено · ${o}`,
    greeting: (n) => `Здравствуйте, ${n}!`,
    thanks: "Спасибо, оплата прошла.",
    labelBooking: "Бронирование",
    labelOrder: "Номер заказа",
    keep: "Квитанцию об этой оплате Midtrans пришлёт отдельно. Сохраните её — это ваше подтверждение платежа.",
    ask: "Если перед поездкой что-то останется неясным, напишите нам в WhatsApp, кто-нибудь из семьи ответит.",
    cta: "Написать в WhatsApp",
    waText: (o) => `Здравствуйте, Eddo Homestay! У меня вопрос по брони ${o}`,
    see: "Будем рады вас принять.",
    sign: "Eddo Homestay",
  },
  zh: {
    subject: (o) => `您在 Eddo Homestay 的预订已付款 · ${o}`,
    greeting: (n) => `${n} 您好，`,
    thanks: "感谢您，款项已经收到。",
    labelBooking: "预订内容",
    labelOrder: "订单号",
    keep: "Midtrans 会另外给您发一封收据。请保留好，那是您的付款凭证。",
    ask: "出发前有任何疑问，请用 WhatsApp 联系我们，家里人会回复您。",
    cta: "用 WhatsApp 联系我们",
    waText: (o) => `您好 Eddo Homestay，我想问一下订单 ${o}`,
    see: "期待您的到来。",
    sign: "Eddo Homestay",
  },
};

/** The language the guest read the site in, or English if it is not one of ours. */
export function guestLang(v: string | undefined): EddoLang {
  const k = (v ?? "").trim().toLowerCase();
  return k in GUEST_MAIL ? (k as EddoLang) : EDDO_DEFAULT_LANG;
}

export interface GuestMailInput {
  lang: EddoLang;
  name: string;
  /** The booking in words, as `/api/pay` wrote it. Empty is allowed. */
  booking: string;
  order: string;
}

/**
 * Tables and inline styles, because this is an email.
 *
 * Every layout technique a browser has is off the table: no flexbox that Outlook
 * will honour, no stylesheet that Gmail will not strip, no media query worth
 * relying on. So it is one centred table, a fixed maximum width, and a colour on
 * every element that needs one. It reads as one column on a phone because it
 * only ever was one column.
 */
export function guestMailHtml(o: GuestMailInput) {
  const t = GUEST_MAIL[o.lang];
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t.waText(o.order))}`;
  const row = (k: string, v: string) =>
    `<tr>
      <td style="padding:6px 18px 6px 0;color:#7c8a86;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td>
      <td style="padding:6px 0;color:#12312d;font-size:14px;font-weight:600">${esc(v)}</td>
    </tr>`;

  return `<!doctype html>
<html lang="${esc(o.lang)}"><body style="margin:0;padding:0;background:#eef6f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef6f5;padding:28px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <tr><td style="height:5px;background:#06777d;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:28px 28px 0">
        <div style="font-size:19px;font-weight:700;color:#06777d;letter-spacing:-.01em">Eddo Homestay</div>
      </td></tr>
      <tr><td style="padding:20px 28px 0">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#12312d">${esc(t.greeting(o.name))}</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#12312d">${esc(t.thanks)}</p>
      </td></tr>
      <tr><td style="padding:0 28px">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f3faf9;border-radius:12px;padding:14px 16px">
          <tr><td>
            <table role="presentation" cellpadding="0" cellspacing="0">
              ${o.booking ? row(t.labelBooking, o.booking) : ""}
              ${row(t.labelOrder, o.order)}
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:20px 28px 0">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#3d4f4c">${esc(t.keep)}</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#3d4f4c">${esc(t.ask)}</p>
      </td></tr>
      <tr><td style="padding:0 28px" align="center">
        <a href="${esc(wa)}" style="display:inline-block;background:#06777d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 26px;border-radius:999px">${esc(t.cta)}</a>
      </td></tr>
      <tr><td style="padding:22px 28px 30px">
        <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#12312d">${esc(t.see)}</p>
        <p style="margin:0;font-size:14px;color:#7c8a86">${esc(t.sign)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** The same thing for a reader whose client shows no HTML at all. */
export function guestMailText(o: GuestMailInput) {
  const t = GUEST_MAIL[o.lang];
  /* `null` for the line that may not exist, never `""`: the empty strings here
     are the blank lines between paragraphs, and filtering on falsiness removed
     those too and delivered the whole note as one block. */
  return [
    t.greeting(o.name),
    "",
    t.thanks,
    "",
    o.booking ? `${t.labelBooking}: ${o.booking}` : null,
    `${t.labelOrder}: ${o.order}`,
    "",
    t.keep,
    "",
    t.ask,
    `https://wa.me/${WHATSAPP}`,
    "",
    t.see,
    t.sign,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
