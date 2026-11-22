"use client";

import Link from "next/link";
import type { Hotel } from "@/lib/hotels";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { StatusPill } from "../StatusPill";

/**
 * "Where this comes from" (Figma Evidence view 118:531). Opens in the panel
 * when a traveler selects a card's sources line. Confirmed and unconfirmed
 * claims have different layouts. Review quotes exist only for Sunset Harbor
 * in the design, so other stays show counts without quotes.
 */

const SUNSET_QUOTES = [
  { before: "", bold: "Quiet at night", after: ", and the front desk was there when we arrived at 1 am.", meta: "Feb 2026 · Couple" },
  { before: "The street side can be ", bold: "noisy on Saturdays", after: ".", meta: "Jan 2026 · Solo traveler" },
];

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-8">
      <button type="button" onClick={onBack} aria-label="Back to the conversation" className="rounded-pill hover:bg-subtle p-4">
        <Icon name="cal-previous" size={20} />
      </button>
      <p className="text-heading-s text-fg flex-1">Where this comes from</p>
      <Button variant="ghost" onClick={onBack} className="!px-8">
        Close
      </Button>
    </div>
  );
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-body-m text-fg flex justify-between">
        <span>{label}</span>
        <span className="text-label-s">{count.toLocaleString("en-US")}</span>
      </div>
      <div className="rounded-pill bg-subtle h-[6px]">
        <div className="rounded-pill h-full" style={{ width: `${Math.max(2, (count / total) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export function EvidenceView({ hotel, onClose }: { hotel: Hotel; onClose: () => void }) {
  const unconfirmed = hotel.late.status === "unconfirmed";

  if (unconfirmed) {
    return (
      <div className="flex flex-col gap-20">
        <Header onBack={onClose} />
        <div className="border-line bg-page flex flex-col gap-8 rounded-md border p-16">
          <p className="text-label-s text-fg-secondary">{hotel.name}</p>
          <p className="text-heading-s text-fg">I could not confirm that you can check in after midnight.</p>
          <StatusPill type="unconfirmed" label="Late check-in unconfirmed" />
        </div>
        <div className="flex flex-col gap-12">
          <p className="text-label-m text-fg">Where Copilot looked</p>
          {[
            { t: "Hotel listing", d: "Check-in from 3:00 pm. No closing time for the front desk." },
            { t: "Hotel policy page", d: "Not published by this hotel." },
            { t: `${hotel.reviewCount.toLocaleString("en-US")} guest reviews`, d: "None mention arriving after 11 pm." },
          ].map((s) => (
            <div key={s.t} className="flex gap-12">
              <Icon name="search" size={20} />
              <div className="flex flex-col">
                <p className="text-body-m text-fg">{s.t}</p>
                <p className="text-body-m text-fg-secondary">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-line h-px" />
        <div className="flex flex-col gap-4">
          <p className="text-label-m text-fg">What this means</p>
          <p className="text-body-m text-fg-secondary">It may well be possible. I just have nothing that says so, and I will not guess.</p>
        </div>
        <div className="bg-line h-px" />
        <div className="flex flex-col gap-12">
          <p className="text-label-m text-fg">How to check before you book</p>
          <div className="flex flex-wrap items-center gap-8">
            <Link
              href={`/message-hotel?hotel=${hotel.id}`}
              className="border-line-strong bg-surface text-label-m text-fg hover:bg-subtle inline-flex min-h-[44px] items-center rounded-md border px-20"
            >
              Message the hotel
            </Link>
            <a href={`tel:${hotel.phone.replace(/\D/g, "")}`} className="text-label-m text-fg-link px-12 hover:underline">
              Call {hotel.phone}
            </a>
          </div>
          <p className="text-body-s text-fg-secondary">Copilot can draft the message. You send it.</p>
        </div>
      </div>
    );
  }

  const neither = Math.max(0, hotel.reviewCount - hotel.quiet.quietMentions - hotel.quiet.noiseMentions);
  const claim =
    hotel.id === "sunset-harbor"
      ? "Arriving after midnight works, and guests often describe the street as quiet."
      : hotel.late.status === "conditional"
        ? "Arriving after midnight works if you call ahead on the day."
        : "Arriving after midnight works: the front desk is open 24 hours.";
  const pill =
    hotel.late.status === "conditional"
      ? ({ type: "conditional", label: "Late check-in if you call ahead" } as const)
      : ({ type: "confirmed", label: "Late check-in confirmed" } as const);

  return (
    <div className="flex flex-col gap-20">
      <Header onBack={onClose} />
      <div className="border-line-copilot bg-copilot flex flex-col gap-8 rounded-md border p-16">
        <p className="text-label-s text-fg-secondary">{hotel.name}</p>
        <p className="text-heading-s text-fg">{claim}</p>
        <StatusPill type={pill.type} label={pill.label} />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-label-s text-fg-copilot">Source 1 of 2</p>
        <p className="text-label-m text-fg">Hotel policy page</p>
        <p className="text-body-s text-fg-secondary">Published by the hotel · sample data</p>
        <blockquote className="border-icon-copilot text-body-m text-fg border-l-2 pl-12">“{hotel.late.evidence}”</blockquote>
        <a href="#" className="text-label-m text-fg-link hover:underline">
          Open the hotel’s policy page
        </a>
      </div>
      <div className="bg-line h-px" />
      <div className="flex flex-col gap-8">
        <p className="text-label-s text-fg-copilot">Source 2 of 2</p>
        <p className="text-label-m text-fg">Guest reviews</p>
        <p className="text-body-s text-fg-secondary">{hotel.reviewCount.toLocaleString("en-US")} reviews from the last 24 months</p>
        <Bar label="Mention “quiet”" count={hotel.quiet.quietMentions} total={hotel.reviewCount} color="var(--color-text-confirmed)" />
        <Bar label="Mention street noise" count={hotel.quiet.noiseMentions} total={hotel.reviewCount} color="var(--amber-600)" />
        <Bar label="Mention neither" count={neither} total={hotel.reviewCount} color="var(--ink-400)" />
        {hotel.id === "sunset-harbor" && (
          <div className="border-icon-copilot flex flex-col gap-8 border-l-2 pl-12">
            {SUNSET_QUOTES.map((q) => (
              <div key={q.meta}>
                <p className="text-body-m text-fg">
                  “{q.before}
                  <strong>{q.bold}</strong>
                  {q.after}”
                </p>
                <p className="text-body-s text-fg-secondary">{q.meta}</p>
              </div>
            ))}
          </div>
        )}
        <a href="#" className="text-label-m text-fg-link hover:underline">
          Read all {(hotel.quiet.quietMentions + hotel.quiet.noiseMentions).toLocaleString("en-US")} matching reviews
        </a>
      </div>
      {hotel.id === "sunset-harbor" && (
        <>
          <div className="bg-line h-px" />
          <div className="flex flex-col gap-4">
            <p className="text-label-m text-fg">What Copilot did not check</p>
            <p className="text-body-m text-fg-secondary">
              Which way your room faces. Bay-facing rooms are described as the quietest, and room allocation is up to the hotel.
            </p>
          </div>
        </>
      )}
      <div className="flex items-center justify-between">
        <p className="text-body-s text-fg-secondary">Does this not match the source?</p>
        <Link href={`/report?hotel=${hotel.id}`} className="text-label-m text-fg-link hover:underline">
          Report this answer
        </Link>
      </div>
    </div>
  );
}
