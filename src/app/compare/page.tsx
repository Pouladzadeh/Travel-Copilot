import type { Metadata } from "next";
import { CompareView } from "@/components/compare/CompareView";

export const metadata: Metadata = { title: "Compare stays · HelloWorld" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  return <CompareView ids={(ids ?? "").split(",").filter(Boolean)} />;
}
