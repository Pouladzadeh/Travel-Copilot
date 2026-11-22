"use client";

import Link from "next/link";
import { useState } from "react";
import { useCurrentConversation } from "@/lib/copilot/store";
import { Button } from "../Button";
import { ReportDialog } from "../feedback/ReportAnswer";
import { Icon } from "../Icon";
import { Handover } from "../results/Handover";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
import { StatusPill, type PillType } from "../StatusPill";

const STEPS = [
  [
    "It reads your request",
    "Your words become a short list of requirements, such as “arriving after midnight” or “quiet”. You can see the list on every page and change it.",
  ],
  [
    "It checks each stay against the list",
    "For every requirement it looks at the hotel policy, the rate rules and guest reviews. It does not guess when none of them answer the question.",
  ],
  [
    "It orders stays by fit",
    "Stays that meet more of your requirements come first. A confirmed match counts for more than an unconfirmed one. Price breaks ties.",
  ],
  ["It shows its evidence", "Each reason names its source. Anything Copilot could not confirm is marked, with a way for you to check it."],
];
const NEVER = [
  ["Paid placement", "Sponsored stays carry a label and sit outside the best-fit order."],
  ["What a hotel pays us", "Commission is not part of the ranking."],
  ["Who you are", "Copilot uses what you typed for this search, nothing else about you."],
];
const WONT = [
  ["Book or pay for you", "It checks your booking against your request, then stops."],
  ["Pick one hotel for you", "It shows the best fits and the reasons. The choice stays yours."],
  ["Rate how safe a neighborhood is", "It can point you to the hotel’s location and reviews instead."],
];
const LEGEND: [PillType, string, string][] = [
  ["confirmed", "Late check-in confirmed", "A source says so: hotel policy, rate rule or reviews."],
  ["partial", "Mostly quiet", "True for most of the evidence, with known exceptions."],
  ["conditional", "If you call ahead", "True only if you do something first."],
  ["unconfirmed", "Late check-in unconfirmed", "No source answered it. Check before you book."],
  ["danger", "Does not meet: quiet", "A source says the opposite of what you asked for."],
  ["copilot", "Matches your request", "Copilot is pointing at the option that fits."],
  ["wildcard", "Wildcard", "A stay outside your request, shown so you see more than one kind of option."],
  ["sponsored", "Sponsored", "The hotel paid for this spot. It is not part of the ranking."],
];

/** How Copilot ranks stays (Figma 55:570). */
export function HowRanksView() {
  const { conversation } = useCurrentConversation();
  const [reporting, setReporting] = useState(false);
  const [handover, setHandover] = useState(false);

  const list = (rows: string[][], icon: "list-check" | "no") => (
    <ul className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24">
      {rows.map(([t, d]) => (
        <li key={t} className="flex items-start gap-12">
          <Icon name={icon} size={20} />
          <div className="text-body-m flex flex-col gap-2">
            <p className="text-label-m text-fg">{t}</p>
            <p className="text-fg-secondary">{d}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] flex-col gap-32 px-32 pt-40 pb-64">
          <Link
            href={conversation?.resultsHref ?? "/results?destination=Miami&adults=2"}
            className="text-label-m text-fg-link flex items-center gap-[6px] self-start hover:underline"
          >
            <Icon name="arrow-left" size={16} />
            Back to results
          </Link>
          <div className="flex flex-col gap-12">
            <p className="text-label-m text-fg-copilot flex items-center gap-8">
              <Icon name="sparkle" size={20} />
              Travel Copilot
            </p>
            <h1 className="text-display-m text-fg">How Copilot ranks stays</h1>
            <p className="text-body-l text-fg-secondary max-w-[720px]">
              Copilot sorts stays by how well they match what you asked for. This page shows what it checks, what it ignores, and what it
              will not do.
            </p>
          </div>

          <div className="flex items-start gap-32">
            <div className="flex min-w-0 flex-1 flex-col gap-40">
              <section className="flex flex-col gap-16" aria-labelledby="steps">
                <h2 id="steps" className="text-heading-m text-fg">
                  The four steps
                </h2>
                <ol className="flex flex-col gap-16">
                  {STEPS.map(([t, d], i) => (
                    <li key={t} className="border-line bg-surface flex items-start gap-16 rounded-lg border p-24">
                      <span className="rounded-pill border-line-copilot bg-copilot text-label-m text-fg-copilot flex size-36 shrink-0 items-center justify-center border">
                        {i + 1}
                      </span>
                      <div className="flex flex-col gap-4">
                        <h3 className="text-heading-s text-fg">{t}</h3>
                        <p className="text-body-l text-fg-secondary">{d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="flex flex-col gap-16" aria-labelledby="never">
                <h2 id="never" className="text-heading-m text-fg">
                  What never changes the order
                </h2>
                {list(NEVER, "list-check")}
              </section>
              <section className="flex flex-col gap-16" aria-labelledby="wont">
                <h2 id="wont" className="text-heading-m text-fg">
                  What Copilot will not do
                </h2>
                {list(WONT, "no")}
              </section>
            </div>

            <aside className="flex w-[380px] shrink-0 flex-col gap-16">
              <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="legend">
                <h2 id="legend" className="text-heading-s text-fg">
                  What the labels mean
                </h2>
                <dl className="flex flex-col gap-16">
                  {LEGEND.map(([type, label, d]) => (
                    <div key={label} className="flex flex-col items-start gap-8">
                      <dt>
                        <StatusPill type={type} label={label} />
                      </dt>
                      <dd className="text-body-m text-fg-secondary">{d}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              {handover ? (
                <div className="border-line bg-surface rounded-lg border p-24">
                  <Handover requirements={conversation?.requirements ?? []} staysViewed={[]} onBack={() => setHandover(false)} />
                </div>
              ) : (
                <section className="bg-brand-subtle flex flex-col gap-16 rounded-lg p-24" aria-labelledby="wrong">
                  <h2 id="wrong" className="text-heading-s text-fg">
                    Does an answer look wrong?
                  </h2>
                  <p className="text-body-m text-fg-secondary">Report it and a person will review it. You can also talk to someone now.</p>
                  <div className="flex items-center gap-12">
                    <Button variant="secondary" onClick={() => setReporting(true)}>
                      Report an answer
                    </Button>
                    <Button variant="ghost" onClick={() => setHandover(true)}>
                      Talk to a person
                    </Button>
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>
      <SlimFooter />
      {reporting && <ReportDialog onClose={() => setReporting(false)} />}
    </>
  );
}
