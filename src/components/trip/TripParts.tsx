"use client";

import Image from "next/image";
import { useState } from "react";
import { money2 } from "@/lib/booking";
import type { BookingRecord } from "@/lib/bookingRecord";
import { dayLabel } from "@/lib/dates";
import type { Hotel } from "@/lib/hotels";
import { bookingQuote, type ChecklistItem } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { Icon, ThumbDownIcon } from "../Icon";
import { StatusPill } from "../StatusPill";

/** Booking summary after paying (Confirmation 17:536, Trip). */
export function PaidSummary({ b, h, adults = 2 }: { b: BookingRecord; h: Hotel; adults?: number }) {
  const q = bookingQuote(b, h);
  return (
    <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-label="Booking summary">
      <div className="bg-subtle relative h-[170px] overflow-hidden rounded-md">
        {h.photo && <Image src={h.photo} alt={`${h.name}, outside`} fill sizes="352px" className="object-cover" />}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-heading-s text-fg">{h.name}</p>
        <p className="text-body-s text-fg-secondary flex items-center gap-4">
          <Icon name="star" size={14} />
          {h.rating.toFixed(1)} · {h.reviewCount.toLocaleString("en-US")} reviews · {h.neighborhood}
        </p>
      </div>
      <dl className="border-line text-body-m flex flex-col gap-8 border-t pt-12">
        {[
          ["Room", q.room],
          ["Check-in", dayLabel(b.checkIn)],
          ["Check-in time", h.checkInFrom],
          ["Check-out", dayLabel(b.checkOut)],
          ["Guests", `${adults} ${adults === 1 ? "guest" : "guests"}, 1 room`],
          ...(b.arrival ? [["Arrival", b.arrival]] : []),
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-16">
            <dt className="text-fg-secondary shrink-0">{k}</dt>
            <dd className="text-label-m text-fg text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex">
        {b.cancelledOn ? (
          <StatusPill type="danger" label="Cancelled" />
        ) : q.refundable ? (
          <StatusPill
            type="confirmed"
            label={q.freeUntil ? `Free cancellation until ${dayLabel(q.freeUntil).split(", ")[1]}` : "Free cancellation"}
          />
        ) : (
          <StatusPill type="danger" label="Non-refundable" />
        )}
      </div>
      <div className="border-line text-body-m flex flex-col gap-8 border-t pt-12">
        <div className="flex justify-between">
          <span className="text-fg-secondary">
            {q.nights} {q.nights === 1 ? "night" : "nights"} × {money2(q.perNight)}
          </span>
          <span className="text-fg">{money2(q.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-fg-secondary">Taxes and fees</span>
          <span className="text-fg">{money2(q.taxes)}</span>
        </div>
      </div>
      <div className="border-line flex items-center justify-between border-t pt-12">
        <p className="text-heading-s text-fg">{b.cancelledOn && q.refundable ? "Refunded" : "Paid"}</p>
        <p className="text-price-l text-fg">{money2(q.total)}</p>
      </div>
      <p className="text-body-s text-fg-secondary">
        {b.cancelledOn && q.refundable ? "Refunded to" : "Charged to"} the card ending in {b.last4}
      </p>
    </section>
  );
}

/** One row of "Before you travel". */
export function ChecklistRow({ item, h, onPerson }: { item: ChecklistItem; h: Hotel; onPerson: () => void }) {
  return (
    <li className="border-line-copilot flex items-start gap-24 border-t py-16">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h3 className="text-heading-s text-fg">{item.title}</h3>
        <p className="text-body-m text-fg">{item.text}</p>
        <p className="text-body-s text-fg-secondary">{item.source}</p>
        {item.draft && (
          <div className="flex flex-col gap-12 pt-8">
            <div className="border-line bg-surface flex flex-col gap-4 rounded-md border p-12">
              <p className="text-label-s text-fg-copilot">Drafted by Copilot. Nothing is sent until you send it.</p>
              <p className="text-body-m text-fg">“{item.draft}”</p>
            </div>
            <div className="flex items-center gap-16">
              <ButtonLink href={`/message-hotel?hotel=${h.id}&draft=${encodeURIComponent(item.draft)}`} variant="secondary">
                Review and send
              </ButtonLink>
              {item.call && (
                <a href={`tel:${h.phone.replace(/\D/g, "")}`} className="text-label-m text-fg-link hover:underline">
                  Or call {h.phone}
                </a>
              )}
            </div>
          </div>
        )}
        {item.person && (
          <div className="pt-8">
            <Button variant="secondary" onClick={onPerson}>
              Talk to a person
            </Button>
          </div>
        )}
      </div>
      <StatusPill type={item.pill.type} label={item.pill.label} />
    </li>
  );
}

/** "Did Copilot help with this trip?" (74:1134). Kept on this page only until evals are wired up. */
export function TripFeedback() {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <section className="border-line bg-surface flex items-center gap-16 rounded-lg border px-24 py-16" aria-labelledby="trip-feedback">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 id="trip-feedback" className="text-label-m text-fg">
          Did Copilot help with this trip?
        </h2>
        <p className="text-body-s text-fg-secondary" aria-live="polite">
          {vote ? "Thanks. Your answer is recorded with this trip." : "Your answer is used to check the quality of Copilot’s answers."}
        </p>
      </div>
      <div className="flex gap-8">
        {(["up", "down"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={vote === v}
            aria-label={v === "up" ? "Yes, Copilot helped" : "No, Copilot did not help"}
            onClick={() => setVote(vote === v ? null : v)}
            className={`flex size-44 items-center justify-center rounded-md border ${vote === v ? "border-line-focus bg-brand-subtle" : "border-line-strong bg-surface hover:bg-subtle"}`}
          >
            {v === "up" ? <Icon name="thumb-up" size={20} /> : <ThumbDownIcon size={20} />}
          </button>
        ))}
      </div>
    </section>
  );
}
