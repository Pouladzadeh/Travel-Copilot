import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Temporary placeholder until the Home screen is built (next checkpoint). */
export default function Page() {
  return (
    <main className="mx-auto flex max-w-[var(--container)] flex-col gap-24 px-[var(--gutter)] py-64">
      <Logo />
      <p className="text-body-l text-fg-secondary">
        Travel Copilot rebuild in progress. Home comes next.
      </p>
      <Link href="/design-system" className="text-label-m text-fg-link hover:underline">
        View the components
      </Link>
    </main>
  );
}
