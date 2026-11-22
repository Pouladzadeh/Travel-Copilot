import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingView } from "@/components/booking/BookingView";
import { hotelById } from "@/lib/hotels";
import { SAMPLE_TRIP } from "@/lib/sample-data";

export const metadata: Metadata = { title: "Review and reserve · HelloWorld" };

type Search = { hotel?: string; rate?: string; checkIn?: string; checkOut?: string; req?: string; scenario?: string };
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function BookingPage({ searchParams }: { searchParams: Promise<Search> }) {
  const s = await searchParams;
  const hotel = hotelById(s.hotel ?? "");
  if (!hotel) notFound();
  const checkIn = s.checkIn && ISO.test(s.checkIn) ? s.checkIn : SAMPLE_TRIP.checkIn;
  const checkOut = s.checkOut && ISO.test(s.checkOut) && s.checkOut > checkIn ? s.checkOut : SAMPLE_TRIP.checkOut;
  return (
    <BookingView
      hotel={hotel}
      rate={s.rate === "flexible" ? "flexible" : "lowest"}
      checkIn={checkIn}
      checkOut={checkOut}
      req={s.req}
      scenario={s.scenario}
    />
  );
}
