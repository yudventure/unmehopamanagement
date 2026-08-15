import raw from "../../content/site.json";

/**
 * The parts of the website an owner should be able to change without touching
 * code: who enquiries reach, and what the dive centre charges.
 *
 * It lives in `content/site.json` rather than in a database, because there is
 * no database. The CMS tab writes the file back through the GitHub API, which
 * makes Vercel rebuild, which publishes the change. That is slower than a
 * database — a minute or so — but it is durable, versioned, and reviewable in
 * the repository's own history, which for prices that move twice a year is a
 * better trade than a server nobody is watching.
 *
 * Everything else the site says stays in `web-content.ts`. Copy in two
 * languages, with its line breaks and its tone, is edited far better in a code
 * review than in a textarea.
 */

export interface SiteConfig {
  contact: {
    /** Digits only, country code first. The number every Send button opens. */
    whatsapp: string;
    /** Shown to guests in the footer. */
    email: string;
    /** Where a new enquiry is emailed. Not shown anywhere public. */
    ownerEmail: string;
  };
  /** Rupiah, per the unit named in the copy for that package. */
  divePrices: Record<string, number>;
  updatedAt: string;
  updatedBy: string;
}

export const SITE_CONFIG = raw as SiteConfig;

/** The shape the CMS edits and the API validates against. */
export function isSiteConfig(v: unknown): v is SiteConfig {
  if (!v || typeof v !== "object") return false;
  const c = v as SiteConfig;
  return (
    !!c.contact &&
    typeof c.contact.whatsapp === "string" &&
    typeof c.contact.email === "string" &&
    typeof c.contact.ownerEmail === "string" &&
    !!c.divePrices &&
    Object.values(c.divePrices).every((n) => typeof n === "number" && n >= 0)
  );
}
