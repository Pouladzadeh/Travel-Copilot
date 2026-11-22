"use client";

import { useState } from "react";
import { MONTH_LONG, longRange, nights, parseISO, toISO } from "@/lib/dates";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";
import type { Flex } from "./searchState";

/** Figma: Search controls → "Dates · range picker" (101:567). */

type Props = {
  checkIn: string | null;
  checkOut: string | null;
  flex: Flex;
  today: string;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  onFlex: (f: Flex) => void;
  onDone: () => void;
};

function Month({
  year,
  month,
  checkIn,
  checkOut,
  today,
  onPick,
  showPrev,
  showNext,
  nextOnPhone,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  checkIn: string | null;
  checkOut: string | null;
  today: string;
  onPick: (iso: string) => void;
  showPrev: boolean;
  showNext: boolean;
  /** Phones show one month, so its "next" arrow appears there only. */
  nextOnPhone?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      <div className="flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className={showPrev ? "rounded-pill hover:bg-subtle p-2" : "invisible"}
          tabIndex={showPrev ? 0 : -1}
          aria-hidden={!showPrev}
        >
          <Icon name="cal-previous" size={20} />
        </button>
        <p className="text-label-m text-fg">
          {MONTH_LONG[month]} {year}
        </p>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className={
            showNext ? "rounded-pill hover:bg-subtle p-2" : nextOnPhone ? "rounded-pill hover:bg-subtle p-2 md:invisible" : "invisible"
          }
          tabIndex={showNext || nextOnPhone ? 0 : -1}
          aria-hidden={!showNext && !nextOnPhone}
        >
          <Icon name="cal-next" size={20} />
        </button>
      </div>
      <div className="flex" aria-hidden="true">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-label-s text-fg-secondary flex h-[28px] flex-1 items-center justify-center">
            {d}
          </span>
        ))}
      </div>
      {weeks.map((week, w) => (
        <div key={w} className="flex">
          {week.map((day, i) => {
            if (day === null) return <span key={i} className="h-[40px] flex-1" />;
            const iso = toISO(new Date(year, month, day));
            const isStart = iso === checkIn;
            const isEnd = iso === checkOut;
            const inRange = checkIn && checkOut && iso >= checkIn && iso <= checkOut;
            const past = iso < today;
            return (
              <span
                key={i}
                className={`flex h-[40px] flex-1 items-center justify-center ${inRange ? "bg-brand-subtle" : ""} ${
                  isStart && checkOut ? "rounded-l-[20px]" : ""
                } ${isEnd ? "rounded-r-[20px]" : ""}`}
              >
                <button
                  type="button"
                  disabled={past}
                  onClick={() => onPick(iso)}
                  aria-label={parseISO(iso).toDateString()}
                  aria-pressed={isStart || isEnd}
                  className={`text-body-m flex size-36 items-center justify-center rounded-[18px] ${
                    isStart || isEnd
                      ? "bg-brand text-label-m text-fg-on-brand"
                      : past
                        ? "text-fg-tertiary opacity-50"
                        : "text-fg hover:bg-subtle"
                  }`}
                >
                  {day}
                </button>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function DatesPicker({ checkIn, checkOut, flex, today, onChange, onFlex, onDone }: Props) {
  const start = parseISO(checkIn ?? today);
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const next = view.month === 11 ? { year: view.year + 1, month: 0 } : { year: view.year, month: view.month + 1 };
  const todayDate = parseISO(today);
  const canGoBack = view.year > todayDate.getFullYear() || view.month > todayDate.getMonth();

  function pick(iso: string) {
    if (!checkIn || checkOut || iso <= checkIn) onChange(iso, null);
    else onChange(checkIn, iso);
  }
  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  const flexOptions: { id: Flex; label: string }[] = [
    { id: "exact", label: "Exact dates" },
    { id: "1", label: "± 1 day" },
    { id: "3", label: "± 3 days" },
  ];

  let summary = "Choose your check-in date";
  if (checkIn && !checkOut) summary = "Now choose your check-out date";
  if (checkIn && checkOut) {
    const n = nights(checkIn, checkOut);
    summary = `${longRange(checkIn, checkOut)} · ${n} ${n === 1 ? "night" : "nights"}`;
  }

  return (
    <div className="flex flex-col gap-20 p-16 md:p-24">
      <div className="flex gap-32">
        <Month
          {...view}
          nextOnPhone
          checkIn={checkIn}
          checkOut={checkOut}
          today={today}
          onPick={pick}
          showPrev={canGoBack}
          showNext={false}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
        />
        <div className="hidden min-w-0 flex-1 md:flex">
          <Month
            {...next}
            checkIn={checkIn}
            checkOut={checkOut}
            today={today}
            onPick={pick}
            showPrev={false}
            showNext
            onPrev={() => shift(-1)}
            onNext={() => shift(1)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-8" role="radiogroup" aria-label="Date flexibility">
        {flexOptions.map((o) =>
          o.id === flex ? (
            <RequirementChip key={o.id} label={o.label} onClick={() => onFlex("exact")} />
          ) : (
            <RequirementChip key={o.id} state="suggested" label={o.label} onClick={() => onFlex(o.id)} />
          ),
        )}
      </div>

      <div className="border-line-copilot bg-copilot flex items-start gap-8 rounded-md border p-12">
        <Icon name="sparkle" size={18} />
        <p className="text-body-m text-fg flex-1">
          Arriving late or leaving early? Add it as a preference and Copilot checks front desk hours for these dates.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-12">
        <p className="text-label-m text-fg min-w-[200px] flex-1" aria-live="polite">
          {summary}
        </p>
        <Button variant="ghost" onClick={() => onChange(null, null)}>
          Clear
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
