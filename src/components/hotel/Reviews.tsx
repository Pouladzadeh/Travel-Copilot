"use client";

/**
 * "What guests say" on Hotel detail: a Copilot summary of the sample reviews,
 * written once by the live model (scripts/summarize-reviews.ts). Each point
 * opens the reviews it comes from, so the evidence is one click away.
 */
import { useState } from "react";
import type { Hotel } from "@/lib/hotels";
import summaries from "@/lib/reviewSummaries.json";
import { reviewsFor } from "@/lib/reviews";
import { Icon } from "../Icon";

type Summary = { points: { text: string; reviews: number[] }[] };
const SUMMARIES = (summaries as { summaries: Record<string, Summary> }).summaries;

export function GuestReviews({ hotel }: { hotel: Hotel }) {
  const reviews = reviewsFor(hotel.id);
  const summary = SUMMARIES[hotel.id];
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  if (!reviews.length) return null;
  const shown = all ? reviews : reviews.slice(0, 3);

  return (
    <section className="flex flex-col gap-16" aria-labelledby="reviews-heading">
      <div className="flex items-end gap-16">
        <div className="flex flex-1 flex-col gap-4">
          <h2 id="reviews-heading" className="text-heading-s md:text-heading-m text-fg">
            What guests say
          </h2>
          <p className="text-body-m text-fg-secondary">
            {hotel.rating.toFixed(1)} out of 5 · {hotel.reviewCount.toLocaleString("en-US")} reviews
          </p>
        </div>
      </div>

      {summary && (
        <div className="border-line-copilot bg-copilot flex flex-col gap-12 rounded-lg border p-16 md:p-20">
          <p className="text-label-s text-fg-copilot flex items-center gap-6">
            <Icon name="sparkle" size={16} />
            Summarised by Copilot from {reviews.length} sample reviews
          </p>
          <ul className="flex flex-col gap-12">
            {summary.points.map((p, i) => {
              const isOpen = open === i;
              return (
                <li key={i} className="flex flex-col gap-6">
                  <p className="text-body-m text-fg">{p.text}</p>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="text-label-s text-fg-link self-start underline hover:no-underline"
                  >
                    {isOpen ? "Hide reviews" : `From ${p.reviews.length} of ${reviews.length} reviews`}
                  </button>
                  {isOpen && (
                    <ul className="border-line-copilot flex flex-col gap-8 border-l-2 pl-12">
                      {p.reviews.map((n) => (
                        <li key={n} className="text-body-s text-fg-secondary">
                          “{reviews[n - 1].text}” <span className="text-fg-tertiary">· {reviews[n - 1].meta}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-body-s text-fg-secondary">Copilot can be wrong. Each point links to the reviews it comes from.</p>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
        {shown.map((r) => (
          <li key={r.text} className="border-line bg-surface flex min-w-0 flex-col gap-12 rounded-lg border p-20">
            <p className="text-body-l text-fg">“{r.text}”</p>
            <p className="text-body-s text-fg-secondary">{r.meta}</p>
          </li>
        ))}
      </ul>
      {reviews.length > 3 && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
          className="text-label-m text-fg-link min-h-44 self-start hover:underline"
        >
          {all ? "Show fewer reviews" : `Read all ${reviews.length} sample reviews`}
        </button>
      )}
    </section>
  );
}
