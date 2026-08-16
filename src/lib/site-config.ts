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
  /**
   * The two years the profile page talks about. Null until an owner fills
   * them in, and the page simply does not state a year while they are —
   * which is right, because nobody here knows them. A guessed founding year
   * is the kind of small invention that survives for years.
   */
  founded: {
    homestay: number | null;
    diveCenter: number | null;
  };
  updatedAt: string;
  updatedBy: string;
}

/* `founded` was added after the first config was written, so a file saved by
   an earlier CMS will not have it. Defaulted rather than required, so an old
   file keeps working instead of failing the type guard on save. */
const parsed = raw as Partial<SiteConfig> & Omit<SiteConfig, "founded">;
export const SITE_CONFIG: SiteConfig = {
  ...parsed,
  founded: parsed.founded ?? { homestay: null, diveCenter: null },
};

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
    Object.values(c.divePrices).every((n) => typeof n === "number" && n >= 0) &&
    (c.founded === undefined ||
      (typeof c.founded === "object" &&
        c.founded !== null &&
        [c.founded.homestay, c.founded.diveCenter].every(
          (y) => y === null || (typeof y === "number" && y > 1900 && y < 2100),
        )))
  );
}
