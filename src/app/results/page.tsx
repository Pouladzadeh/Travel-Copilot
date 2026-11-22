import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { decodeRequirements } from "@/lib/requirements";

/** Temporary: the Results screen is the next checkpoint. Shows what Home sent. */
export default async function ResultsPlaceholder({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const reqs = decodeRequirements(p.req);
  return (
    <>
      <SiteHeader className="border-b border-line bg-surface" />
      <main className="mx-auto flex max-w-[var(--container)] flex-col gap-16 px-32 py-64">
        <h1 className="text-heading-l">Results come in the next checkpoint</h1>
        <p className="text-body-l text-fg-secondary">Home sent this search:</p>
        <pre className="rounded-md border border-line bg-surface p-16 text-body-s">
          {JSON.stringify({ ...p, requirements: reqs.map((r) => r.label) }, null, 2)}
        </pre>
        <Link href="/" className="text-label-m text-fg-link hover:underline">
          Back to Home
        </Link>
      </main>
    </>
  );
}
