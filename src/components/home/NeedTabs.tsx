"use client";

import Image from "next/image";
import { useState } from "react";
import { DESTINATIONS, NEED_TABS } from "@/lib/sample-data";

/**
 * City tiles are not links (Peri, 2026-11-21): hover only.
 * "Find stays by what you need" (Figma 24:540, other tabs in state 78:240).
 * Selecting a tab changes the count under each city and the footnote.
 */
export function NeedTabs() {
  const [selected, setSelected] = useState(NEED_TABS[0].id);
  const tab = NEED_TABS.find((t) => t.id === selected)!;

  return (
    <section className="flex justify-center" aria-labelledby="needs-heading">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-16 px-20 pt-24 pb-24 md:gap-24 md:px-32 md:pt-64 md:pb-32">
        <div className="flex flex-col gap-4">
          <h2 id="needs-heading" className="text-heading-m md:text-heading-l text-fg">
            Find stays by what you need
          </h2>
          <p className="text-body-m text-fg-secondary">Pick what matters for this trip. We show places with stays that match.</p>
        </div>

        <div
          role="tablist"
          aria-label="What you need"
          className="-mx-20 flex gap-8 overflow-x-auto px-20 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {NEED_TABS.map((t) => {
            const isSel = t.id === selected;
            return (
              <button
                key={t.id}
                role="tab"
                id={`need-tab-${t.id}`}
                aria-selected={isSel}
                aria-controls="need-panel"
                onClick={() => setSelected(t.id)}
                className={`rounded-pill text-label-m shrink-0 px-16 py-8 whitespace-nowrap ${
                  isSel ? "bg-inverse text-fg-on-brand" : "border-line bg-surface text-fg hover:bg-subtle border"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div id="need-panel" role="tabpanel" aria-labelledby={`need-tab-${selected}`} className="flex flex-col gap-16 md:gap-24">
          {/* Phones and tablets swipe through the cities (Mobile · Home 91:1219). */}
          <ul className="-mx-20 flex snap-x snap-mandatory gap-12 overflow-x-auto px-20 pb-4 md:-mx-32 md:px-32 lg:mx-0 lg:gap-24 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {DESTINATIONS.map((d) => (
              <li
                key={d.city}
                className="group relative flex h-[300px] w-[240px] shrink-0 snap-start flex-col justify-end gap-4 overflow-hidden rounded-lg p-20 transition-shadow duration-300 hover:shadow-[0px_12px_32px_0px_rgba(13,20,48,0.18)] lg:h-[380px] lg:w-auto lg:min-w-0 lg:flex-1 lg:shrink"
              >
                <Image
                  src={d.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 286px, 240px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <span className="absolute inset-0 bg-gradient-to-b from-[rgba(10,15,26,0)] to-[rgba(10,15,26,0.75)]" aria-hidden="true" />
                <p className="text-heading-m text-fg-on-brand relative">{d.city}</p>
                <p className="text-body-m text-fg-on-brand relative opacity-90">{tab.counts[d.city]}</p>
              </li>
            ))}
          </ul>
          <p className="text-body-s text-fg-tertiary">{tab.footnote}</p>
        </div>
      </div>
    </section>
  );
}
