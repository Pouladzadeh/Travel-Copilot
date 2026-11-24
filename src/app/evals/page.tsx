import type { Metadata } from "next";
import { EvalsView } from "@/components/evals/EvalsView";

export const metadata: Metadata = { title: "How well Copilot follows its rules · HelloWorld" };

export default function Page() {
  return <EvalsView />;
}
