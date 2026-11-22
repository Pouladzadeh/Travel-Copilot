import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageHotelPage } from "@/components/info/FormPage";
import { hotelById } from "@/lib/hotels";

export const metadata: Metadata = { title: "Message the hotel · HelloWorld" };

export default async function Page({ searchParams }: { searchParams: Promise<{ hotel?: string; draft?: string; kind?: string }> }) {
  const s = await searchParams;
  if (!hotelById(s.hotel ?? "")) notFound();
  return <MessageHotelPage hotelId={s.hotel!} draft={s.draft?.slice(0, 2000)} kind={s.kind === "request" ? "request" : undefined} />;
}
