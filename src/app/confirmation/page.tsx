import type { Metadata } from "next";
import { ConfirmationView } from "@/components/trip/ConfirmationView";

export const metadata: Metadata = { title: "You’re booked · HelloWorld" };

export default function ConfirmationPage() {
  return <ConfirmationView />;
}
