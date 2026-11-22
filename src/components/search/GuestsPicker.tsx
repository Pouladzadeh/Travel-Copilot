"use client";

import { Button } from "../Button";
import { Icon } from "../Icon";

/** Figma: Search controls → "Guests · selector" (101:792). */

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <div className="flex items-center gap-12">
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={!canDec}
        onClick={() => onChange(value - 1)}
        className={`flex size-36 items-center justify-center rounded-[18px] bg-surface ${
          canDec ? "border border-line-input hover:bg-subtle" : "border border-line opacity-50"
        }`}
      >
        <Icon name={canDec ? "stepper-minus" : "stepper-minus-disabled"} size={16} />
      </button>
      <span className="w-20 text-center text-label-m text-fg" aria-live="polite" aria-label={`${value} ${label}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={!canInc}
        onClick={() => onChange(value + 1)}
        className={`flex size-36 items-center justify-center rounded-[18px] border bg-surface ${
          canInc ? "border-line-input hover:bg-subtle" : "border-line opacity-50"
        }`}
      >
        <Icon name="stepper-plus" size={16} />
      </button>
    </div>
  );
}

export function GuestsPicker({
  adults,
  childCount,
  childAges,
  rooms,
  onChange,
  onDone,
}: {
  adults: number;
  childCount: number;
  childAges: (number | null)[];
  rooms: number;
  onChange: (patch: { adults?: number; children?: number; childAges?: (number | null)[]; rooms?: number }) => void;
  onDone: () => void;
}) {
  function setChildren(n: number) {
    const ages = [...childAges.slice(0, n)];
    while (ages.length < n) ages.push(null);
    onChange({ children: n, childAges: ages });
  }

  return (
    <div className="flex flex-col gap-16 p-24">
      <div className="flex items-center gap-12">
        <div className="flex flex-1 flex-col">
          <p className="text-label-m text-fg">Adults</p>
          <p className="text-body-s text-fg-secondary">Ages 18 and over</p>
        </div>
        <Stepper label="Adults" value={adults} min={1} max={16} onChange={(n) => onChange({ adults: n, rooms: Math.min(rooms, n) })} />
      </div>
      <div className="flex items-center gap-12">
        <div className="flex flex-1 flex-col">
          <p className="text-label-m text-fg">Children</p>
          <p className="text-body-s text-fg-secondary">Ages 0 to 17</p>
        </div>
        <Stepper label="Children" value={childCount} min={0} max={8} onChange={setChildren} />
      </div>

      {childAges.map((age, i) => (
        <label
          key={i}
          className="relative flex items-center gap-12 rounded-md border border-line-input bg-surface px-12 py-[10px] focus-within:border-line-focus focus-within:shadow-[inset_0_0_0_1px_var(--color-border-focus)]"
        >
          <span className="flex flex-1 flex-col">
            <span className="text-label-s text-fg-secondary">Age of child {i + 1} at check-in</span>
            <select
              value={age ?? ""}
              onChange={(e) => {
                const ages = [...childAges];
                ages[i] = e.target.value === "" ? null : Number(e.target.value);
                onChange({ childAges: ages });
              }}
              className="appearance-none bg-transparent text-body-l text-fg outline-none"
            >
              <option value="">Select age</option>
              {Array.from({ length: 18 }, (_, a) => (
                <option key={a} value={a}>
                  {a === 0 ? "Under 1 year" : `${a} ${a === 1 ? "year" : "years"}`}
                </option>
              ))}
            </select>
          </span>
          <Icon name="select-chevron" size={20} className="pointer-events-none" />
        </label>
      ))}

      <div className="h-px w-full bg-line" />

      <div className="flex items-center gap-12">
        <p className="flex-1 text-label-m text-fg">Rooms</p>
        <Stepper label="Rooms" value={rooms} min={1} max={adults} onChange={(n) => onChange({ rooms: n })} />
      </div>

      <p className="text-body-s text-fg-secondary">Children’s ages are used to show the right room types and prices.</p>

      <div className="flex justify-end">
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
