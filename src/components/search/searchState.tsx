"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import {
  encodeRequirements,
  mergeRequirements,
  parseRequirements,
  type Requirement,
  type RequirementKind,
} from "@/lib/requirements";

export type Picker = "destination" | "dates" | "guests" | null;
export type Flex = "exact" | "1" | "3";

export type SearchState = {
  destination: string;
  checkIn: string | null;
  checkOut: string | null;
  flex: Flex;
  adults: number;
  children: number;
  childAges: (number | null)[];
  rooms: number;
  /** What the traveler typed in "Add preferences with Copilot". */
  prefText: string;
  /** Requirements added with a suggested chip. */
  chosen: Requirement[];
  /** Kinds the traveler removed from the typed reading. */
  dismissed: RequirementKind[];
  open: Picker;
  prefsOpen: boolean;
};

type Action =
  | { type: "set"; patch: Partial<SearchState> }
  | { type: "choose"; requirement: Requirement }
  | { type: "remove"; kind: RequirementKind }
  | { type: "open"; picker: Picker };

const initial: SearchState = {
  destination: "",
  checkIn: null,
  checkOut: null,
  flex: "exact",
  adults: 2,
  children: 0,
  childAges: [],
  rooms: 1,
  prefText: "",
  chosen: [],
  dismissed: [],
  open: null,
  prefsOpen: true,
};

function reducer(state: SearchState, action: Action): SearchState {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "choose":
      return {
        ...state,
        chosen: [...state.chosen.filter((r) => r.kind !== action.requirement.kind), action.requirement],
        dismissed: state.dismissed.filter((k) => k !== action.requirement.kind),
      };
    case "remove":
      return {
        ...state,
        chosen: state.chosen.filter((r) => r.kind !== action.kind),
        dismissed: state.dismissed.includes(action.kind) ? state.dismissed : [...state.dismissed, action.kind],
      };
    case "open":
      return { ...state, open: action.picker };
  }
}

type Ctx = {
  state: SearchState;
  dispatch: (a: Action) => void;
  requirements: Requirement[];
  /** True when the chips reflect typed text ("What Copilot understood so far"). */
  understoodMode: boolean;
  resultsHref: string | null;
};

const SearchContext = createContext<Ctx | null>(null);

export function SearchProvider({ children, defaults }: { children: ReactNode; defaults?: Partial<SearchState> }) {
  const [state, dispatch] = useReducer(reducer, { ...initial, ...defaults });

  const value = useMemo<Ctx>(() => {
    const typed = parseRequirements(state.prefText).filter((r) => !state.dismissed.includes(r.kind));
    const requirements = mergeRequirements(typed, state.chosen);
    const understoodMode = state.prefText.trim().length > 0 && requirements.length > 0;

    let resultsHref: string | null = null;
    if (state.destination.trim()) {
      const p = new URLSearchParams({ destination: state.destination.trim() });
      if (state.checkIn && state.checkOut) {
        p.set("checkIn", state.checkIn);
        p.set("checkOut", state.checkOut);
      }
      p.set("adults", String(state.adults));
      if (state.children) p.set("children", String(state.children));
      if (state.rooms !== 1) p.set("rooms", String(state.rooms));
      if (requirements.length) p.set("req", encodeRequirements(requirements));
      if (state.prefText.trim()) p.set("q", state.prefText.trim());
      resultsHref = `/results?${p.toString()}`;
    }
    return { state, dispatch, requirements, understoodMode, resultsHref };
  }, [state]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}
