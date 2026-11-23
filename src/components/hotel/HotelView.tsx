"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCompare } from "@/lib/compareStore";
import { uid } from "@/lib/copilot/changes";
import { peekConversation, useCurrentConversation, type Conversation } from "@/lib/copilot/store";
import { fitRows, freeUntilLabel, roomOffers } from "@/lib/fit";
import { shortName } from "@/lib/compare";
import { useDesktop } from "@/lib/hooks/useMediaQuery";
import { hotelById, type Hotel } from "@/lib/hotels";
import { buildResults, check } from "@/lib/ranking";
import { encodeRequirements } from "@/lib/requirements";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { CopilotPanel, PanelRail } from "../results/CopilotPanel";
import { GuestReviews } from "./Reviews";
import { EvidenceView } from "../results/EvidenceView";
import { Handover } from "../results/Handover";
import { BackTripBar, CompareBar, SlimFooter } from "../results/ResultsParts";
import { tripContext } from "../results/tripContext";
import { useThread } from "../results/useThread";
import { CopilotDock, dockSummary, useDock } from "../results/CopilotDock";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";

/**
 * Hotel detail (Figma 14:269). The Copilot thread from Results continues
 * here ("One conversation across screens"): earlier messages fold away and a
 * divider marks the stay being viewed.
 */

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

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
    // The snapshot is empty during hydration; only start a thread if none is stored.
    if (!conversation) {
      if (!peekConversation()) start(freshConversation(hotel));
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

  const trip = tripContext(conversation);
  const { search, requirements, nights: n } = trip;
  const rows = fitRows(hotel, requirements, n);
  const offers = roomOffers(hotel);
  const fitsAll = (free: boolean, price: number) =>
    requirements.every((r) =>
      r.kind === "budget" ? price <= r.maxPerNight : r.kind === "free-cancellation" ? free : check(hotel, r) !== "fail",
    );
  const recommended = requirements.length ? offers.find((o) => o.freeCancellation && fitsAll(true, o.pricePerNight)) : undefined;
  const desktop = useDesktop();
  const answers = (conversation?.items ?? []).filter((i) => i.type === "copilot").length;
  const dock = useDock(answers);
  const thread = useThread({ conversation, update, context: { screen: "hotel", hotelId: hotel.id, checkIn: search?.checkIn } });
  const lastQuestion = [...(conversation?.items ?? [])].reverse().find((i) => i.type === "traveler");
  const inCompare = compare.ids.includes(hotel.id);

  function suggestion(s: string) {
    const m = s.match(/^Compare with (.+)$/);
    if (m) {
      const other = buildResults(requirements).fitting.find((h) => shortName(h) === m[1]);
      if (other) {
        update((c) => ({ ...c, items: [...c.items, { type: "traveler", id: uid("t"), text: s }], suggestions: [] }));
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
  const panel = (variant: "panel" | "sheet") => (
    <CopilotPanel
      variant={variant}
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
      onHide={variant === "sheet" ? () => dock.setOpen(false) : thread.hide}
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
  );

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <BackTripBar href={trip.resultsHref} label={trip.backLabel} summary={trip.summary} changeHref={trip.changeHref} />

      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] flex-col items-start gap-32 px-20 pt-16 pb-[112px] md:px-32 md:pt-32 lg:flex-row lg:pb-40">
          <article className={`flex w-full min-w-0 flex-col gap-16 md:gap-24 ${hidden ? "lg:flex-1" : "lg:max-w-[784px] lg:flex-1"}`}>
            {/* Title */}
            <div className="flex flex-col items-start gap-16 md:flex-row">
              <div className="flex w-full min-w-0 flex-1 flex-col gap-8">
                <h1 className="text-heading-m md:text-heading-l text-fg">{hotel.name}</h1>
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
              <div className="flex w-full shrink-0 flex-wrap items-center gap-12 md:w-auto">
                <div className="mr-auto flex flex-col items-start gap-2 md:mr-0 md:items-end">
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
            <div className="bg-subtle relative -mx-20 flex h-[240px] gap-8 overflow-hidden sm:mx-0 sm:h-[320px] sm:rounded-lg md:h-[380px]">
              {hotel.photo ? (
                <div className="relative h-full flex-1">
                  <Image
                    src={hotel.photo}
                    alt={`${hotel.name}, outside`}
                    fill
                    priority
                    sizes="(min-width: 640px) 388px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-full flex-1 items-center justify-center">
                  <Icon name="card-image" size={32} />
                </div>
              )}
              {hotel.gallery && (
                <div className="hidden h-full flex-1 grid-cols-2 grid-rows-2 gap-8 sm:grid">
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
              <section
                className="border-line-copilot bg-copilot flex flex-col gap-16 rounded-lg border p-16 md:p-24"
                aria-labelledby="fit-heading"
              >
                <h2 id="fit-heading" className="text-heading-s md:text-heading-m text-fg flex items-center gap-8">
                  <Icon name="sparkle" size={20} />
                  How this fits your trip
                </h2>
                <p className="text-body-m text-fg-secondary">
                  Checked by Copilot against what you asked for. Each line shows where the answer came from.
                </p>
                <ul className="flex flex-col">
                  {rows.map((r) => (
                    <li
                      key={r.label}
                      className="border-line-copilot flex flex-col gap-4 border-t py-12 md:flex-row md:items-start md:gap-24"
                    >
                      <div className="flex items-start justify-between gap-12 md:w-[190px] md:shrink-0">
                        <p className="text-label-m text-fg">{r.label}</p>
                        <span className="md:hidden">
                          <StatusPill type={r.pill.type} label={r.pill.label} />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="text-body-m text-fg">{r.answer}</p>
                        {r.source.includes("policy") || r.source.includes("listing") || r.source.includes("reviews") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setHandover(false);
                              setEvidence(true);
                              if (!desktop) dock.setOpen(true);
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
                      <span className="max-md:hidden">
                        <StatusPill type={r.pill.type} label={r.pill.label} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Good to know */}
            <section
              className="border-line bg-surface grid grid-cols-2 gap-16 rounded-lg border p-16 md:flex md:gap-24 md:p-24"
              aria-label="Good to know"
            >
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
              <h2 id="rooms-heading" className="text-heading-s md:text-heading-m text-fg">
                Rooms for your dates
              </h2>
              {offers.map((o) => {
                const isRec = recommended?.key === o.key;
                const primary = isRec || offers.length === 1 || (!recommended && o === offers[0]);
                const total = n === null ? undefined : n === 3 ? o.total : Math.round(o.pricePerNight * n * 1.128);
                return (
                  <div
                    key={o.key}
                    className={`bg-surface flex flex-col gap-16 rounded-md border p-16 sm:flex-row sm:gap-24 sm:px-24 sm:py-20 ${isRec ? "border-line-copilot-strong" : "border-line"}`}
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
                    <div className="flex shrink-0 flex-col items-start gap-4 sm:w-[140px] sm:items-end">
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
            <GuestReviews hotel={hotel} />

            {/* Neighborhood */}
            {hotel.area && (
              <section
                className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-16 md:flex-row md:gap-24 md:p-20"
                aria-labelledby="area-heading"
              >
                {hotel.area.photo && (
                  <div className="relative h-[180px] w-full shrink-0 overflow-hidden rounded-md md:h-auto md:w-[280px] md:self-stretch">
                    <Image
                      src={hotel.area.photo}
                      alt={`A street in ${hotel.area.name}`}
                      fill
                      sizes="(min-width: 768px) 280px, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-16">
                  <h2 id="area-heading" className="text-heading-s md:text-heading-m text-fg">
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

          {hidden && desktop && (
            <div className="sticky top-16 hidden self-start lg:block">
              <PanelRail count={requirements.length} unread={thread.unread} onShow={thread.show} />
            </div>
          )}
          {!hidden && desktop && <div className="sticky top-16 hidden self-start lg:block">{panel("panel")}</div>}
        </div>
      </main>
      <SlimFooter />
      {!desktop && (
        <CopilotDock
          open={dock.open}
          onOpen={() => dock.setOpen(true)}
          onClose={() => dock.setOpen(false)}
          summary={dockSummary(requirements.length, answers)}
          unread={dock.unread}
        >
          {panel("sheet")}
        </CopilotDock>
      )}
    </>
  );
}
