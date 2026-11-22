"use client";

import { shortRange, guestCount } from "@/lib/dates";
import { decodeRequirements } from "@/lib/requirements";
import { PLACE_SUGGESTIONS, RECENT_SEARCH, type PlaceSuggestion } from "@/lib/sample-data";
import { Icon, type IconName } from "../Icon";

export type DestinationOption = { type: "recent" } | { type: "suggestion"; suggestion: PlaceSuggestion };

function matches(name: string, q: string) {
  const n = name.toLowerCase();
  return n.startsWith(q) || n.includes(` ${q}`);
}

/** Options for the typed text, in Figma's order: Recent, Places, Stays. */
export function destinationOptions(query: string): DestinationOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: DestinationOption[] = [];
  if (matches(RECENT_SEARCH.destination, q)) out.push({ type: "recent" });
  const places = PLACE_SUGGESTIONS.filter((s) => s.kind !== "stay" && matches(s.name, q)).slice(0, 4);
  const stays = PLACE_SUGGESTIONS.filter((s) => s.kind === "stay" && matches(s.name, q)).slice(0, 1);
  // Typing "Mia" also lists the Miami stay, as in Figma.
  if (stays.length === 0 && matches("miami", q)) stays.push(PLACE_SUGGESTIONS.find((s) => s.kind === "stay")!);
  out.push(...places.map((s) => ({ type: "suggestion" as const, suggestion: s })));
  out.push(...stays.map((s) => ({ type: "suggestion" as const, suggestion: s })));
  return out;
}

/** Bold the typed part, as in the Figma state. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

const ICON: Record<PlaceSuggestion["kind"], IconName> = { place: "pin", airport: "plane", stay: "bed" };

export function DestinationPicker({
  query,
  activeIndex,
  onHover,
  onChoose,
  listId,
}: {
  query: string;
  activeIndex: number;
  onHover: (i: number) => void;
  onChoose: (o: DestinationOption) => void;
  listId: string;
}) {
  const options = destinationOptions(query);
  let lastSection = "";

  return (
    <div className="flex flex-col py-8">
      <ul id={listId} role="listbox" aria-label="Destination suggestions">
        {options.map((o, i) => {
          const section = o.type === "recent" ? "Recent" : o.suggestion.kind === "stay" ? "Stays" : "Places";
          const heading = section !== lastSection ? section : null;
          lastSection = section;
          const recentReqs = decodeRequirements(RECENT_SEARCH.requirements.join(","));
          return (
            <li key={i} role="presentation">
              {heading && (
                <p className="text-label-s text-fg-secondary px-16 pt-8 pb-4" role="presentation">
                  {heading}
                </p>
              )}
              <div
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => onHover(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChoose(o);
                }}
                className={`flex cursor-pointer items-center gap-12 px-16 py-[10px] ${i === activeIndex ? "bg-subtle" : ""}`}
              >
                <Icon name={o.type === "recent" ? "clock" : ICON[o.suggestion.kind]} size={20} />
                <div className="flex min-w-0 flex-1 flex-col">
                  {o.type === "recent" ? (
                    <>
                      <p className="text-body-l text-fg">
                        <Highlight text={RECENT_SEARCH.destination} query={query} /> ·{" "}
                        {shortRange(RECENT_SEARCH.checkIn, RECENT_SEARCH.checkOut)} ·{" "}
                        {guestCount(RECENT_SEARCH.adults, RECENT_SEARCH.children)}
                      </p>
                      <p className="text-body-s text-fg-secondary">{recentReqs.map((r) => r.label).join(" · ")}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-body-l text-fg">
                        {o.suggestion.kind === "stay" ? o.suggestion.name : <Highlight text={o.suggestion.name} query={query} />}
                      </p>
                      <p className="text-body-s text-fg-secondary">{o.suggestion.detail}</p>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-body-s text-fg-tertiary px-16 pt-8 pb-4">Use the arrow keys to move and Enter to choose</p>
    </div>
  );
}
