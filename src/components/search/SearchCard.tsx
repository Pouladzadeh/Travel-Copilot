"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { guestsLabel, shortRange, toISO } from "@/lib/dates";
import { decodeRequirements, HOME_SUGGESTIONS, searchFooterText } from "@/lib/requirements";
import { RECENT_SEARCH } from "@/lib/sample-data";
import { Button } from "../Button";
import { Icon, type IconName } from "../Icon";
import { RequirementChip } from "../RequirementChip";
import { DatesPicker } from "./DatesPicker";
import { DestinationPicker, destinationOptions, type DestinationOption } from "./DestinationPicker";
import { GuestsPicker } from "./GuestsPicker";
import { Popover } from "./Popover";
import { useSearch } from "./searchState";

/**
 * Home search card (Figma Home 21:452 and Home · search filled 126:1798).
 * Search stays submits the trip fields and the Copilot preferences together.
 * The Copilot box has no send button of its own, and Copilot says nothing
 * here: the chips only reflect what the traveler typed.
 */

function Segment({
  icon,
  label,
  children,
  divider = true,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-12 py-4">
        <Icon name={icon} size={24} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-body-s text-fg-secondary">{label}</span>
          {children}
        </div>
      </div>
      {divider && <span className="h-[40px] w-px shrink-0 bg-line" aria-hidden="true" />}
    </>
  );
}

const valueClass = "text-heading-s truncate text-left";

