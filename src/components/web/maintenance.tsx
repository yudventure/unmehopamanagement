"use client";

import { useEffect } from "react";

import { HeroScene } from "@/components/web/scenes";
import { MailIcon, WhatsAppIcon } from "@/components/web/icons";
import { useLang } from "@/hooks/use-site-prefs";
import { LangSwitch } from "@/components/web/lang-switch";
import { COPY, EMAIL, PROPERTY, WHATSAPP, waLink } from "@/lib/web-content";

/**
 * What stands in for every public page while the switch in the CMS is on.
 *
 * It carries the WhatsApp number and the email address, and that is the point
 * of it. A holding page that says only "back soon" turns a guest who arrived
 * ready to book into a guest who leaves, and the homestay is still very much
 * open while its website is not. The two buttons are the page.
 *
 * The language switch stays, because the reader who most needs the phone
 * number may not read the one it opens in.
 *
 * No enquiry form: it posts to a route that expects the site around it, and a
 * form is the wrong promise on a page that exists because things are being
 * moved about. WhatsApp and email both reach the same family and neither
 * depends on this deploy working.
 */
export function Maintenance() {
  const { lang, pickLang } = useLang();
  const t = COPY[lang];
  const m = t.maintenance;

  /* The document says which language it is in, the way the real pages do.
     Without this the holding page kept whatever the root layout was rendered
     with — a page written in German, announced to a screen reader and to a
     translation tool as Indonesian. It was wrong with two languages and is
     wrong five more ways now. */
  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  const button =
    "inline-flex items-center justify-center gap-[9px] rounded-full px-[22px] py-[13px] text-[14px] font-medium no-underline transition-colors hover:no-underline";

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-ink">
      {/* The same drawn hero the real page falls back to, so a deploy with no
          photograph still has a sea behind this rather than a black field. */}
      <HeroScene className="absolute inset-0 h-full w-full object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/hero.jpg")' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,26,24,.55)_0%,rgba(9,26,24,.72)_55%,rgba(9,26,24,.92)_100%)]"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-16 text-center md:px-8">
        <span className="block h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={`Logo ${PROPERTY.name}`}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </span>

        <div className="mt-5 font-mono text-[11px] tracking-[.1em] text-white/75 uppercase">
          {m.eyebrow}
        </div>
        <h1 className="m-0 mt-3 max-w-[16ch] text-[clamp(30px,5.5vw,54px)] leading-[1.06] font-bold tracking-[-.03em] whitespace-pre-line text-white">
          {m.title}
        </h1>
        <p className="mt-5 max-w-[520px] text-[14.5px] leading-[1.65] text-white/85">
          {m.body}
        </p>

        <div className="mt-8 font-mono text-[10.5px] tracking-[.09em] text-white/70 uppercase">
          {m.contactLead}
        </div>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={waLink(`Halo ${PROPERTY.name}`)}
            target="_blank"
            rel="noreferrer"
            className={`${button} bg-white text-ink hover:bg-surface-hover`}
          >
            <span className="block h-[17px] w-[17px] shrink-0">
              <WhatsAppIcon />
            </span>
            {m.whatsapp}
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className={`${button} border border-white/45 bg-white/12 text-white hover:border-white/70 hover:bg-white/22`}
          >
            <span className="block h-[16px] w-[16px] shrink-0">
              <MailIcon />
            </span>
            {m.email}
          </a>
        </div>

        <div className="mt-5 font-mono text-[12.5px] text-white/75">
          +{WHATSAPP} · {EMAIL}
        </div>

        {/* The same control the site's header carries. It used to be a copy
            of it, rebuilt small, which is how this page kept two languages for
            a while after the site had seven. */}
        <div className="mt-9">
          <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} align="left" />
        </div>
      </div>
    </main>
  );
}
