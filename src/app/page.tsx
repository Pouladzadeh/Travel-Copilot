import { CopilotBand } from "@/components/home/CopilotBand";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { NeedTabs } from "@/components/home/NeedTabs";
import { FeaturedStays, RecentSearch, TrustStrip } from "@/components/home/Sections";
import { SearchProvider } from "@/components/search/searchState";
import { SiteFooter } from "@/components/SiteFooter";
import { decodeRequirements } from "@/lib/requirements";

/**
 * Home (Figma 21:452; filled search state 126:1798).
 * "Change" on Results comes back here with the search filled in.
 */
export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const defaults = p.destination
    ? {
        destination: p.destination,
        checkIn: p.checkIn ?? null,
        checkOut: p.checkOut ?? null,
        adults: Number(p.adults ?? 2) || 2,
        chosen: decodeRequirements(p.req),
      }
    : undefined;
  return (
    <SearchProvider defaults={defaults}>
      <main className="bg-surface">
        <Hero />
        <TrustStrip />
        <RecentSearch />
        <NeedTabs />
        <FeaturedStays />
        <CopilotBand />
        <Faq />
      </main>
      <SiteFooter />
    </SearchProvider>
  );
}
