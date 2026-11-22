import type { Metadata } from "next";
import { HowRanksView } from "@/components/info/HowRanksView";

export const metadata: Metadata = { title: "How Copilot ranks stays · HelloWorld" };

export default function Page() {
  return <HowRanksView />;
}
