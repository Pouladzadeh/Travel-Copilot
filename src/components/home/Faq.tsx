"use client";

import { useState } from "react";
import { Icon } from "../Icon";

/** "How Travel Copilot works" (Figma 47:572, rows open in state 78:317). */

const QUESTIONS = [
  {
    q: "What does Travel Copilot do?",
    a: "It reads what you ask for, ranks stays against it, and shows the hotel policy, rate rule or guest reviews behind every reason.",
  },
  {
    q: "Can Copilot book or pay for me?",
    a: "No. It checks your booking against your request, then stops. Only you can reserve.",
  },
  {
    q: "What happens when Copilot cannot confirm something?",
    a: "It marks the detail as unconfirmed and tells you how to check it, for example by calling the front desk.",
  },
  {
    q: "What does Copilot know about me?",
    a: "Only what you type in this search. You can see it and delete it in My data.",
  },
  {
    q: "Can I talk to a person instead?",
    a: "Yes. Talk to a person is available at every step, including after you book.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  function toggle(i: number) {
    const next = new Set(open);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setOpen(next);
  }

  return (
    <section className="flex justify-center" aria-labelledby="faq-heading">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-16 px-20 pt-24 pb-24 md:gap-24 md:px-32 md:pt-64 md:pb-32">
        <div className="flex flex-col gap-4">
          <h2 id="faq-heading" className="text-heading-m md:text-heading-l text-fg">
            How Travel Copilot works
          </h2>
          <p className="text-body-m text-fg-secondary hidden md:block">Short answers to what people ask before they use it.</p>
        </div>
        <div className="flex flex-col gap-12">
          {QUESTIONS.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div
                key={item.q}
                className={`flex flex-col gap-8 rounded-lg border p-16 md:px-24 md:py-20 ${
                  isOpen ? "border-line-copilot bg-copilot" : "border-line bg-surface"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    className="flex w-full items-center gap-16 text-left"
                  >
                    <span className="text-body-l md:text-heading-s text-fg flex-1 font-semibold md:font-semibold">{item.q}</span>
                    <span
                      className={`rounded-pill flex size-36 shrink-0 items-center justify-center ${isOpen ? "bg-surface" : "bg-subtle"}`}
                      aria-hidden="true"
                    >
                      <Icon name={isOpen ? "faq-minus" : "faq-plus"} size={16} />
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <p id={`faq-${i}`} className="text-body-l text-fg-secondary w-[820px] max-w-full">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
