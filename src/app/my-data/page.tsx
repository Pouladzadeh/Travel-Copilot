import type { Metadata } from "next";
import { MyDataView } from "@/components/info/MyDataView";

export const metadata: Metadata = { title: "My data · HelloWorld" };

export default function Page() {
  return <MyDataView />;
}
