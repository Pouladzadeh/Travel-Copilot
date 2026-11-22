import type { Metadata } from "next";
import { TripView } from "@/components/trip/TripView";

export const metadata: Metadata = { title: "Your trip · HelloWorld" };

export default function TripPage() {
  return <TripView />;
}
