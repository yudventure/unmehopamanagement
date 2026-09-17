import raw from "../../content/site.json";
import type { PublicSite } from "./site-domains";

/**
 * The parts of the website an owner should be able to change without touching
 * code: who enquiries reach, and what the dive centre charges.
 *
 * It lives in `content/site.json` rather than in a database, because there is
 * no database. The CMS tab writes the file back through the GitHub API, which
 * makes the host rebuild, which publishes the change. That is slower than a
 * database, a minute or so, but it is durable, versioned, and reviewable in
 * the repository's own history, which for prices that move twice a year is a
 * better trade than a server nobody is watching.
 *
 * Everything else the site says stays in `web-content.ts`. Copy in two
 * languages, with its line breaks and its tone, is edited far better in a code
 * review than in a textarea.
 *
 * ## Shared by default, separable per site
 *
 * This file began when there was one public site. There are two now, on two
 * domains, and a single set of contact details stopped being a simplification
 * and became a bug: a guest reading eddohomestay.com was shown an email
 * address at turtlehomestay.com, and their enquiry was delivered to whoever
 * answers Turtle's inbox.
 *
 * So each site can now override what it needs, and inherits what it does not.
 * An override that is blank is not an override, which matters: it means the
 * two can be separated one field at a time, and a half-filled form leaves the
 * site working rather than showing an empty footer. `maintenance` is the
 * exception, being a boolean with no blank value, so absent means inherit and
 * present means decide.
 */

export interface SiteContact {
  /** Digits only, country code first. The number every Send button opens. */
  whatsapp: string;
  /** Shown to guests in the footer. */
  email: string;
  /** Where a new enquiry is emailed. Not shown anywhere public. */
  ownerEmail: string;
}

/**
 * Profile links for the footer. Empty means the icon is not drawn at all,
 * which is right: an icon linking to nothing is worse than no icon.
 */
export interface SiteSocial {
  facebook: string;
  instagram: string;
  tiktok: string;
}

/**
 * What one public site may set for itself. Every field is optional, and a
 * string left empty inherits rather than blanking the shared value.
 */
export interface SiteOverride {
  contact?: Partial<SiteContact>;
  social?: Partial<SiteSocial>;
  /** Absent inherits the shared switch. Present decides for this site alone. */
  maintenance?: boolean;
}

export interface SiteConfig {
  /** The shared values, and what Turtle used before there was a second site. */
  contact: SiteContact;
  social: SiteSocial;
  /** Rupiah, per the unit named in the copy for that package. Turtle only. */
  divePrices: Record<string, number>;
  /**
   * Puts every public page behind a holding page. The manager at `/` is not
   * touched: the owner has to keep working while the site is down.
   *
   * Read at build time like the rest of this file, so flipping it takes the
   * same minute a price change takes. That is fine for planned work and the
   * wrong tool for an emergency; the CMS says so rather than implying the
   * switch is instant.
   */
  maintenance: boolean;
  /**
   * The two years the profile page talks about. Null until an owner fills
   * them in, and the page simply does not state a year while they are, which
   * is right, because nobody here knows them. A guessed founding year is the
   * kind of small invention that survives for years. Turtle only.
   */
  founded: {
    homestay: number | null;
    diveCenter: number | null;
  };
  /** Per-site overrides. Absent or blank means the shared value above. */
  sites?: Partial<Record<PublicSite, SiteOverride>>;
  updatedAt: string;
  updatedBy: string;
}

/* Fields added after the first config was written, so a file saved by an
   earlier CMS will not have them. Defaulted rather than required, so an old
   file keeps working instead of failing the type guard on save. */
const parsed = raw as Partial<SiteConfig> &
  Omit<SiteConfig, "founded" | "social" | "maintenance" | "sites">;

export const SITE_CONFIG: SiteConfig = {
  ...parsed,
  founded: parsed.founded ?? { homestay: null, diveCenter: null },
  social: parsed.social ?? { facebook: "", instagram: "", tiktok: "" },
  /* Absent means live. A file written before this field existed must not take
     the site down on the next deploy. */
  maintenance: parsed.maintenance === true,
  sites: parsed.sites ?? {},
};

