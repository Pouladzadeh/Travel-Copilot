"use client";

import Image from "next/image";
import { ButtonLink } from "./Button";
import { Icon } from "./Icon";
import { StatusPill, type PillType } from "./StatusPill";

/**
 * Hotel card (Figma 8:178): one result. The teal block is the only part
 * Copilot writes: a reason, and where the evidence came from.
 */
export type HotelCardFact = { type: PillType; label: string };

type HotelCardProps = {
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  pricePerNight: number;
  totalWithFees: number;
  /** Copilot's reason. Omit to hide the teal block. */
  reason?: string;
  /** Label above the reason: "Why this fits", "Why it is here", "How it matches your request". */
  reasonLabel?: string;
  sources?: string;
  facts?: HotelCardFact[];
  /** Optional tag above the name, e.g. Wildcard or Sponsored. */
  tag?: HotelCardFact;
  photo?: string;
  photoCount?: number;
  href: string;
  compareChecked?: boolean;
  onCompareChange?: (checked: boolean) => void;
  saved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  className?: string;
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function HotelCard({
  name,
  rating,
  reviewCount,
  location,
  pricePerNight,
  totalWithFees,
  reason,
  reasonLabel = "Why this fits",
  sources,
  facts = [],
  tag,
  photo,
  photoCount = 12,
  href,
  compareChecked = false,
  onCompareChange,
  saved = false,
  onSaveChange,
  className = "",
}: HotelCardProps) {
  return (
    <article
      className={`flex items-stretch overflow-hidden rounded-lg border border-line bg-surface ${className}`}
    >
      <div className="relative flex w-[220px] shrink-0 items-center justify-center bg-subtle">
        {photo ? (
          <Image src={photo} alt={`Photo of ${name}`} fill sizes="220px" className="object-cover" />
        ) : (
          <Icon name="card-image" size={32} />
        )}
        <button
          type="button"
          aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
          aria-pressed={saved}
          onClick={() => onSaveChange?.(!saved)}
          className="absolute right-12 top-12 flex size-36 items-center justify-center rounded-[18px] bg-white/92 shadow-[0px_2px_8px_0px_rgba(13,20,48,0.18)]"
        >
          <Icon name="heart" size={18} />
        </button>
        <span className="absolute bottom-12 left-12 rounded-pill bg-[rgba(13,20,48,0.6)] px-8 py-4 text-label-s text-fg-on-brand">
          1 / {photoCount}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-16 p-20">
        {tag && <StatusPill type={tag.type} label={tag.label} />}

        <div className="flex w-full items-start gap-16">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <h3 className="text-heading-s text-fg">{name}</h3>
            <p className="flex items-center gap-4 text-body-s text-fg-secondary">
              <Icon name="star" size={14} />
              {rating.toFixed(1)} · {reviewCount.toLocaleString("en-US")} reviews
            </p>
            <p className="flex items-center gap-4 text-body-s text-fg-secondary">
              <Icon name="card-pin" size={14} />
              {location}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 whitespace-nowrap">
            <p className="text-price-l text-fg">{usd(pricePerNight)}</p>
            <p className="text-body-s text-fg-secondary">per night</p>
            <p className="text-label-s text-fg">{usd(totalWithFees)} total with fees</p>
          </div>
        </div>

        {reason && (
          <div className="flex w-full flex-col gap-4 rounded-md border border-line-copilot bg-copilot p-12">
            <p className="flex items-center gap-4 text-label-s text-fg-copilot">
              <Icon name="card-sparkle" size={14} />
              {reasonLabel}
            </p>
            <p className="text-body-m text-fg">{reason}</p>
            {sources && <p className="text-body-s text-fg-secondary">{sources}</p>}
          </div>
        )}

        {facts.length > 0 && (
          <ul className="flex w-full flex-wrap gap-8">
            {facts.map((f) => (
              <li key={f.label}>
                <StatusPill type={f.type} label={f.label} />
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-16">
          <ButtonLink href={href}>View hotel</ButtonLink>
          <label className="flex cursor-pointer items-center gap-8 text-label-m text-fg">
            <span className="relative size-20">
              <input
                type="checkbox"
                checked={compareChecked}
                onChange={(e) => onCompareChange?.(e.target.checked)}
                className="peer absolute inset-0 size-20 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-line-input bg-surface checked:border-brand checked:bg-brand"
              />
              <span className="pointer-events-none absolute inset-0 hidden peer-checked:block">
                <Icon name="checkbox-check" size={20} />
              </span>
            </span>
            Compare
          </label>
        </div>
      </div>
    </article>
  );
}
