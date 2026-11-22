"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCompare } from "@/lib/compareStore";
import { uid } from "@/lib/copilot/changes";
import { useCurrentConversation, type Conversation } from "@/lib/copilot/store";
import { guestCount, nights, proseRange } from "@/lib/dates";
import { fitRows, freeUntilLabel, roomOffers } from "@/lib/fit";
import { hotelById, type Hotel } from "@/lib/hotels";
import { buildResults, check } from "@/lib/ranking";
import { encodeRequirements } from "@/lib/requirements";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { CopilotPanel, PanelPill } from "../results/CopilotPanel";
import { EvidenceView } from "../results/EvidenceView";
import { Handover } from "../results/Handover";
import { CompareBar, SlimFooter } from "../results/ResultsParts";
import { resultsHrefFor } from "../results/ResultsView";
import { useThread } from "../results/useThread";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";

/**
 * Hotel detail (Figma 14:269). The Copilot thread from Results continues
 * here ("One conversation across screens"): earlier messages fold away and a
 * divider marks the stay being viewed.
 */

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const shortName = (h: Hotel) => h.name.replace(/ (Bayside Suites|Hotel|Inn|Suites)$/, "");

function suggestionsFor(h: Hotel, other?: Hotel) {
  return [
    "Is it quiet at night?",
    ...(other ? [`Compare with ${shortName(other)}`] : []),
    ...(h.flexibleRate ? ["What does the flexible rate cover?"] : []),
    "Is there parking?",
  ];
}

function freshConversation(h: Hotel): Conversation {
  return {
    key: `direct|${h.id}`,
    search: { destination: "Miami", adults: 2, children: 0, rooms: 1 },
    resultsHref: "/results?destination=Miami&adults=2",
    requirements: [],
    items: [],
    suggestions: suggestionsFor(h),
    hidden: false,
    newIds: [],
  };
}