export function SearchCard() {
  const router = useRouter();
  const { state, dispatch, requirements, understoodMode, resultsHref } = useSearch();
  const set = (patch: Partial<typeof state>) => dispatch({ type: "set", patch });
  const close = () => dispatch({ type: "open", picker: null });

  const destRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLButtonElement>(null);
  const guestsRef = useRef<HTMLButtonElement>(null);
  const destInput = useRef<HTMLInputElement>(null);
  const prefsInput = useRef<HTMLTextAreaElement>(null);
  const listId = useId();
  const [active, setActive] = useState(0);
  const [today] = useState(() => toISO(new Date()));

  const options = destinationOptions(state.destination);
  const destOpen = state.open === "destination" && options.length > 0;

  // Opening the destination picker from the compact header focuses the input.
  useEffect(() => {
    if (state.open === "destination") destInput.current?.focus();
  }, [state.open]);

  // Grow the preferences box with its text.
  useEffect(() => {
    const el = prefsInput.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [state.prefText, state.prefsOpen]);

  function choose(o: DestinationOption) {
    if (o.type === "recent") {
      set({
        destination: RECENT_SEARCH.destination,
        checkIn: RECENT_SEARCH.checkIn,
        checkOut: RECENT_SEARCH.checkOut,
        adults: RECENT_SEARCH.adults,
        children: RECENT_SEARCH.children,
        childAges: [],
        rooms: RECENT_SEARCH.rooms,
        chosen: decodeRequirements(RECENT_SEARCH.requirements.join(",")),
        dismissed: [],
        open: null,
      });
    } else {
      set({ destination: o.suggestion.value, open: "dates" });
    }
  }

  function submit() {
    if (!resultsHref) {
      dispatch({ type: "open", picker: "destination" });
      destInput.current?.focus();
      return;
    }
    router.push(resultsHref);
  }

  const suggestions = HOME_SUGGESTIONS.filter((s) => !requirements.some((r) => r.kind === s.requirement.kind));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative flex w-full flex-col gap-16 rounded-lg border border-line bg-surface p-24 shadow-[0px_16px_40px_-4px_rgba(18,33,79,0.14)]"
      aria-label="Search stays"
    >
      {/* Trip details */}
      <div className="relative flex items-center gap-16">
        <div ref={destRef} className="contents">
          <Segment icon="pin" label="Destination">
            <input
              ref={destInput}
              value={state.destination}
              placeholder="Where to?"
              aria-label="Destination"
              role="combobox"
              aria-expanded={destOpen}
              aria-controls={listId}
              aria-activedescendant={destOpen ? `${listId}-${active}` : undefined}
              autoComplete="off"
              onFocus={() => dispatch({ type: "open", picker: "destination" })}
              onChange={(e) => {
                setActive(0);
                set({ destination: e.target.value, open: "destination" });
              }}
              onKeyDown={(e) => {
                if (!destOpen) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, options.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  choose(options[active]);
                }
              }}
              className={`${valueClass} w-full bg-transparent text-fg outline-none placeholder:text-fg-tertiary`}
            />
          </Segment>
        </div>

        <Segment icon="calendar" label="Dates">
          <button
            ref={datesRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={state.open === "dates"}
            onClick={() => dispatch({ type: "open", picker: state.open === "dates" ? null : "dates" })}
            className={`${valueClass} ${state.checkIn && state.checkOut ? "text-fg" : "text-fg-tertiary"}`}
          >
            {state.checkIn && state.checkOut ? shortRange(state.checkIn, state.checkOut) : "Add dates"}
          </button>
        </Segment>

        <Segment icon="user" label="Guests" divider={false}>
          <button
            ref={guestsRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={state.open === "guests"}
            onClick={() => dispatch({ type: "open", picker: state.open === "guests" ? null : "guests" })}
            className={`${valueClass} text-fg`}
          >
            {guestsLabel(state.adults, state.children, state.rooms)}
          </button>
        </Segment>

        <Popover open={destOpen} onClose={close} anchorRef={destRef} label="Destination suggestions" className="left-0 top-full w-[456px]">
          <DestinationPicker query={state.destination} activeIndex={active} onHover={setActive} onChoose={choose} listId={listId} />
        </Popover>
        <Popover open={state.open === "dates"} onClose={close} anchorRef={datesRef} label="Choose dates" className="-left-25 top-full w-[680px]">
          <DatesPicker
            checkIn={state.checkIn}
            checkOut={state.checkOut}
            flex={state.flex}
            today={today}
            onChange={(checkIn, checkOut) => set({ checkIn, checkOut })}
            onFlex={(flex) => set({ flex })}
            onDone={close}
          />
        </Popover>
        <Popover open={state.open === "guests"} onClose={close} anchorRef={guestsRef} label="Choose guests" className="-right-25 top-full w-[416px]">
          <GuestsPicker
            adults={state.adults}
            childCount={state.children}
            childAges={state.childAges}
            rooms={state.rooms}
            onChange={(patch) => set(patch)}
            onDone={close}
          />
        </Popover>
      </div>

      <div className="h-px w-full bg-line" aria-hidden="true" />

      {/* Copilot preferences */}
      <div className="flex flex-col gap-12 rounded-md border border-line-copilot bg-copilot p-16">
        <button
          type="button"
          onClick={() => set({ prefsOpen: !state.prefsOpen })}
          aria-expanded={state.prefsOpen}
          aria-controls={`${listId}-prefs`}
          className="flex w-full items-center gap-8 text-left"
        >
          <Icon name="sparkle" size={22} />
          <span className="text-heading-s text-fg">Add preferences with Copilot</span>
          <span className="flex-1 text-body-m text-fg-secondary">Optional</span>
          <Icon name="chevron-up" size={20} className={state.prefsOpen ? "" : "rotate-180"} />
        </button>

        {state.prefsOpen && (
          <div id={`${listId}-prefs`} className="flex flex-col gap-12">
            <textarea
              ref={prefsInput}
              rows={1}
              value={state.prefText}
              onChange={(e) => set({ prefText: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="For example: My flight lands at midnight. I need late check-in."
              aria-label="Preferences for Copilot"
              className="min-h-[48px] w-full resize-none overflow-hidden rounded-md border border-line-input bg-surface px-16 py-12 text-body-l text-fg outline-none placeholder:text-fg-tertiary focus:border-line-focus focus:shadow-[inset_0_0_0_1px_var(--color-border-focus)]"
            />

            {understoodMode && (
              <p className="text-label-s text-fg-secondary">What Copilot understood so far</p>
            )}

            <div className="flex flex-wrap gap-8" aria-live="polite">
              {requirements.map((r) => (
                <RequirementChip key={r.kind} label={r.label} onClick={() => dispatch({ type: "remove", kind: r.kind })} />
              ))}
              {!understoodMode &&
                suggestions.map((s) => (
                  <RequirementChip
                    key={s.label}
                    state="suggested"
                    label={s.label}
                    onClick={() => dispatch({ type: "choose", requirement: s.requirement })}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-16">
        <p className="flex-1 text-body-s text-fg-secondary">{searchFooterText(requirements.length)}</p>
        <Button type="submit">Search stays</Button>
      </div>
    </form>
  );
}
