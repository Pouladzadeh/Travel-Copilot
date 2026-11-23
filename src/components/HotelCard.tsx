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
  /** Hidden when there are no dates yet. */
  totalWithFees?: number;
  /** Copilot's reason. Omit to hide the teal block. */
  reason?: string;
  /** Label above the reason: "Why this fits", "Why it is here", "How it matches your request". */
  reasonLabel?: string;
  sources?: string;
  /** Makes the sources line a button that opens the evidence view. */
  onSources?: () => void;
  facts?: HotelCardFact[];
  /** Joined the list after the last change ("New" tag). */
  isNew?: boolean;
  /** Outlined while its evidence is open in the Copilot panel. */
  highlighted?: boolean;
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
  /** "Guests say" summary of the reviews, under the pills. */
  guests?: React.ReactNode;
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
  onSources,
  facts = [],
  isNew = false,
  highlighted = false,
  tag,
  photo,
  photoCount = 12,
  href,
  compareChecked = false,
  onCompareChange,
  saved = false,
  onSaveChange,
  className = "",
  guests,
}: HotelCardProps) {
  return (
    <article
      className={`bg-surface flex flex-col items-stretch overflow-hidden rounded-lg border sm:flex-row ${
        highlighted ? "border-line-focus shadow-[0_0_0_1px_var(--color-border-focus)]" : "border-line"
      } ${className}`}
    >
      <div className="bg-subtle relative flex h-[200px] w-full shrink-0 items-center justify-center sm:h-auto sm:min-h-[220px] sm:w-[220px]">
        {photo ? (
          <Image src={photo} alt={`Photo of ${name}`} fill sizes="(min-width: 640px) 220px, 100vw" className="object-cover" />
        ) : (
          <Icon name="card-image" size={32} />
        )}
        <button
          type="button"
          aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
          aria-pressed={saved}
          onClick={() => onSaveChange?.(!saved)}
          className="absolute top-12 right-12 flex size-36 items-center justify-center rounded-[18px] bg-white/92 shadow-[0px_2px_8px_0px_rgba(13,20,48,0.18)]"
        >
          <Icon name="heart" size={18} />
        </button>
        <span className="rounded-pill text-label-s text-fg-on-brand absolute bottom-12 left-12 bg-[rgba(13,20,48,0.6)] px-8 py-4">
          1 / {photoCount}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-12 p-16 sm:gap-16 sm:p-20">
        {(tag || isNew) && (
          <div className="flex gap-8">
            {isNew && <StatusPill type="copilot" label="New" />}
            {tag && <StatusPill type={tag.type} label={tag.label} />}
          </div>
        )}

        <div className="flex w-full items-start gap-16">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <h3 className="text-heading-s text-fg">{name}</h3>
            <p className="text-body-s text-fg-secondary flex items-center gap-4">
              <Icon name="star" size={14} />
              {rating.toFixed(1)} · {reviewCount.toLocaleString("en-US")} reviews
            </p>
            <p className="text-body-s text-fg-secondary flex items-center gap-4">
              <Icon name="card-pin" size={14} />
              {location}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 whitespace-nowrap">
            <p className="text-price-l text-fg">{usd(pricePerNight)}</p>
            <p className="text-body-s text-fg-secondary">per night</p>
            {totalWithFees !== undefined && <p className="text-label-s text-fg">{usd(totalWithFees)} total with fees</p>}
          </div>
        </div>

        {reason && (
          <div className="border-line-copilot bg-copilot flex w-full flex-col gap-4 rounded-md border p-12">
            <p className="text-label-s text-fg-copilot flex items-center gap-4">
              <Icon name="card-sparkle" size={14} />
              {reasonLabel}
            </p>
            <p className="text-body-m text-fg">{reason}</p>
            {sources &&
              (onSources ? (
                <button
                  type="button"
                  onClick={onSources}
                  className="text-body-s text-fg-secondary decoration-line-strong hover:text-fg hover:decoration-fg text-left underline underline-offset-2"
                >
                  {sources}
                </button>
              ) : (
                <p className="text-body-s text-fg-secondary">{sources}</p>
              ))}
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

        {guests}

        <div className="flex w-full items-center gap-16 sm:w-auto">
          <ButtonLink href={href} className="flex-1 sm:flex-none">
            View hotel
          </ButtonLink>
          <label className="text-label-m text-fg flex cursor-pointer items-center gap-8">
            <span className="relative size-20">
              <input
                type="checkbox"
                checked={compareChecked}
                onChange={(e) => onCompareChange?.(e.target.checked)}
                className="peer border-line-input bg-surface checked:border-brand checked:bg-brand absolute inset-0 size-20 cursor-pointer appearance-none rounded-[5px] border-[1.5px]"
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
