import { CopilotBand } from "@/components/home/CopilotBand";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { NeedTabs } from "@/components/home/NeedTabs";
import { FeaturedStays, RecentSearch, TrustStrip } from "@/components/home/Sections";
import { SearchProvider } from "@/components/search/searchState";
import { SiteFooter } from "@/components/SiteFooter";

/** Home (Figma 21:452; filled search state 126:1798). */
export default function HomePage() {
  return (
    <SearchProvider>
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
