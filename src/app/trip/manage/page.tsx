import type { Metadata } from "next";
import { ManageView } from "@/components/trip/ManageView";

export const metadata: Metadata = { title: "Manage booking · HelloWorld" };

export default function ManagePage() {
  return <ManageView />;
}
