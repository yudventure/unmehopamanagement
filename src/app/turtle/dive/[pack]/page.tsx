import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiveDetail } from "@/components/web/dive-detail";
import { Maintenance } from "@/components/web/maintenance";
import { SITE_CONFIG } from "@/lib/site-config";
import { COPY, DEFAULT_LANG, DIVE_KEYS, PROPERTY, type DiveKey } from "@/lib/web-content";

/**
 * A page per dive package.
 *
 * All six are prerendered: there are six of them, they change when the copy
 * changes, and a static file is the right shape for something a guest opens on
 * island signal.
 *
 * The metadata is in the default language only. The page itself switches on a
 * click, but a crawler and a link preview see one language, and English is the
 * one most people arriving here read.
 */

interface Props {
  params: Promise<{ pack: string }>;
}

export function generateStaticParams() {
  return DIVE_KEYS.map((pack) => ({ pack }));
}

const isPack = (v: string): v is DiveKey =>
  (DIVE_KEYS as readonly string[]).includes(v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pack } = await params;
  if (!isPack(pack)) return {};
  const p = COPY[DEFAULT_LANG].dive.packages[pack];
  return {
    title: `${p.name} · ${PROPERTY.name}`,
    description: p.blurb,
    ...(SITE_CONFIG.maintenance ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function DivePackagePage({ params }: Props) {
  const { pack } = await params;
  if (!isPack(pack)) notFound();
  /* After the 404 check, not before: a bad package name is still a bad
     package name while the site is down. */
  if (SITE_CONFIG.maintenance) return <Maintenance />;
  return <DiveDetail pack={pack} />;
}
