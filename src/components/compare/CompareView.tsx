"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHOICE_LABEL,
  choiceReply,
  choices,
  compareRows,
  compareSummary,
  isSame,
  shortName,
  tally,
  totalFor,
  tradeOff,
  type Choice,
  type CompareRow,
} from "@/lib/compare";
import { useCompare } from "@/lib/compareStore";
import { uid } from "@/lib/copilot/changes";
import { peekConversation, useCurrentConversation, type Conversation } from "@/lib/copilot/store";
import type { Reply } from "@/lib/copilot/types";
import { useDesktop } from "@/lib/hooks/useMediaQuery";
import { hotelById, type Hotel } from "@/lib/hotels";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { CopilotPanel, PanelPill } from "../results/CopilotPanel";
import { Handover } from "../results/Handover";
import { BackTripBar, SlimFooter } from "../results/ResultsParts";
import { tripContext } from "../results/tripContext";
import { useThread } from "../results/useThread";
import { CopilotDock, dockSummary, useDock } from "../results/CopilotDock";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";
import { Toggle } from "../Toggle";

/**
 * Compare (Figma 16:387 two stays, 80:1133 three stays, 77:162 differences
 * only). The Copilot thread continues from Results or Hotel detail.
 */

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const WHICH = "Which fits my trip better?";
const ROW_NAME: Record<string, string> = {
  "late-arrival": "arriving after midnight",
  quiet: "quiet",
  budget: "budget",
  "free-cancellation": "free cancellation",
  "lowest-total": "lowest total",
  "free-total": "total with free cancellation",
  rating: "guest rating",
  airport: "time from the airport",
};

function viewingLabel(hotels: Hotel[]) {
  return hotels.length === 2 ? `Now comparing ${shortName(hotels[0])} and ${shortName(hotels[1])}` : `Now comparing ${hotels.length} stays`;
}

function freshConversation(): Conversation {
  return {
    key: "direct|compare",
    search: { destination: "Miami", adults: 2, children: 0, rooms: 1 },
    resultsHref: "/results?destination=Miami&adults=2",
    requirements: [],
    items: [],
    suggestions: [],
    hidden: false,
    newIds: [],
  };
}

