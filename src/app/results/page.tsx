import { ResultsView } from "@/components/results/ResultsView";

/** Results with the Copilot panel (Figma 12:62). */
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  return (
    <ResultsView
      search={{
        destination: p.destination || "Miami",
        checkIn: p.checkIn,
        checkOut: p.checkOut,
        adults: Number(p.adults ?? 2) || 2,
        children: Number(p.children ?? 0) || 0,
        rooms: Number(p.rooms ?? 1) || 1,
        q: p.q,
        req: p.req,
        copilot: p.copilot,
      }}
    />
  );
}
