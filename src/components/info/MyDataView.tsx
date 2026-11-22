"use client";

import { useState } from "react";
import { updateBooking, useBooking, useHydrated } from "@/lib/bookingRecord";
import { removeRequirement } from "@/lib/copilot/changes";
import { clearConversation, useCurrentConversation } from "@/lib/copilot/store";
import { guestCount, proseRange } from "@/lib/dates";
import { buildResults } from "@/lib/ranking";
import { decodeRequirements, requirementSource } from "@/lib/requirements";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { saveSettings, useRemembered, useSettings, type CopilotSettings } from "@/lib/settings";
import { download } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";
import { Handover } from "../results/Handover";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
import { Toggle } from "../Toggle";

const SETTINGS: { key: keyof CopilotSettings; title: string; text: string }[] = [
  {
    key: "remember",
    title: "Remember my preferences for next time",
    text: "Off: each search starts fresh. On: Copilot suggests your usual requirements, and you confirm them.",
  },
  {
    key: "improve",
    title: "Use my searches to improve Copilot",
    text: "Off by default. Your name, contact and payment details are never included.",
  },
  { key: "wildcard", title: "Show stays outside my request", text: "Adds a labeled wildcard so you see more than one kind of option." },
];

/** My data (Figma 56:590). */
export function MyDataView() {
  const hydrated = useHydrated();
  const { conversation, update } = useCurrentConversation();
  const booking = useBooking();
  const settings = useSettings();
  const remembered = decodeRequirements(useRemembered());
  const [confirm, setConfirm] = useState<"search" | "all" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [handover, setHandover] = useState(false);

  const reqs = conversation?.requirements ?? [];
  const search = conversation?.search;

  function remove(kind: (typeof reqs)[number]["kind"]) {
    const r = removeRequirement(reqs, kind);
    const before = buildResults(reqs).fitting.length;
    const after = buildResults(r.after).fitting.length;
    update((c) => ({ ...c, requirements: r.after, items: [...c.items, ...r.items], suggestions: [] }));
    setStatus(`Removed. ${after} ${after === 1 ? "stay fits" : "stays fit"} now (${before} before). Your results are updated.`);
  }

  function exportData() {
    const data = {
      note: "Travel Copilot sample app. Everything here is invented sample data, kept only in this browser.",
      exportedAt: new Date().toISOString(),
      settings,
      rememberedRequirements: remembered.map((r) => r.label),
      search: conversation
        ? {
            search: conversation.search,
            whatYouTyped: conversation.openingText ?? null,
            requirements: conversation.requirements.map((r) => r.label),
            conversation: conversation.items.flatMap((i) =>
              i.type === "traveler" ? [{ from: "you", text: i.text }] : i.type === "copilot" ? [{ from: "copilot", text: i.text }] : [],
            ),
          }
        : null,
      // Bookings are listed for completeness; card details are never kept, only the last four digits.
      booking: booking ?? null,
    };
    download("my-travel-copilot-data.json", "application/json", JSON.stringify(data, null, 2));
  }

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] flex-col gap-24 px-20 pt-24 pb-40 md:gap-32 md:px-32 md:pt-40 md:pb-64">
          <div className="flex flex-col gap-12">
            <h1 className="text-fg text-[32px] leading-[38px] font-bold tracking-[-0.4px] md:text-[40px] md:leading-[46px] md:tracking-[-1px]">
              My data
            </h1>
            <p className="text-body-l text-fg-secondary max-w-[720px]">
              See what Travel Copilot holds about you, change it, or delete it. Nothing here affects bookings you have already made.
            </p>
          </div>

          {status && (
            <p role="status" className="bg-confirmed text-body-m text-fg flex items-start gap-8 rounded-md p-16">
              <Icon name="pill-check" size={16} />
              {status}
            </p>
          )}

          <div className="flex flex-col items-start gap-24 md:gap-32 lg:flex-row">
            <div className="flex w-full min-w-0 flex-1 flex-col gap-16 md:gap-24">
              <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="this-search">
                <div className="flex flex-col gap-4">
                  <h2 id="this-search" className="text-heading-s text-fg">
                    From this search
                  </h2>
                  {search && (
                    <p className="text-body-m text-fg-secondary">
                      {search.destination} · {search.checkIn && search.checkOut ? proseRange(search.checkIn, search.checkOut) : "No dates"}{" "}
                      · {guestCount(search.adults, search.children)}
                    </p>
                  )}
                </div>
                {!hydrated ? null : reqs.length === 0 ? (
                  <p className="border-line text-body-m text-fg-secondary border-t pt-16">
                    {conversation ? "No requirements in this search." : "Copilot holds nothing from a search right now."}
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {reqs.map((r) => {
                      const said = requirementSource(conversation?.openingText, r.kind);
                      return (
                        <li key={r.kind} className="border-line flex items-center gap-16 border-t py-16">
                          <div className="flex min-w-0 flex-1 flex-col items-start gap-8">
                            <RequirementChip label={r.label} onClick={() => remove(r.kind)} />
                            <p className="text-body-m text-fg-secondary">
                              {said ? `You wrote: “${said}”` : "Added from a suggestion or by Copilot after you asked."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(r.kind)}
                            className="text-label-m text-fg-link hover:underline"
                            aria-label={`Remove ${r.label}`}
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="border-line flex flex-wrap items-center justify-between gap-x-16 gap-y-8 border-t pt-16">
                  <p className="text-body-s text-fg-tertiary">Removing a requirement updates your results right away.</p>
                  {conversation && confirm !== "search" && (
                    <Button variant="ghost" onClick={() => setConfirm("search")}>
                      Clear this search
                    </Button>
                  )}
                </div>
                {confirm === "search" && (
                  <div className="bg-danger flex flex-col gap-12 rounded-md p-16" role="alertdialog" aria-labelledby="clear-q">
                    <p id="clear-q" className="text-label-m text-fg">
                      Clear this search? Your requirements and the conversation are deleted. This cannot be undone.
                    </p>
                    <div className="flex gap-8">
                      <Button
                        onClick={() => {
                          clearConversation();
                          setConfirm(null);
                          setStatus("Cleared. Copilot holds nothing from this search.");
                        }}
                      >
                        Clear search
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirm(null)}>
                        Keep it
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="keep">
                <h2 id="keep" className="text-heading-s text-fg">
                  What Copilot may keep and use
                </h2>
                <ul className="flex flex-col">
                  {SETTINGS.map((s) => (
                    <li key={s.key} className="border-line flex items-center gap-24 border-t py-16">
                      <div className="text-body-m flex min-w-0 flex-1 flex-col gap-2">
                        <p id={`set-${s.key}`} className="text-label-m text-fg">
                          {s.title}
                        </p>
                        <p className="text-fg-secondary">{s.text}</p>
                      </div>
                      <Toggle
                        label=""
                        ariaLabelledBy={`set-${s.key}`}
                        checked={settings[s.key]}
                        onChange={(on) => saveSettings({ ...settings, [s.key]: on })}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="dl">
                <h2 id="dl" className="text-heading-s text-fg">
                  Download or delete
                </h2>
                <p className="text-body-m text-fg-secondary">
                  Deleting removes saved preferences and search history. Your bookings stay in Trips.
                </p>
                {confirm === "all" ? (
                  <div className="bg-danger flex flex-col gap-12 rounded-md p-16" role="alertdialog" aria-labelledby="all-q">
                    <p id="all-q" className="text-label-m text-fg">
                      Delete everything Copilot holds? Settings go back to their defaults and your search and conversation are deleted.
                      Bookings stay in Trips. This cannot be undone.
                    </p>
                    <div className="flex gap-8">
                      <Button
                        onClick={() => {
                          clearConversation();
                          saveSettings(null);
                          updateBooking((b) => ({ ...b, requirements: "", askedAboutCancelling: false }));
                          setConfirm(null);
                          setStatus("Deleted. Copilot holds nothing about you now. Your bookings are still in Trips.");
                        }}
                      >
                        Delete everything
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirm(null)}>
                        Keep my data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-12">
                    <Button variant="secondary" onClick={exportData}>
                      Download my data
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfirm("all")}
                      className="bg-danger text-label-m text-fg-danger rounded-md px-20 py-12 hover:brightness-95"
                    >
                      Delete everything
                    </button>
                  </div>
                )}
              </section>
              <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE} Everything on this page is kept only in this browser.</p>
            </div>

            <aside className="flex w-full shrink-0 flex-col gap-16 lg:w-[380px]">
              <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="never">
                <h2 id="never" className="text-heading-s text-fg">
                  What Copilot never sees
                </h2>
                <ul className="flex flex-col gap-16">
                  {[
                    ["Payment details", "Card numbers stay with the payment form."],
                    ["ID documents", "Passport or licence details are not shared with Copilot."],
                    ["Other travelers’ details", "Only the number of guests is used."],
                  ].map(([t, d]) => (
                    <li key={t} className="flex items-start gap-12">
                      <Icon name="no" size={20} />
                      <div className="text-body-m flex flex-col gap-2">
                        <p className="text-label-m text-fg">{t}</p>
                        <p className="text-fg-secondary">{d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              {handover ? (
                <div className="border-line bg-surface rounded-lg border p-24">
                  <Handover
                    requirements={reqs}
                    staysViewed={[]}
                    openQuestion="A question about my data"
                    onBack={() => setHandover(false)}
                  />
                </div>
              ) : (
                <section className="bg-brand-subtle flex flex-col items-start gap-16 rounded-lg p-24" aria-labelledby="q">
                  <h2 id="q" className="text-heading-s text-fg">
                    Questions about your data?
                  </h2>
                  <p className="text-body-m text-fg-secondary">A person can explain what is stored and help you remove it.</p>
                  <Button variant="secondary" onClick={() => setHandover(true)}>
                    Talk to a person
                  </Button>
                </section>
              )}
              {conversation && (
                <ButtonLink href={conversation.resultsHref} variant="ghost" className="self-start">
                  Back to your results
                </ButtonLink>
              )}
            </aside>
          </div>
        </div>
      </main>
      <SlimFooter />
    </>
  );
}