export function CompareView({ ids }: { ids: string[] }) {
  const router = useRouter();
  const hotels = useMemo(
    () =>
      [...new Set(ids)]
        .map((id) => hotelById(id))
        .filter((h): h is Hotel => !!h)
        .slice(0, 3),
    [ids],
  );
  const { conversation, update, start } = useCurrentConversation();
  const compare = useCompare();
  const trip = tripContext(conversation);
  const { requirements } = trip;
  const n = trip.nights ?? 3;
  const rows = useMemo(() => compareRows(hotels, requirements, n), [hotels, requirements, n]);
  const [diffOnly, setDiffOnly] = useState(false);
  const [handover, setHandover] = useState(false);
  // Three columns need the room, so the panel starts as the pill (Figma 80:1133).
  const [openWithThree, setOpenWithThree] = useState(false);
  const desktop = useDesktop();
  const answers = (conversation?.items ?? []).filter((i) => i.type === "copilot").length;
  const dock = useDock(answers);
  const thread = useThread({ conversation, update, context: { screen: "compare", checkIn: trip.search?.checkIn } });
  const three = hotels.length === 3;
  const hidden = three ? !openWithThree : (conversation?.hidden ?? false);
  const nextStay = trip.fitting.find((h) => !hotels.some((x) => x.id === h.id));

  const suggestionsFor = (hs: Hotel[]) => [
    ...choices(hs, requirements).map((c) => CHOICE_LABEL[c]),
    ...(hs.length < 3 && nextStay ? [`Add ${nextStay.name}`] : []),
  ];
  const summaryReply = (hs: Hotel[]): Reply => ({
    items: [{ type: "copilot", id: uid("m"), text: compareSummary(hs, requirements), feedback: true }],
    suggestions: suggestionsFor(hs),
  });

  // Keep the compare list in step with the page, then continue the thread.
  const handled = useRef("");
  useEffect(() => {
    if (hotels.length < 2) return;
    const key = hotels.map((h) => h.id).join(",");
    if (compare.ids.join(",") !== key) {
      compare.clear();
      hotels.forEach((h) => compare.toggle(h.id, true));
    }
    // The snapshot is empty during hydration; only start a thread if none is stored.
    if (!conversation) {
      if (!peekConversation()) start(freshConversation());
      return;
    }
    if (handled.current === `${conversation.key}|${key}`) return;
    handled.current = `${conversation.key}|${key}`;
    const label = viewingLabel(hotels);
    const last = conversation.items.at(-1);
    const pending = last?.type === "traveler" && /^Compare /.test(last.text) ? last : undefined;
    const lastViewing = [...conversation.items].reverse().find((i) => i.type === "viewing");
    if (lastViewing?.type === "viewing" && lastViewing.label === label && !pending) return;
    update((c) => ({
      ...c,
      items: [...c.items.filter((i) => i !== pending && i.id !== pending?.id), { type: "viewing", id: uid("v"), label }],
      suggestions: pending ? [] : [WHICH, ...suggestionsFor(hotels).filter((s) => s.startsWith("Add "))],
    }));
    // "Compare these two" asked on Results: answer it here, where the table is.
    if (pending?.type === "traveler") thread.respond(pending.text, summaryReply(hotels));
    // Once per thread and set of stays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels, conversation?.key]);

  const go = (next: string[]) => router.replace(`/compare?ids=${next.join(",")}`, { scroll: false });

  function remove(id: string) {
    compare.toggle(id, false);
    go(hotels.map((h) => h.id).filter((x) => x !== id));
  }

  function suggestion(s: string) {
    if (s === WHICH) return thread.respond(s, summaryReply(hotels));
    const choice = (Object.keys(CHOICE_LABEL) as Choice[]).find((c) => CHOICE_LABEL[c] === s);
    if (choice) {
      const r = choiceReply(choice, hotels, requirements, n);
      return thread.respond(s, {
        items: [
          {
            type: "copilot",
            id: uid("m"),
            text: r.text,
            feedback: true,
            actions: [
              { kind: "link", label: `See rooms at ${shortName(r.hotel)}`, href: `/hotels/${r.hotel.id}#rooms`, style: "secondary" },
            ],
          },
        ],
        suggestions: suggestionsFor(hotels).filter((x) => x.startsWith("Add ")),
      });
    }
    const add = s.match(/^Add (.+)$/);
    const h = add && trip.fitting.find((x) => x.name === add[1]);
    if (h) {
      const next = [...hotels, h];
      thread.respond(s, {
        items: [
          {
            type: "copilot",
            id: uid("m"),
            text: `Added ${h.name} to the comparison. The table and the trade-off now include it. I did not change anything else.`,
            feedback: false,
          },
        ],
        suggestions: [WHICH],
      });
      handled.current = `${conversation?.key}|${next.map((x) => x.id).join(",")}`;
      if (next.length === 3) setOpenWithThree(true);
      compare.toggle(h.id, true);
      go(next.map((x) => x.id));
      return;
    }
    thread.ask(s);
  }

  const lastQuestion = [...(conversation?.items ?? [])].reverse().find((i) => i.type === "traveler");
  const hiddenRows = rows.filter(isSame);
  const visibleRows = diffOnly ? rows.filter((r) => !isSame(r)) : rows;
  const pill = (
    <PanelPill count={requirements.length} unread={thread.unread} onShow={() => (three ? setOpenWithThree(true) : thread.show())} />
  );

  const panel = (variant: "panel" | "sheet") => (
    <CopilotPanel
      variant={variant}
      requirements={requirements}
      items={conversation?.items ?? []}
      suggestions={conversation?.suggestions ?? []}
      busy={thread.busy}
      unavailable={false}
      collapseEarlier
      composerPlaceholder={hotels.length === 2 ? "Ask about these two hotels" : "Ask about these hotels"}
      overlay={
        handover ? (
          <Handover
            requirements={requirements}
            staysViewed={hotels.map((h) => h.name)}
            openQuestion={lastQuestion?.type === "traveler" ? lastQuestion.text : undefined}
            onBack={() => setHandover(false)}
          />
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
      onHide={variant === "sheet" ? () => dock.setOpen(false) : () => (three ? setOpenWithThree(false) : thread.hide())}
      onNewConversation={() =>
        update((c) => ({
          ...c,
          items: [{ type: "viewing", id: uid("v"), label: viewingLabel(hotels) }],
          suggestions: [WHICH],
        }))
      }
    />
  );

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <BackTripBar href={trip.resultsHref} label={trip.backLabel} summary={trip.summary} changeHref={trip.changeHref} />

      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] flex-col items-start gap-32 px-20 pt-16 pb-[112px] md:px-32 md:pt-32 lg:flex-row lg:pb-32">
          <section className="flex w-full min-w-0 flex-1 flex-col gap-16 md:gap-24" aria-labelledby="compare-title">
            <div className="flex flex-col gap-4">
              <h1 id="compare-title" className="text-heading-m md:text-heading-l text-fg">
                Compare {hotels.length} {hotels.length === 1 ? "stay" : "stays"}
              </h1>
              <p className="text-body-m text-fg-secondary">Scored against what you asked for. Totals include taxes and fees.</p>
            </div>

            {hotels.length < 2 ? (
              <div className="border-line bg-surface flex flex-col items-start gap-12 rounded-lg border p-24">
                <p className="text-heading-s text-fg">Pick at least two stays to compare</p>
                <p className="text-body-m text-fg-secondary">
                  {hotels[0] ? `${hotels[0].name} is still selected. ` : ""}Choose another stay on Results, up to three.
                </p>
                <ButtonLink href={trip.resultsHref}>Back to results</ButtonLink>
              </div>
            ) : (
              <>
                <div className="border-line-copilot bg-copilot flex flex-col gap-8 rounded-lg border px-20 py-16">
                  <p className="text-label-s text-fg-copilot flex items-center gap-4">
                    <Icon name="sparkle" size={16} />
                    The trade-off
                  </p>
                  <p className="text-body-m md:text-body-l text-fg">{tradeOff(hotels, requirements, n)}</p>
                </div>

                <div className="flex min-h-[38px] flex-wrap items-center justify-between gap-12 md:gap-16">
                  {diffOnly ? (
                    <p className="text-body-m text-fg-secondary">
                      {hiddenRows.length === 0
                        ? "Every row differs, so nothing is hidden."
                        : `${hiddenRows.length} ${hiddenRows.length === 1 ? "row" : "rows"} hidden because ${
                            three ? "all three stays" : "both stays"
                          } are the same: ${hiddenRows.map((r) => ROW_NAME[r.key] ?? r.label.toLowerCase()).join(", ")}`}
                    </p>
                  ) : three ? (
                    <p className="text-body-m text-fg-secondary">Comparing the maximum of 3 stays</p>
                  ) : (
                    <Link href={trip.resultsHref} className="text-label-m text-fg-link flex items-center gap-[6px] hover:underline">
                      <Icon name="plus-link" size={16} />
                      Add a stay (up to 3)
                    </Link>
                  )}
                  <div className="flex shrink-0 flex-wrap items-center gap-16">
                    <Toggle checked={diffOnly} onChange={setDiffOnly} label="Show differences only" />
                    {hidden && desktop && pill}
                  </div>
                </div>

                {diffOnly ? (
                  <DifferencesTable hotels={hotels} rows={visibleRows} />
                ) : (
                  <FullTable hotels={hotels} rows={rows} n={n} onRemove={remove} />
                )}
              </>
            )}
            <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE}</p>
          </section>

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

function Cell({ cell }: { cell: CompareRow["cells"][number] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
      {cell.pill && <StatusPill type={cell.pill.type} label={cell.pill.label} />}
      <p className="text-body-m text-fg">{cell.text}</p>
      {cell.source && <p className="text-body-s text-fg-secondary">{cell.source}</p>}
    </div>
  );
}

function FullTable({ hotels, rows, n, onRemove }: { hotels: Hotel[]; rows: CompareRow[]; n: number; onRemove: (id: string) => void }) {
  const section = (title: string) => (
    <div className="border-line bg-subtle border-t px-16 py-8 md:px-24">
      <h2 className="text-label-s text-fg-secondary sticky left-16 w-max md:static">{title}</h2>
    </div>
  );
  const rowView = (r: CompareRow) => (
    <div key={r.key} className="border-line flex flex-col gap-8 border-t px-16 py-16 md:px-24">
      <h3 className="text-label-m text-fg sticky left-16 w-max md:static">{r.label}</h3>
      <div className="flex gap-16 md:gap-24">
        {r.cells.map((c, i) => (
          <Cell key={hotels[i].id} cell={c} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="border-line bg-surface overflow-x-auto rounded-lg border">
      {/* Phones scroll the columns sideways; row labels stay in place. */}
      <div className={hotels.length === 3 ? "min-w-[760px] md:min-w-0" : "min-w-[540px] md:min-w-0"}>
        <div className="flex gap-16 px-16 py-16 md:gap-24 md:px-24">
          {hotels.map((h, i) => {
            const t = tally(rows, i);
            return (
              <div key={h.id} className="flex min-w-0 flex-1 flex-col gap-12">
                <div className="bg-subtle relative h-[150px] overflow-hidden rounded-md">
                  {h.photo ? (
                    <Image src={h.photo} alt={`${h.name}, outside`} fill sizes="380px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon name="card-image" size={32} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(h.id)}
                    aria-label={`Remove ${h.name} from comparison`}
                    className="absolute top-[10px] right-[10px] flex size-32 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.92)] hover:bg-white"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-heading-s text-fg">{h.name}</p>
                  <p className="text-body-s text-fg-secondary flex gap-4">
                    <Icon name="star" size={14} />
                    {h.rating.toFixed(1)} · {h.reviewCount.toLocaleString("en-US")} reviews · {h.neighborhood}
                  </p>
                </div>
                <p className="flex flex-wrap items-center gap-x-[6px]">
                  <span className="text-label-s text-fg-secondary">
                    Your {t.total} {t.total === 1 ? "requirement" : "requirements"}
                  </span>
                  <span className="text-label-m text-fg">{t.text}</span>
                </p>
                <div className="flex flex-col gap-2">
                  <p className="text-price-m text-fg">{money(h.pricePerNight)} per night</p>
                  <p className="text-body-s text-fg-secondary">{money(totalFor(h, n))} total with fees</p>
                </div>
                <div className="flex flex-wrap gap-8">
                  <ButtonLink href={`/hotels/${h.id}#rooms`}>See rooms</ButtonLink>
                  <ButtonLink href={`/hotels/${h.id}`} variant="secondary">
                    View hotel
                  </ButtonLink>
                </div>
              </div>
            );
          })}
        </div>
        {section("Your requirements")}
        {rows.filter((r) => r.section === "requirements").map(rowView)}
        {section("Other differences")}
        {rows.filter((r) => r.section === "other").map(rowView)}
      </div>
    </div>
  );
}

/** "Show differences only" (Figma 77:162): a compact table of what differs. */
function DifferencesTable({ hotels, rows }: { hotels: Hotel[]; rows: CompareRow[] }) {
  return (
    <div className="border-line bg-surface overflow-x-auto rounded-lg border px-16 py-8 md:px-24">
      <table className="w-full min-w-[520px] border-collapse text-left md:min-w-0">
        <thead>
          <tr>
            <th scope="col" className="w-[160px] py-16 md:w-[204px]">
              <span className="sr-only">Row</span>
            </th>
            {hotels.map((h) => (
              <th key={h.id} scope="col" className="text-body-l text-fg py-16 font-normal">
                {h.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-line border-t">
              <th scope="row" className="text-body-l text-fg py-16 pr-16 font-normal">
                {r.label}
              </th>
              {r.cells.map((c, i) => (
                <td key={hotels[i].id} className="py-16 pr-16">
                  {c.pill ? (
                    <StatusPill type={c.pill.type} label={c.pill.label} />
                  ) : (
                    <span className="text-price-m text-fg">{c.short}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
