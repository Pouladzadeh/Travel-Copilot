"use client";

import Image from "next/image";
import { useState } from "react";
import { DESTINATIONS, NEED_TABS } from "@/lib/sample-data";

/**
 * "Find stays by what you need" (Figma 24:540, other tabs in state 78:240).
 * Selecting a tab changes the count under each city and the footnote.
 */
export function NeedTabs() {
  const [selected, setSelected] = useState(NEED_TABS[0].id);
  const tab = NEED_TABS.find((t) => t.id === selected)!;

  return (
    <section className="flex justify-center" aria-labelledby="needs-heading">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-24 px-32 pb-32 pt-64">
        <div className="flex flex-col gap-4">
          <h2 id="needs-heading" className="text-heading-l text-fg">
            Find stays by what you need
          </h2>
          <p className="text-body-m text-fg-secondary">
            Pick what matters for this trip. We show places with stays that match.
          </p>
        </div>

        <div role="tablist" aria-label="What you need" className="flex gap-8">
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
                className={`rounded-pill px-16 py-8 text-label-m ${
                  isSel ? "bg-inverse text-fg-on-brand" : "border border-line bg-surface text-fg hover:bg-subtle"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div id="need-panel" role="tabpanel" aria-labelledby={`need-tab-${selected}`} className="flex flex-col gap-24">
          <ul className="flex gap-24">
            {DESTINATIONS.map((d) => (
              <li
                key={d.city}
                className="relative flex h-[380px] min-w-0 flex-1 flex-col justify-end gap-4 overflow-hidden rounded-lg p-20"
              >
                <Image src={d.photo} alt="" fill sizes="286px" className="object-cover" />
                <span className="absolute inset-0 bg-gradient-to-b from-[rgba(10,15,26,0)] to-[rgba(10,15,26,0.75)]" aria-hidden="true" />
                <p className="relative text-heading-m text-fg-on-brand">{d.city}</p>
                <p className="relative text-body-m text-fg-on-brand opacity-90">{tab.counts[d.city]}</p>
              </li>
            ))}
          </ul>
          <p className="text-body-s text-fg-tertiary">{tab.footnote}</p>
        </div>
      </div>
    </section>
  );
}
