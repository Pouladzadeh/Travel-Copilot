"use client";

/**
 * "What guests say" on Hotel detail: the Copilot review summary, then the
 * sample reviews themselves.
 */
import { useState } from "react";
import type { Hotel } from "@/lib/hotels";
import { reviewsFor } from "@/lib/reviews";
import { ReviewSummary } from "../reviews/ReviewSummary";

export function GuestReviews({ hotel }: { hotel: Hotel }) {
  const reviews = reviewsFor(hotel.id);
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

      <ReviewSummary hotelId={hotel.id} variant="page" />

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
