"use client";

/**
 * "Guests say": one sentence summing up all of a stay's sample reviews, with
 * what guests liked and what to watch for. Written once by the live model
 * (scripts/summarize-reviews.ts). Every label opens the reviews it comes from.
 */
import { useState } from "react";
import summaries from "@/lib/reviewSummaries.json";
import { reviewsFor } from "@/lib/reviews";
import { Icon } from "../Icon";

type Point = { label: string; reviews: number[] };
export type ReviewSummaryData = { summary: string; liked: Point[]; watchFor: Point[] };
const SUMMARIES = (summaries as unknown as { summaries: Record<string, ReviewSummaryData> }).summaries;

export function reviewSummaryFor(id: string): ReviewSummaryData | undefined {
  return SUMMARIES[id];
}

export function ReviewSummary({ hotelId, variant }: { hotelId: string; variant: "card" | "page" }) {
  const data = SUMMARIES[hotelId];
  const reviews = reviewsFor(hotelId);
  const [open, setOpen] = useState<string | null>(null);
  if (!data || !reviews.length) return null;

  const card = variant === "card";
  const liked = card ? data.liked.slice(0, 2) : data.liked;
  const watch = card ? data.watchFor.slice(0, 1) : data.watchFor;
  const openPoint = [...data.liked, ...data.watchFor].find((p) => p.label === open);

  const chip = (p: Point, kind: "liked" | "watch") => {
    const isOpen = open === p.label;
    return (
      <li key={p.label}>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={`${kind === "liked" ? "Guests liked" : "Watch for"}: ${p.label}, from ${p.reviews.length} of ${reviews.length} reviews. ${isOpen ? "Hide" : "Show"} reviews`}
          onClick={() => setOpen(isOpen ? null : p.label)}
          className={`rounded-pill text-label-s flex min-h-28 items-center gap-6 border px-10 py-4 transition-colors ${
            kind === "liked"
              ? "bg-confirmed text-fg-confirmed border-transparent hover:border-[color:var(--color-text-confirmed)]"
              : "bg-unconfirmed text-fg-unconfirmed border-transparent hover:border-[color:var(--color-text-unconfirmed)]"
          } ${isOpen ? (kind === "liked" ? "!border-[color:var(--color-text-confirmed)]" : "!border-[color:var(--color-text-unconfirmed)]") : ""}`}
        >
          <Icon name={kind === "liked" ? "pill-check" : "pill-alert"} size={12} />
          {p.label}
          <span className="opacity-70">· {p.reviews.length}</span>
        </button>
      </li>
    );
  };

  const quotes = openPoint && (
    <ul className="border-line-copilot flex flex-col gap-8 border-l-2 pl-12">
      {openPoint.reviews.map((n) => (
        <li key={n} className="text-body-s text-fg-secondary">
          “{reviews[n - 1].text}” <span className="text-fg-tertiary">· {reviews[n - 1].meta}</span>
        </li>
      ))}
    </ul>
  );

  if (card) {
    return (
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-label-s text-fg-secondary flex items-center gap-4">
            <Icon name="star" size={14} />
            What guests say · Copilot summary of {reviews.length} sample reviews
          </p>
          <p className="text-body-m text-fg">{data.summary}</p>
        </div>
        <ul className="flex flex-wrap gap-8" aria-label="From the reviews">
          {liked.map((p) => chip(p, "liked"))}
          {watch.map((p) => chip(p, "watch"))}
        </ul>
        {quotes}
      </div>
    );
  }

  return (
    <div className="border-line-copilot bg-copilot flex flex-col gap-16 rounded-lg border p-16 md:p-20">
      <p className="text-label-s text-fg-copilot flex items-center gap-6">
        <Icon name="sparkle" size={16} />
        Summarised by Copilot from {reviews.length} sample reviews
      </p>
      <p className="text-body-l text-fg">{data.summary}</p>
      <div className="flex flex-col gap-12 md:flex-row md:gap-32">
        <div className="flex flex-col gap-8">
          <p className="text-label-s text-fg-secondary">Guests liked</p>
          <ul className="flex flex-wrap gap-8">{liked.map((p) => chip(p, "liked"))}</ul>
        </div>
        {watch.length > 0 && (
          <div className="flex flex-col gap-8">
            <p className="text-label-s text-fg-secondary">Watch for</p>
            <ul className="flex flex-wrap gap-8">{watch.map((p) => chip(p, "watch"))}</ul>
          </div>
        )}
      </div>
      {quotes}
      <p className="text-body-s text-fg-secondary">Copilot can be wrong. Tap a label to see the reviews it comes from.</p>
    </div>
  );
}
