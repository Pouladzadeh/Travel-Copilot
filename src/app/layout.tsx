import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelloWorld · Travel Copilot",
  description:
    "Portfolio project: a hotel booking site with Travel Copilot, an assistant that checks stays against your requirements and shows its evidence. All hotels, prices and bookings are sample data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-page text-fg font-sans">{children}</body>
    </html>
  );
}