/** A trimmed override value, or null when it is blank and should inherit. */
function set(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

/** What one public site actually uses, after inheritance is applied. */
export interface ResolvedSite {
  contact: SiteContact;
  social: SiteSocial;
  maintenance: boolean;
}

/**
 * The configuration one public site should read.
 *
 * Call this rather than reaching into `SITE_CONFIG.contact` directly. The
 * shared object is still the fallback and still correct for Turtle today, but
 * reading it by name is how a value belonging to one homestay ends up printed
 * on the other one's page.
 */
export function siteConfig(site: PublicSite): ResolvedSite {
  const own = SITE_CONFIG.sites?.[site] ?? {};
  return {
    contact: {
      whatsapp: set(own.contact?.whatsapp) ?? SITE_CONFIG.contact.whatsapp,
      email: set(own.contact?.email) ?? SITE_CONFIG.contact.email,
      ownerEmail: set(own.contact?.ownerEmail) ?? SITE_CONFIG.contact.ownerEmail,
    },
    social: {
      facebook: set(own.social?.facebook) ?? SITE_CONFIG.social.facebook,
      instagram: set(own.social?.instagram) ?? SITE_CONFIG.social.instagram,
      tiktok: set(own.social?.tiktok) ?? SITE_CONFIG.social.tiktok,
    },
    maintenance:
      typeof own.maintenance === "boolean"
        ? own.maintenance
        : SITE_CONFIG.maintenance,
  };
}

/**
 * Whether a site is running on a borrowed value rather than its own.
 *
 * Used by the CMS to say so out loud. Inheriting is a reasonable state to be
 * in and a bad state to be in by accident, and the difference between the two
 * is whether anyone was told.
 */
export function inheritsFrom(site: PublicSite): (keyof SiteContact)[] {
  const own = SITE_CONFIG.sites?.[site]?.contact ?? {};
  return (["whatsapp", "email", "ownerEmail"] as const).filter(
    (k) => set(own[k]) === null,
  );
}

const isStr = (v: unknown) => typeof v === "string";

/** Per-site overrides are all optional, so this checks shape, not presence. */
function isOverride(v: unknown): boolean {
  if (v === undefined) return true;
  if (!v || typeof v !== "object") return false;
  const o = v as SiteOverride;
  if (o.contact !== undefined) {
    if (!o.contact || typeof o.contact !== "object") return false;
    if (!Object.values(o.contact).every(isStr)) return false;
  }
  if (o.social !== undefined) {
    if (!o.social || typeof o.social !== "object") return false;
    if (!Object.values(o.social).every(isStr)) return false;
  }
  if (o.maintenance !== undefined && typeof o.maintenance !== "boolean") {
    return false;
  }
  return true;
}

/** The shape the CMS edits and the API validates against. */
export function isSiteConfig(v: unknown): v is SiteConfig {
  if (!v || typeof v !== "object") return false;
  const c = v as SiteConfig;
  return (
    !!c.contact &&
    isStr(c.contact.whatsapp) &&
    isStr(c.contact.email) &&
    isStr(c.contact.ownerEmail) &&
    !!c.divePrices &&
    Object.values(c.divePrices).every((n) => typeof n === "number" && n >= 0) &&
    (c.social === undefined ||
      (typeof c.social === "object" &&
        c.social !== null &&
        [c.social.facebook, c.social.instagram, c.social.tiktok].every(isStr))) &&
    (c.maintenance === undefined || typeof c.maintenance === "boolean") &&
    (c.sites === undefined ||
      (typeof c.sites === "object" &&
        c.sites !== null &&
        Object.values(c.sites).every(isOverride))) &&
    (c.founded === undefined ||
      (typeof c.founded === "object" &&
        c.founded !== null &&
        [c.founded.homestay, c.founded.diveCenter].every(
          (y) => y === null || (typeof y === "number" && y > 1900 && y < 2100),
        )))
  );
}
