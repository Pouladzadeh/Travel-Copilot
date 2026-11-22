"use client";

import Image from "next/image";
import { useState } from "react";
import { money2 } from "@/lib/booking";
import { updateBooking, type BookingRecord } from "@/lib/bookingRecord";
import { clearConversation, useCurrentConversation } from "@/lib/copilot/store";
import { dayLabel } from "@/lib/dates";
import type { Hotel } from "@/lib/hotels";
import { beforeYouTravel, bookingQuote, keptSummary, requirementsOf, type ChecklistItem } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { MessageHotelDialog } from "../feedback/MessageHotel";
import { Icon, ThumbDownIcon } from "../Icon";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
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
  const [messaging, setMessaging] = useState(false);
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
              <Button variant="secondary" onClick={() => setMessaging(true)}>
                Review and send
              </Button>
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
      {messaging && item.draft && <MessageHotelDialog hotelId={h.id} draft={item.draft} onClose={() => setMessaging(false)} />}
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

/** Confirmation number with Copy (74:1090). */
export function ConfirmationNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the number stays on screen */
    }
  }
  return (
    <div className="bg-subtle flex items-center gap-12 rounded-md px-12 py-8">
      <span className="text-body-s text-fg-secondary">Confirmation number</span>
      <span className="text-heading-s text-fg">{value}</span>
      <button type="button" onClick={copy} className="text-label-m text-fg-link flex items-center gap-4 hover:underline">
        <Icon name="copy" size={16} />
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Confirmation number copied" : ""}
      </span>
    </div>
  );
}

/** "Your stay" (74:1102). */
export function YourStay({ b, h }: { b: BookingRecord; h: Hotel }) {
  const address = h.address ?? `${h.neighborhood}, FL`;
  return (
    <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="your-stay">
      <div className="flex items-center justify-between gap-16">
        <h2 id="your-stay" className="text-heading-m text-fg">
          Your stay
        </h2>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noreferrer"
          className="text-label-m text-fg-link hover:underline"
        >
          Get directions<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-x-24 gap-y-16">
        {[
          ["Address", address],
          ["Hotel phone", h.phone],
          [
            "Check-in",
            `${dayLabel(b.checkIn)}, ${h.checkInFrom.toLowerCase()}.${h.late.status === "confirmed" ? " Front desk open 24 hours." : ""}`,
          ],
          ["Check-out", `${dayLabel(b.checkOut)}, ${h.checkOutUntil.toLowerCase()}`],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-2">
            <dt className="text-body-s text-fg-secondary">{k}</dt>
            <dd className="text-body-l text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** "Before you travel" (17:475). */
export function BeforeYouTravel({ b, h, onPerson }: { b: BookingRecord; h: Hotel; onPerson: () => void }) {
  return (
    <section className="border-line-copilot bg-copilot flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="before">
      <h2 id="before" className="text-heading-m text-fg flex items-center gap-8">
        <Icon name="sparkle" size={20} />
        Before you travel
      </h2>
      <p className="text-body-m text-fg-secondary">
        A short checklist from Copilot, based on what it could and could not confirm while you were choosing.
      </p>
      <ul className="flex flex-col">
        {beforeYouTravel(b, h).map((it) => (
          <ChecklistRow key={it.key} item={it} h={h} onPerson={onPerson} />
        ))}
      </ul>
    </section>
  );
}

/** "What Copilot kept from this trip" (17:528), with a confirmed delete. */
export function KeptData({ b }: { b: BookingRecord }) {
  const { conversation } = useCurrentConversation();
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const hasConversation = !!conversation && conversation.items.length > 0 && step !== "done";
  const anything = requirementsOf(b).length > 0 || b.askedAboutCancelling || hasConversation;
  return (
    <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="kept">
      <h2 id="kept" className="text-heading-m text-fg">
        What Copilot kept from this trip
      </h2>
      {step === "done" ? (
        <p className="text-body-m text-fg" role="status">
          Deleted. Your requirements and the conversation for this trip are gone. Your reservation is not affected.
        </p>
      ) : (
        <p className="text-body-m text-fg">{keptSummary(b, hasConversation)}</p>
      )}
      {step === "confirm" ? (
        <div className="bg-danger flex flex-col gap-12 rounded-md p-16" role="alertdialog" aria-labelledby="del-q">
          <p id="del-q" className="text-label-m text-fg">
            Delete this trip’s Copilot data? This cannot be undone. Your reservation stays booked.
          </p>
          <div className="flex gap-8">
            <Button
              onClick={() => {
                clearConversation();
                updateBooking((x) => ({ ...x, requirements: "", askedAboutCancelling: false }));
                setStep("done");
              }}
            >
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setStep("idle")}>
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-8">
          <ButtonLink href="/my-data" variant="secondary">
            Review my data
          </ButtonLink>
          {step !== "done" && anything && (
            <Button variant="ghost" onClick={() => setStep("confirm")}>
              Delete this trip’s data
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/** No reservation in this tab (sample data lives only for the session). */
export function NoBooking() {
  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex min-h-[60vh] justify-center">
        <div className="flex w-full max-w-[var(--container)] flex-col items-start gap-12 p-32">
          <h1 className="text-heading-l text-fg">No trips yet</h1>
          <p className="text-body-m text-fg-secondary">
            Reservations on this site are sample data, kept only while this browser tab is open. Book a stay to see it here.
          </p>
          <ButtonLink href="/">Search stays</ButtonLink>
        </div>
      </main>
      <SlimFooter />
    </>
  );
}
