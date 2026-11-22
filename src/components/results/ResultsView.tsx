"use client";

import { useEffect, useMemo, useState } from "react";
import { addRequirement, changeBudget, removeRequirement, uid } from "@/lib/copilot/changes";
import { useThread } from "./useThread";
import { noMatchReply, openingReply } from "@/lib/copilot/scripted";
import { peekConversation, useConversation, type Conversation } from "@/lib/copilot/store";
import { useCompare } from "@/lib/compareStore";
import type { PanelItem } from "@/lib/copilot/types";
import { guestCount, nights, proseRange } from "@/lib/dates";
import { hotelById, type Hotel } from "@/lib/hotels";
import { buildResults, hiddenNotice, pillsFor, reasonFor } from "@/lib/ranking";
import { decodeRequirements, encodeRequirements, LABELS, type Requirement } from "@/lib/requirements";
import { RECENT_SEARCH, SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { Button, ButtonLink } from "../Button";
import { HotelCard } from "../HotelCard";
import { SiteHeader } from "../SiteHeader";
import { CopilotPanel, PanelPill } from "./CopilotPanel";
import { EvidenceView } from "./EvidenceView";
import { Handover } from "./Handover";
import { CompareBar, LoadingList, LoadingSteps, NoMatch, SlimFooter, SortAndFilters, TripBar, type Sort } from "./ResultsParts";

export type SearchParams = {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
  rooms: number;
  q?: string;
  req?: string;
  copilot?: string;
};

const FIRST_USE_SUGGESTIONS = ["My flight lands after midnight", "Somewhere quiet, under $300 a night", "Only stays I can cancel for free"];
const DEFAULT_SUGGESTIONS = ["Compare these two", "Only free cancellation", "Closer to the beach"];
/** The traveler's words from the last session, for "Continue" on Home. */
const RECENT_TRAVELER_TEXT = "I land at 11:30 pm and won’t reach the hotel until after midnight. Somewhere quiet, under $300.";

export function resultsHrefFor(s: SearchParams, reqs: Requirement[]) {
  const p = new URLSearchParams({ destination: s.destination });
  if (s.checkIn) p.set("checkIn", s.checkIn);
  if (s.checkOut) p.set("checkOut", s.checkOut);
  p.set("adults", String(s.adults));
  if (reqs.length) p.set("req", encodeRequirements(reqs));
  return `/results?${p.toString()}`;
}

function initConversation(s: SearchParams): Omit<Conversation, "key"> {
  const requirements = decodeRequirements(s.req);
  const isRecent = !s.q && s.req === RECENT_SEARCH.requirements.join(",") && s.checkIn === RECENT_SEARCH.checkIn;
  const travelerText = s.q || (isRecent ? RECENT_TRAVELER_TEXT : "");
  let items: PanelItem[] = [];
  let suggestions: string[] = [];
  if (requirements.length === 0) {
    suggestions = FIRST_USE_SUGGESTIONS;
  } else if (travelerText) {
    const opening = openingReply(requirements);
    items = [{ type: "traveler", id: uid("t"), text: travelerText }, ...opening.items];
    suggestions = opening.suggestions ?? DEFAULT_SUGGESTIONS;
  } else if (buildResults(requirements).fitting.length === 0) {
    items = noMatchReply(requirements).items;
  } else {
    suggestions = DEFAULT_SUGGESTIONS;
  }
  return {
    search: {
      destination: s.destination,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      adults: s.adults,
      children: s.children,
      rooms: s.rooms,
    },
    resultsHref: resultsHrefFor(s, requirements),
    openingText: s.q,
    requirements,
    items,
    suggestions,
    hidden: false,
    newIds: [],
  };
}

export function ResultsView({ search }: { search: SearchParams }) {
  const key = `${search.destination}|${search.checkIn}|${search.checkOut}`;
  const { conversation, ensure, update } = useConversation(key, () => initConversation(search), search.q);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("Best fit");
  const [showAll, setShowAll] = useState(false);
  const { ids: compare, toggle: toggleCompare, clear: clearCompare } = useCompare();
  const [saved, setSaved] = useState<string[]>([]);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [handover, setHandover] = useState(false);
  const [unavailable, setUnavailable] = useState(search.copilot === "down");

  // Coming back from a hotel: mark the thread so it reads in order.
  useEffect(() => {
    const items = conversation?.items ?? [];
    const lastViewing = [...items].reverse().find((i) => i.type === "viewing");
    if (lastViewing?.type === "viewing" && lastViewing.label !== "Back to results") {
      update((c) => ({
        ...c,
        items: [...c.items, { type: "viewing", id: uid("v"), label: "Back to results" }],
        suggestions: DEFAULT_SUGGESTIONS,
      }));
    }
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.key]);

  useEffect(() => {
    const before = peekConversation();
    const continuing = before?.key === key && (!search.q || before.openingText === search.q);
    ensure();
    // Returning to a thread: the stays are already checked, so no loading state.
    const t = setTimeout(() => setLoading(false), continuing ? 0 : 1200);
    return () => clearTimeout(t);
  }, [ensure, key, search.q]);

  const requirements = useMemo(
    () => conversation?.requirements ?? decodeRequirements(search.req),
    [conversation?.requirements, search.req],
  );
  const model = useMemo(() => buildResults(requirements), [requirements]);
  const isMiami = /miami/i.test(search.destination);
  const n = search.checkIn && search.checkOut ? nights(search.checkIn, search.checkOut) : null;
  const totalFor = (h: Hotel) => (n === null ? undefined : n === 3 ? h.total : Math.round(h.pricePerNight * n * 1.128));

  const list = useMemo(() => {
    const base = showAll ? [...model.fitting, ...model.hidden] : model.fitting;
    if (unavailable || sort === "Price: low to high") return [...base].sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sort === "Guest rating") return [...base].sort((a, b) => b.rating - a.rating);
    return base;
  }, [model, showAll, sort, unavailable]);

  // ── Conversation actions ──────────────────────────────────────────
  const thread = useThread({ conversation, update, context: { screen: "results" } });
  const { busy, unread, append } = thread;
  const ask = (text: string) => {
    if (!unavailable) thread.ask(text);
  };

  function suggestion(s: string) {
    const top = model.fitting.slice(0, 2).map((h) => h.id);
    if (s === "Compare these two" && top.length === 2) {
      // The question travels with the thread; Compare answers it.
      update((c) => ({ ...c, items: [...c.items, { type: "traveler", id: uid("t"), text: s }], suggestions: [] }));
      clearCompare();
      top.forEach((id) => toggleCompare(id, true));
      window.location.href = `/compare?ids=${top.join(",")}`;
      return;
    }
    if (s === "Only free cancellation" || s === "Only stays I can cancel for free") {
      const r = addRequirement(requirements, { kind: "free-cancellation", label: LABELS.freeCancellation });
      append(r.items, r.after);
      return;
    }
    if (s === "Closer to the beach") return ask("Which one is closest to the beach?");
    if (s === "Talk to a person") return setHandover(true);
    if (s === "Quiet street" || s === "Quiet room" || s === "Either is fine") {
      const label = s === "Quiet room" ? "Quiet room" : "Quiet";
      update((c) => ({ ...c, items: [...c.items, { type: "traveler", id: uid("t"), text: s }] }));
      append(
        [
          {
            type: "copilot",
            id: uid("m"),
            text:
              s === "Quiet room"
                ? "Got it: a quiet room. Reviews rarely say which rooms are quiet, so I can only check what guests say about the hotel overall. I have kept the same ranking."
                : "Got it. I kept the ranking by quiet street.",
            feedback: true,
          },
        ],
        requirements.map((r) => (r.kind === "quiet" ? { ...r, label } : r)),
      );
      return;
    }
    if (s === "My flight lands after midnight" || s === "Somewhere quiet, under $300 a night") {
      // First use: the chip is the traveler's own words.
      update((c) => ({ ...c, items: [...c.items, { type: "traveler", id: uid("t"), text: s }], suggestions: [] }));
      const parsed = decodeRequirements(
        encodeRequirements(
          s.startsWith("My flight")
            ? [{ kind: "late-arrival", label: LABELS.lateArrival }]
            : [
                { kind: "quiet", label: LABELS.quiet },
                { kind: "budget", label: LABELS.budget(300), maxPerNight: 300 },
              ],
        ),
      );
      const after = [...requirements.filter((r) => !parsed.some((p) => p.kind === r.kind)), ...parsed];
      const count = buildResults(after).fitting.length;
      append(
        [
          {
            type: "copilot",
            id: uid("m"),
            text: `Added ${parsed.map((p) => `“${p.label}”`).join(" and ")}. ${count} of ${model.total} stays fit. Each card shows why.`,
            feedback: true,
          },
        ],
        after,
        DEFAULT_SUGGESTIONS,
      );
      return;
    }
    ask(s);
  }

  // ── Render ─────────────────────────────────────────────────────────
  const fitsCount = model.fitting.length;
  const dates = search.checkIn && search.checkOut ? proseRange(search.checkIn, search.checkOut) : null;
  const who = guestCount(search.adults, search.children);
  const changeHref = `/?${new URLSearchParams({
    destination: search.destination,
    ...(search.checkIn ? { checkIn: search.checkIn } : {}),
    ...(search.checkOut ? { checkOut: search.checkOut } : {}),
    adults: String(search.adults),
    req: encodeRequirements(requirements),
  }).toString()}`;
  const evidenceHotel = evidenceId ? hotelById(evidenceId) : undefined;
  const lastQuestion = [...(conversation?.items ?? [])].reverse().find((i) => i.type === "traveler");
  const hidden = conversation?.hidden ?? false;
  const noMatch = !loading && isMiami && requirements.length > 0 && fitsCount === 0 && !showAll;

  const panel = (
    <CopilotPanel
      requirements={requirements}
      items={conversation?.items ?? []}
      suggestions={conversation?.suggestions ?? []}
      busy={busy}
      unavailable={unavailable}
      overlay={
        loading ? undefined : handover ? (
          <Handover
            requirements={requirements}
            staysViewed={(compare.length ? compare : model.fitting.slice(0, 2).map((h) => h.id)).map((id) => hotelById(id)!.name)}
            openQuestion={lastQuestion?.type === "traveler" ? lastQuestion.text : undefined}
            onBack={() => setHandover(false)}
          />
        ) : evidenceHotel ? (
          <EvidenceView hotel={evidenceHotel} onClose={() => setEvidenceId(null)} />
        ) : undefined
      }
      onRemove={thread.remove}
      onAddSuggested={thread.add}
      onBudget={thread.budget}
      onAsk={ask}
      onSuggestion={suggestion}
      onUndo={thread.undo}
      onRate={thread.rate}
      onPerson={() => setHandover(true)}
      onStop={thread.stop}
      onRetry={() => setUnavailable(false)}
      onHide={thread.hide}
    />
  );

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <TripBar
        destination={search.destination}
        summary={`${search.destination} · ${dates ?? "Add dates"} · ${who}`}
        changeHref={changeHref}
      />

      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] items-start gap-32 px-32 pt-32 pb-40">
          <div className={`flex min-w-0 flex-col gap-24 ${hidden ? "flex-1" : "w-[784px]"}`}>
            {!isMiami ? (
              <div className="border-line bg-surface flex flex-col gap-12 rounded-lg border p-24">
                <h1 className="text-heading-l">No sample stays in {search.destination}</h1>
                <p className="text-body-m text-fg-secondary">This portfolio demo only has sample stays in Miami.</p>
                <ButtonLink href="/results?destination=Miami&adults=2" variant="secondary" className="self-start">
                  See Miami stays
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-16">
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <h1 className="text-heading-l text-fg">
                      {loading
                        ? `Finding stays in ${search.destination}`
                        : requirements.length === 0
                          ? `${model.total} stays in ${search.destination}`
                          : noMatch
                            ? `0 of ${model.total} stays fit everything you asked for`
                            : `${fitsCount} of ${model.total} stays fit your trip`}
                    </h1>
                    <p className="text-body-m text-fg-secondary">
                      {dates ? `${dates} · ${who}` : `${who} · add dates to see totals`}
                      {loading
                        ? ` · checking ${model.total} stays against what you asked for`
                        : noMatch
                          ? " · your request has not been changed"
                          : dates
                            ? " · totals include taxes and fees"
                            : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-12">
                    {hidden && <PanelPill count={requirements.length} unread={unread} onShow={thread.show} />}
                    {!loading && !noMatch && <Button variant="secondary">Show map</Button>}
                  </div>
                </div>

                {loading ? (
                  <LoadingList />
                ) : noMatch ? (
                  <NoMatch
                    requirements={requirements}
                    total={model.total}
                    onApply={(after) => {
                      const budgetChanged =
                        after.find((r) => r.kind === "budget")?.maxPerNight !== requirements.find((r) => r.kind === "budget")?.maxPerNight;
                      const r = budgetChanged
                        ? changeBudget(requirements, after.find((q) => q.kind === "budget")?.maxPerNight ?? null)
                        : removeRequirement(requirements, requirements.find((q) => !after.some((a) => a.kind === q.kind))!.kind);
                      append(r.items, r.after);
                    }}
                    onShowAll={() => setShowAll(true)}
                  />
                ) : (
                  <>
                    <SortAndFilters sort={sort} onSort={setSort} sortDisabled={unavailable} />
                    {model.hidden.length > 0 && requirements.length > 0 && (
                      <div className="bg-subtle flex items-center gap-16 rounded-md px-20 py-12">
                        <p className="text-body-m text-fg-secondary flex-1">
                          {showAll
                            ? `Showing all ${model.total} stays. ${model.hidden.length} don’t meet everything you asked for.`
                            : hiddenNotice(model)}
                        </p>
                        <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
                          {showAll ? "Show only fits" : `Show all ${model.total}`}
                        </Button>
                      </div>
                    )}
                    <ul className="flex flex-col gap-16">
                      {list.map((h) => (
                        <li key={h.id}>
                          <ResultCard
                            hotel={h}
                            requirements={requirements}
                            total={totalFor(h)}
                            isNew={conversation?.newIds.includes(h.id) ?? false}
                            hideReason={unavailable}
                            compare={compare}
                            toggleCompare={toggleCompare}
                            saved={saved}
                            setSaved={setSaved}
                            highlighted={evidenceId === h.id}
                            onSources={() => {
                              setHandover(false);
                              setEvidenceId(h.id);
                              if (hidden) update((c) => ({ ...c, hidden: false }));
                            }}
                          />
                        </li>
                      ))}
                    </ul>

                    {requirements.length > 0 && (
                      <section className="flex flex-col gap-16 pt-16" aria-labelledby="outside-heading">
                        <div className="flex flex-col gap-4">
                          <h2 id="outside-heading" className="text-heading-s text-fg">
                            Outside your best fits
                          </h2>
                          <p className="text-body-m text-fg-secondary">
                            One wildcard and one paid placement. Neither is part of the ranking.
                          </p>
                        </div>
                        <ul className="flex flex-col gap-16">
                          {model.outside.map((h) => (
                            <li key={h.id}>
                              <ResultCard
                                hotel={h}
                                requirements={requirements}
                                total={totalFor(h)}
                                isNew={false}
                                hideReason={unavailable}
                                compare={compare}
                                toggleCompare={toggleCompare}
                                saved={saved}
                                setSaved={setSaved}
                                highlighted={evidenceId === h.id}
                                onSources={() => setEvidenceId(h.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </>
                )}
                <CompareBar ids={compare} names={compare.map((id) => hotelById(id)?.name ?? id)} onClear={clearCompare} />
              </>
            )}
            <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE}</p>
          </div>

          {isMiami && !hidden && (
            <div className="sticky top-16 self-start">
              {loading ? (
                <aside className="border-line bg-surface flex w-[400px] flex-col gap-16 rounded-lg border p-24" aria-label="Travel Copilot">
                  <h2 className="text-heading-s">Travel Copilot</h2>
                  <div className="border-line-copilot bg-copilot text-body-m rounded-lg border p-16">
                    Checking front desk hours, rate rules and guest reviews for {model.total} stays. This usually takes a few seconds.
                  </div>
                  <LoadingSteps total={model.total} />
                  <p className="text-body-s text-fg-secondary">You can keep browsing. Stays appear as soon as they are checked.</p>
                </aside>
              ) : (
                panel
              )}
            </div>
          )}
        </div>
      </main>
      <SlimFooter />
    </>
  );
}

function ResultCard({
  hotel,
  requirements,
  total,
  isNew,
  hideReason,
  compare,
  toggleCompare,
  saved,
  setSaved,
  highlighted,
  onSources,
}: {
  hotel: Hotel;
  requirements: Requirement[];
  total?: number;
  isNew: boolean;
  hideReason: boolean;
  compare: string[];
  toggleCompare: (id: string, on: boolean) => void;
  saved: string[];
  setSaved: (ids: string[]) => void;
  highlighted: boolean;
  onSources: () => void;
}) {
  const r = reasonFor(hotel, requirements);
  const tag =
    hotel.placement === "wildcard"
      ? ({ type: "wildcard", label: "Wildcard" } as const)
      : hotel.placement === "sponsored"
        ? ({ type: "sponsored", label: "Sponsored" } as const)
        : undefined;
  return (
    <HotelCard
      name={hotel.name}
      rating={hotel.rating}
      reviewCount={hotel.reviewCount}
      location={hotel.neighborhood}
      pricePerNight={hotel.pricePerNight}
      totalWithFees={total}
      reason={hideReason || requirements.length === 0 ? undefined : r.reason}
      reasonLabel={r.label}
      sources={r.sources}
      onSources={onSources}
      facts={pillsFor(hotel, requirements)}
      tag={tag}
      isNew={isNew}
      highlighted={highlighted}
      photo={hotel.photo}
      href={`/hotels/${hotel.id}`}
      compareChecked={compare.includes(hotel.id)}
      onCompareChange={(c) => toggleCompare(hotel.id, c)}
      saved={saved.includes(hotel.id)}
      onSaveChange={(s) => setSaved(s ? [...saved, hotel.id] : saved.filter((id) => id !== hotel.id))}
    />
  );
}
