"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { relaxations } from "@/lib/ranking";
import type { Requirement } from "@/lib/requirements";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";

/** Trip bar under the header (Figma 20:473). */
export function TripBar({ destination, summary, changeHref }: { destination: string; summary: string; changeHref: string }) {
  return (
    <div className="border-line bg-surface flex justify-center border-b">
      <div className="flex w-full max-w-[var(--container)] items-center justify-between px-32 py-8">
        <p className="text-label-m text-fg">Stays in {destination}</p>
        <div className="flex items-center gap-16">
          <p className="text-body-m text-fg-secondary">{summary}</p>
          <ButtonLink href={changeHref} variant="secondary">
            Change
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/** Slim footer on Results and later screens (Figma 61:1087). */
export function SlimFooter() {
  return (
    <footer className="border-line bg-surface flex justify-center border-t">
      <div className="flex w-full max-w-[var(--container)] items-center justify-between px-32 py-24">
        <div className="flex items-center gap-24">
          <p className="text-body-s text-fg-secondary">© 2026 HelloWorld</p>
          <p className="text-body-s text-fg-secondary flex items-center gap-[6px]">
            <Icon name="sparkle" size={16} />
            Travel Copilot is an AI assistant. It can be wrong, so anything it could not confirm is marked.
          </p>
        </div>
        <button
          type="button"
          className="rounded-pill border-line text-label-m text-fg hover:bg-subtle flex items-center gap-[6px] border px-12 py-[7px]"
        >
          <Icon name="globe-footer" size={18} />
          English (US) · USD
        </button>
      </div>
    </footer>
  );
}

const SORTS = ["Best fit", "Price: low to high", "Guest rating"] as const;
export type Sort = (typeof SORTS)[number];

/** Sort and filters row (Figma 12:101). Price, Neighborhood and Amenities menus are not designed yet. */
export function SortAndFilters({ sort, onSort, sortDisabled }: { sort: Sort; onSort: (s: Sort) => void; sortDisabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between">
      <div className="relative flex items-center gap-8">
        <RequirementChip state="filter" label={`Sort: ${sortDisabled ? "Price" : sort}`} onClick={() => setOpen(!open)} />
        {open && (
          <ul
            role="menu"
            className="border-line bg-surface absolute top-full left-0 z-20 mt-8 w-[220px] rounded-md border py-8 shadow-[0px_12px_32px_0px_rgba(13,20,48,0.16)]"
          >
            {SORTS.map((s) => (
              <li key={s}>
                <button
                  role="menuitemradio"
                  aria-checked={s === sort}
                  disabled={sortDisabled && s === "Best fit"}
                  onClick={() => {
                    onSort(s);
                    setOpen(false);
                  }}
                  className={`text-body-m hover:bg-subtle w-full px-16 py-8 text-left disabled:opacity-50 ${s === sort ? "text-fg-link font-medium" : "text-fg"}`}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <RequirementChip state="filter" label="Price" />
        <RequirementChip state="filter" label="Neighborhood" />
        <RequirementChip state="filter" label="Amenities" />
      </div>
      <Link href="/how-copilot-ranks" className="text-label-m text-fg-copilot underline hover:no-underline">
        How Copilot ranks stays
      </Link>
    </div>
  );
}

/** Compare bar · sticky (Figma 61:1100). Up to three stays. */
export function CompareBar({ names, ids, onClear }: { names: string[]; ids: string[]; onClear: () => void }) {
  if (ids.length === 0) return null;
  const n = ids.length;
  return (
    <div className="bg-inverse sticky bottom-20 z-20 flex items-center gap-16 rounded-lg py-12 pr-12 pl-20 shadow-[0px_12px_32px_0px_rgba(13,20,48,0.3)]">
      <div className="text-fg-on-brand flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-label-m">
          {n} {n === 1 ? "stay" : "stays"} selected
        </p>
        <p className="text-body-s truncate opacity-75">{n === 1 ? `${names[0]} · pick one more to compare` : names.join(" · ")}</p>
      </div>
      <button type="button" onClick={onClear} className="text-label-m text-fg-on-brand hover:underline">
        Clear
      </button>
      {n >= 2 ? <ButtonLink href={`/compare?ids=${ids.join(",")}`}>Compare {n} stays</ButtonLink> : <Button disabled>Compare</Button>}
    </div>
  );
}

/** Results · loading (Figma 75:69): skeleton cards. */
export function LoadingList() {
  return (
    <div className="flex flex-col gap-16" aria-busy="true" aria-label="Finding stays">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-line bg-surface flex h-[260px] overflow-hidden rounded-lg border">
          <div className="bg-subtle w-[220px] animate-pulse" />
          <div className="flex flex-1 flex-col gap-12 p-20">
            <div className="bg-subtle h-[20px] w-[260px] animate-pulse rounded-sm" />
            <div className="bg-subtle h-[14px] w-[140px] animate-pulse rounded-sm" />
            <div className="bg-subtle h-[56px] w-full animate-pulse rounded-md" />
            <div className="bg-subtle h-[20px] w-[110px] animate-pulse rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Copilot panel while loading: what it is checking, with progress. */
export function LoadingSteps({ total }: { total: number }) {
  const [checked, setChecked] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setChecked((c) => Math.min(total, c + 1)), 70);
    return () => clearInterval(t);
  }, [total]);
  const steps = ["Read your request", `Checking hotel policies · ${checked} of ${total}`, "Reading guest reviews"];
  const done = checked >= total ? 2 : 1;
  return (
    <ul className="flex flex-col gap-8" aria-live="polite">
      {steps.map((s, i) => (
        <li key={i} className={`text-body-m flex items-center gap-8 ${i <= done ? "text-fg" : "text-fg-tertiary"}`}>
          <span
            aria-hidden="true"
            className={`rounded-pill size-[10px] border-2 ${i < done ? "border-icon-copilot bg-icon-copilot" : i === done ? "border-icon-copilot" : "border-line-strong"}`}
          />
          {s}
        </li>
      ))}
    </ul>
  );
}

/** Results · no match (Figma 75:153). Nothing is changed until the traveler picks. */
export function NoMatch({
  requirements,
  total,
  onApply,
  onShowAll,
}: {
  requirements: Requirement[];
  total: number;
  onApply: (r: Requirement[]) => void;
  onShowAll: () => void;
}) {
  const options = relaxations(requirements);
  return (
    <div className="flex flex-col gap-24">
      <div className="border-line bg-surface flex flex-col rounded-lg border px-16 py-20">
        <p className="text-heading-s text-fg px-0 pb-16">Change one thing to see stays</p>
        {options.map((o) => (
          <div key={o.label} className="border-line flex items-center gap-16 border-t py-12">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-label-m text-fg">{o.label}</p>
              <p className="text-body-s text-fg-secondary">{o.detail}</p>
            </div>
            <Button variant="secondary" disabled={o.count === 0} onClick={() => onApply(o.apply)}>
              Show {o.count} {o.count === 1 ? "stay" : "stays"}
            </Button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onShowAll} className="text-label-m text-fg-link self-start hover:underline">
        Show all {total} stays anyway
      </button>
    </div>
  );
}
