import type { Metadata } from "next";
import { ReportPage } from "@/components/info/FormPage";

export const metadata: Metadata = { title: "Report an answer · HelloWorld" };

export default async function Page({ searchParams }: { searchParams: Promise<{ answer?: string }> }) {
  const { answer } = await searchParams;
  return <ReportPage answerId={answer} />;
}