export function HotelView({ hotelId }: { hotelId: string }) {
  const hotel = hotelById(hotelId)!;
  const { conversation, update, start } = useCurrentConversation();
  const compare = useCompare();
  const [saved, setSaved] = useState(false);
  const [evidence, setEvidence] = useState(false);
  const [handover, setHandover] = useState(false);

  // Continue the thread from Results, or start one for a direct visit.
  useEffect(() => {
    if (!conversation) {
      start(freshConversation(hotel));
      return;
    }
    const lastViewing = [...conversation.items].reverse().find((i) => i.type === "viewing");
    const label = `Now viewing ${hotel.name}`;
    if (!lastViewing || lastViewing.type !== "viewing" || lastViewing.label !== label) {
      const others = buildResults(conversation.requirements).fitting.filter((h) => h.id !== hotel.id);
      update((c) => ({
        ...c,
        items: [...c.items, { type: "viewing", id: uid("v"), label }],
        suggestions: suggestionsFor(hotel, others[0]),
      }));
    }
    // Run once per hotel and thread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel.id, conversation?.key]);

  const search = conversation?.search;
  const requirements = useMemo(() => conversation?.requirements ?? [], [conversation?.requirements]);
  const n = search?.checkIn && search?.checkOut ? nights(search.checkIn, search.checkOut) : null;
  const rows = fitRows(hotel, requirements, n);
  const offers = roomOffers(hotel);
  const fitsAll = (free: boolean, price: number) =>
    requirements.every((r) =>
      r.kind === "budget" ? price <= r.maxPerNight : r.kind === "free-cancellation" ? free : check(hotel, r) !== "fail",
    );
  const recommended = requirements.length ? offers.find((o) => o.freeCancellation && fitsAll(true, o.pricePerNight)) : undefined;
  const fittingCount = buildResults(requirements).fitting.length;
  const resultsHref = search
    ? resultsHrefFor({ ...search, destination: search.destination }, requirements)
    : "/results?destination=Miami&adults=2";
  const dates = search?.checkIn && search?.checkOut ? proseRange(search.checkIn, search.checkOut) : "Add dates";
  const thread = useThread({ conversation, update, context: { screen: "hotel", hotelId: hotel.id, checkIn: search?.checkIn } });
  const lastQuestion = [...(conversation?.items ?? [])].reverse().find((i) => i.type === "traveler");
  const inCompare = compare.ids.includes(hotel.id);

  function suggestion(s: string) {
    const m = s.match(/^Compare with (.+)$/);
    if (m) {
      const other = buildResults(requirements).fitting.find((h) => shortName(h) === m[1]);
      if (other) {
        compare.clear();
        compare.toggle(hotel.id, true);
        compare.toggle(other.id, true);
        window.location.href = `/compare?ids=${hotel.id},${other.id}`;
        return;
      }
    }
    thread.ask(s);
  }

  const bookingHref = (rate: "flexible" | "lowest") => {
    const p = new URLSearchParams({ hotel: hotel.id, rate });
    if (search?.checkIn) p.set("checkIn", search.checkIn);
    if (search?.checkOut) p.set("checkOut", search.checkOut);
    if (requirements.length) p.set("req", encodeRequirements(requirements));
    return `/booking?${p.toString()}`;
  };

  const frontDesk = {
    confirmed: "Open 24 hours",
    conditional: "Night porter, call ahead",
    unconfirmed: "Hours not published",
    no: "Closes at 11:00 pm",
  }[hotel.late.status];
  const cancellation = hotel.flexibleRate ? "Depends on the rate" : hotel.freeCancellation ? "Free cancellation" : "Non-refundable";
  const hidden = conversation?.hidden ?? false;
  const changeHref = `/?${new URLSearchParams({
    destination: search?.destination ?? "Miami",
    ...(search?.checkIn ? { checkIn: search.checkIn } : {}),
    ...(search?.checkOut ? { checkOut: search.checkOut } : {}),
    adults: String(search?.adults ?? 2),
    req: encodeRequirements(requirements),
  }).toString()}`;

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <div className="border-line bg-surface flex justify-center border-b">
        <div className="flex w-full max-w-[var(--container)] items-center justify-between px-32 py-8">
          <Link href={resultsHref} className="text-label-m text-fg-link flex items-center gap-4 hover:underline">
            <Icon name="arrow-left" size={16} />
            {requirements.length ? `Back to ${fittingCount} ${fittingCount === 1 ? "result" : "results"}` : "Back to results"}
          </Link>
          <div className="flex items-center gap-16">
            <p className="text-body-m text-fg-secondary">
              {search?.destination ?? "Miami"} · {dates} · {guestCount(search?.adults ?? 2, search?.children ?? 0)}
            </p>
            <ButtonLink href={changeHref} variant="secondary">
              Change
            </ButtonLink>
          </div>
        </div>
      </div>

      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] items-start gap-32 px-32 pt-32 pb-40">
          <article className={`flex min-w-0 flex-col gap-24 ${hidden ? "flex-1" : "w-[784px]"}`}>
            {/* Title */}
            <div className="flex items-start gap-16">
              <div className="flex min-w-0 flex-1 flex-col gap-8">
                <h1 className="text-heading-l text-fg">{hotel.name}</h1>
                <div className="flex flex-wrap items-center gap-12">
                  <span className="text-body-m text-fg-secondary flex items-center gap-4">
                    <Icon name="star-16" size={16} />
                    {hotel.rating.toFixed(1)} · {hotel.reviewCount.toLocaleString("en-US")} reviews
                  </span>
                  <span className="text-body-m text-fg-secondary flex items-center gap-4">
                    <Icon name="pin-16" size={16} />
                    {hotel.neighborhood}
                  </span>
                  <button
                    type="button"
                    onClick={() => compare.toggle(hotel.id, !inCompare)}
                    disabled={!inCompare && compare.full}
                    className="text-label-m text-fg-link disabled:text-fg-tertiary hover:underline disabled:no-underline"
                  >
                    {inCompare ? "Remove from compare" : compare.full ? "Compare is full (3)" : "Add to compare"}
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-12">
                {hidden && <PanelPill count={requirements.length} unread={thread.unread} onShow={thread.show} />}
                <div className="flex flex-col items-end gap-2">
                  <p className="text-price-m text-fg">From {money(hotel.pricePerNight)} a night</p>
                  {n !== null && (
                    <p className="text-body-s text-fg-secondary">
                      {money(n === 3 ? hotel.total : Math.round(hotel.pricePerNight * n * 1.128))} total with fees
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={saved ? `Remove ${hotel.name} from saved` : `Save ${hotel.name}`}
                  aria-pressed={saved}
                  onClick={() => setSaved(!saved)}
                  className={`border-line-input flex size-[46px] items-center justify-center rounded-md border ${saved ? "bg-brand-subtle" : "bg-surface"} hover:bg-subtle`}
                >
                  <Icon name="heart-20" size={20} />
                </button>
                <Button onClick={() => document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" })}>See rooms</Button>
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-subtle relative flex h-[380px] gap-8 overflow-hidden rounded-lg">
              {hotel.photo ? (
                <div className="relative h-full flex-1">
                  <Image src={hotel.photo} alt={`${hotel.name}, outside`} fill priority sizes="388px" className="object-cover" />
                </div>
              ) : (
                <div className="flex h-full flex-1 items-center justify-center">
                  <Icon name="card-image" size={32} />
                </div>
              )}
              {hotel.gallery && (
                <div className="grid h-full flex-1 grid-cols-2 grid-rows-2 gap-8">
                  {hotel.gallery.map((src, i) => (
                    <div key={src} className="relative">
                      <Image src={src} alt={`${hotel.name}, photo ${i + 2}`} fill sizes="190px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {hotel.gallery && (
                <button
                  type="button"
                  className="border-line-strong bg-surface text-label-m text-fg hover:bg-subtle absolute right-12 bottom-12 flex items-center gap-[6px] rounded-md border px-12 py-8"
                >
                  <Icon name="grid" size={16} />
                  Show all 12 photos
                </button>
              )}
            </div>

            {/* How this fits your trip */}
            {rows.length > 0 && (
              <section className="border-line-copilot bg-copilot flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="fit-heading">
                <h2 id="fit-heading" className="text-heading-m text-fg flex items-center gap-8">
                  <Icon name="sparkle" size={20} />
                  How this fits your trip
                </h2>
                <p className="text-body-m text-fg-secondary">
                  Checked by Copilot against what you asked for. Each line shows where the answer came from.
                </p>
                <ul className="flex flex-col">
                  {rows.map((r) => (
                    <li key={r.label} className="border-line-copilot flex items-start gap-24 border-t py-12">
                      <p className="text-label-m text-fg w-[190px] shrink-0">{r.label}</p>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="text-body-m text-fg">{r.answer}</p>
                        {r.source.includes("policy") || r.source.includes("listing") || r.source.includes("reviews") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setHandover(false);
                              setEvidence(true);
                              if (hidden) thread.show();
                            }}
                            className="text-body-s text-fg-secondary decoration-line-strong hover:text-fg self-start underline underline-offset-2"
                          >
                            {r.source}
                          </button>
                        ) : (
                          <p className="text-body-s text-fg-secondary">{r.source}</p>
                        )}
                      </div>
                      <StatusPill type={r.pill.type} label={r.pill.label} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Good to know */}
            <section className="border-line bg-surface flex gap-24 rounded-lg border p-24" aria-label="Good to know">
              {[
                ["Check-in", hotel.checkInFrom],
                ["Front desk", frontDesk],
                ["Check-out", hotel.checkOutUntil],
                ["Cancellation", cancellation],
              ].map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-1 flex-col gap-4">
                  <p className="text-body-s text-fg-secondary">{k}</p>
                  <p className="text-heading-s text-fg">{v}</p>
                </div>
              ))}
            </section>

            {/* Rooms */}
            <section id="rooms" className="flex scroll-mt-16 flex-col gap-12" aria-labelledby="rooms-heading">
              <h2 id="rooms-heading" className="text-heading-m text-fg">
                Rooms for your dates
              </h2>
              {offers.map((o) => {
                const isRec = recommended?.key === o.key;
                const primary = isRec || offers.length === 1 || (!recommended && o === offers[0]);
                const total = n === null ? undefined : n === 3 ? o.total : Math.round(o.pricePerNight * n * 1.128);
                return (
                  <div
                    key={o.key}
                    className={`bg-surface flex gap-24 rounded-md border px-24 py-20 ${isRec ? "border-line-copilot-strong" : "border-line"}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-8">
                      <p className="text-heading-s text-fg">{o.name}</p>
                      <p className="text-body-s text-fg-secondary">{o.facts}</p>
                      <div className="flex flex-wrap gap-8">
                        {isRec && <StatusPill type="copilot" label="Matches your request" />}
                        {o.freeCancellation ? (
                          <StatusPill type="confirmed" label={o.freeUntil ? freeUntilLabel(o.freeUntil) : "Free cancellation"} />
                        ) : (
                          <StatusPill type="danger" label="Non-refundable" />
                        )}
                      </div>
                    </div>
                    <div className="flex w-[140px] shrink-0 flex-col items-end gap-4">
                      <p className="text-price-m text-fg whitespace-nowrap">{money(o.pricePerNight)} per night</p>
                      {total !== undefined && (
                        <p className="text-body-s text-fg-secondary whitespace-nowrap">{money(total)} total with fees</p>
                      )}
                      <div className="pt-12">
                        <ButtonLink href={bookingHref(o.key)} variant={primary ? "primary" : "secondary"}>
                          Reserve
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* What guests say */}
            {hotel.reviewSnippets && (
              <section className="flex flex-col gap-16" aria-labelledby="reviews-heading">
                <div className="flex items-end gap-16">
                  <div className="flex flex-1 flex-col gap-4">
                    <h2 id="reviews-heading" className="text-heading-m text-fg">
                      What guests say
                    </h2>
                    <p className="text-body-m text-fg-secondary">
                      {hotel.rating.toFixed(1)} out of 5 · {hotel.reviewCount.toLocaleString("en-US")} reviews
                    </p>
                  </div>
                  <a href="#" className="text-label-m text-fg-link hover:underline">
                    Read all reviews
                  </a>
                </div>
                <ul className="flex gap-16">
                  {hotel.reviewSnippets.map((r) => (
                    <li key={r.meta} className="border-line bg-surface flex min-w-0 flex-1 flex-col gap-12 rounded-lg border p-20">
                      <p className="text-body-l text-fg">“{r.quote}”</p>
                      <p className="text-body-s text-fg-secondary">{r.meta}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Neighborhood */}
            {hotel.area && (
              <section className="border-line bg-surface flex gap-24 rounded-lg border p-20" aria-labelledby="area-heading">
                {hotel.area.photo && (
                  <div className="relative w-[280px] shrink-0 self-stretch overflow-hidden rounded-md">
                    <Image src={hotel.area.photo} alt={`A street in ${hotel.area.name}`} fill sizes="280px" className="object-cover" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-16">
                  <h2 id="area-heading" className="text-heading-m text-fg">
                    {hotel.area.name}
                  </h2>
                  {[
                    ["Getting there", hotel.area.gettingThere, "map estimate"],
                    ["Around the hotel", hotel.area.around, "map data"],
                    [
                      "What guests say about walking at night",
                      `${hotel.area.nightWalk.comfortable} guest reviews mention feeling comfortable walking back at night, and ${hotel.area.nightWalk.poorlyLit} mention poorly lit side streets. Copilot does not rate how safe a neighborhood is.`,
                      "guest reviews",
                    ],
                  ].map(([k, v, src]) => (
                    <div key={k} className="flex flex-col gap-2">
                      <p className="text-label-m text-fg">{k}</p>
                      <p className="text-body-m text-fg">{v}</p>
                      <p className="text-body-s text-fg-secondary">Source: {src}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <CompareBar ids={compare.ids} names={compare.ids.map((id) => hotelById(id)?.name ?? id)} onClear={compare.clear} />
            <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE}</p>
          </article>

          {!hidden && (
            <div className="sticky top-16 self-start">
              <CopilotPanel
                requirements={requirements}
                items={conversation?.items ?? []}
                suggestions={conversation?.suggestions ?? []}
                busy={thread.busy}
                unavailable={false}
                collapseEarlier
                composerPlaceholder="Ask about this hotel"
                overlay={
                  handover ? (
                    <Handover
                      requirements={requirements}
                      staysViewed={[hotel.name]}
                      openQuestion={lastQuestion?.type === "traveler" ? lastQuestion.text : undefined}
                      onBack={() => setHandover(false)}
                    />
                  ) : evidence ? (
                    <EvidenceView hotel={hotel} onClose={() => setEvidence(false)} />
                  ) : undefined
                }
                onRemove={thread.remove}
                onAddSuggested={thread.add}
                onBudget={thread.budget}
                onAsk={thread.ask}
                onSuggestion={suggestion}
                onUndo={thread.undo}
                onRate={thread.rate}
                onPerson={() => setHandover(true)}
                onStop={thread.stop}
                onRetry={() => undefined}
                onHide={thread.hide}
                onNewConversation={() =>
                  update((c) => ({
                    ...c,
                    items: [{ type: "viewing", id: uid("v"), label: `Now viewing ${hotel.name}` }],
                    suggestions: suggestionsFor(
                      hotel,
                      buildResults(c.requirements).fitting.find((h) => h.id !== hotel.id),
                    ),
                  }))
                }
              />
            </div>
          )}
        </div>
      </main>
      <SlimFooter />
    </>
  );
}
