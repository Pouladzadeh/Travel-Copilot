import { notFound } from "next/navigation";
import { HotelView } from "@/components/hotel/HotelView";
import { HOTELS, hotelById } from "@/lib/hotels";

/** Hotel detail (Figma 14:269). */
export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hotelById(id)) notFound();
  return <HotelView hotelId={id} />;
}

export function generateStaticParams() {
  return HOTELS.map((h) => ({ id: h.id }));
}
