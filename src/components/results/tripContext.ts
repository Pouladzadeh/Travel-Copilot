/**
 * What every screen after Results needs from the current thread: the trip,
 * the requirements, and the links back to Results and Home.
 */
import type { Conversation } from "@/lib/copilot/store";
import { guestCount, nights, proseRange } from "@/lib/dates";
import { buildResults } from "@/lib/ranking";
import { encodeRequirements, type Requirement } from "@/lib/requirements";
import { resultsHrefFor } from "./ResultsView";

const EMPTY: Requirement[] = [];

export function tripContext(conversation: Conversation | null) {
  const search = conversation?.search;
  const requirements = conversation?.requirements ?? EMPTY;
  const destination = search?.destination ?? "Miami";
  const n = search?.checkIn && search?.checkOut ? nights(search.checkIn, search.checkOut) : null;
  const fitting = buildResults(requirements).fitting;
  const resultsHref = search ? resultsHrefFor(search, requirements) : "/results?destination=Miami&adults=2";
  const dates = search?.checkIn && search?.checkOut ? proseRange(search.checkIn, search.checkOut) : "Add dates";
  const changeHref = `/?${new URLSearchParams({
    destination,
    ...(search?.checkIn ? { checkIn: search.checkIn } : {}),
    ...(search?.checkOut ? { checkOut: search.checkOut } : {}),
    adults: String(search?.adults ?? 2),
    req: encodeRequirements(requirements),
  }).toString()}`;
  return {
    search,
    requirements,
    nights: n,
    fitting,
    resultsHref,
    changeHref,
    backLabel: requirements.length ? `Back to ${fitting.length} ${fitting.length === 1 ? "result" : "results"}` : "Back to results",
    summary: `${destination} · ${dates} · ${guestCount(search?.adults ?? 2, search?.children ?? 0)}`,
  };
}
