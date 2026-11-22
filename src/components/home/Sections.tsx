import Image from "next/image";
import Link from "next/link";
import { guestCount, proseRange } from "@/lib/dates";
import { decodeRequirements, encodeRequirements } from "@/lib/requirements";
import { FEATURED_STAYS, RECENT_SEARCH } from "@/lib/sample-data";
import { ButtonLink } from "../Button";
import { Icon } from "../Icon";

/** Static Home sections: trust strip, recent search, featured stays. */

export function TrustStrip() {
  const items = ["Totals always include taxes and fees", "Cancellation terms shown before you pay", "Talk to a person at any step"];
  return (
    <div className="border-line bg-surface flex justify-center border-b">
      <ul className="flex w-full max-w-[var(--container)] items-center justify-between px-32 py-20">
        {items.map((t) => (
          <li key={t} className="text-label-m text-fg flex items-center gap-8">
            <Icon name="trust-check" size={18} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecentSearch() {
  const r = RECENT_SEARCH;
  const reqs = decodeRequirements(r.requirements.join(","));
  const href = `/results?${new URLSearchParams({
    destination: r.destination,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    adults: String(r.adults),
    req: encodeRequirements(reqs),
  }).toString()}`;
  return (
    <section className="flex justify-center" aria-labelledby="recent-heading">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-16 px-32 py-64">
        <h2 id="recent-heading" className="text-heading-l text-fg">
          Pick up where you left off
        </h2>
        <div className="border-line bg-surface flex items-center gap-16 rounded-lg border px-24 py-20">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <p className="text-heading-s text-fg">
              {r.destination} · {proseRange(r.checkIn, r.checkOut)} · {guestCount(r.adults, r.children)}
            </p>
            <p className="text-body-m text-fg-secondary">
              {reqs.map((q) => q.label).join(" · ")} · {r.staysFit} stays fit
            </p>
          </div>
          <ButtonLink href={href}>Continue</ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function FeaturedStays() {
  return (
    <section className="flex justify-center" aria-labelledby="featured-heading">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-24 px-32 pt-32 pb-64">
        <div className="flex items-end gap-16">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <h2 id="featured-heading" className="text-heading-l text-fg">
              Highly rated stays in Miami
            </h2>
            <p className="text-body-m text-fg-secondary">
              Prices are for one night before taxes and fees. Totals appear once you add dates.
            </p>
          </div>
          <ButtonLink href="/results?destination=Miami&adults=2" variant="secondary">
            See all Miami stays
          </ButtonLink>
        </div>
        <ul className="flex gap-24">
          {FEATURED_STAYS.map((h) => (
            <li key={h.id} className="min-w-0 flex-1">
              <Link
                href={`/hotels/${h.id}`}
                className="border-line bg-surface flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-[0px_12px_32px_0px_rgba(13,20,48,0.12)]"
              >
                <span className="relative h-[210px] w-full">
                  <Image src={h.photo} alt={`Photo of ${h.name}`} fill sizes="390px" className="object-cover" />
                </span>
                <span className="flex flex-col gap-8 p-20">
                  <span className="text-heading-s text-fg">{h.name}</span>
                  <span className="text-body-s text-fg-secondary flex items-center gap-4">
                    <Icon name="star-featured" size={14} />
                    {h.rating.toFixed(1)} · {h.reviewCount.toLocaleString("en-US")} reviews
                  </span>
                  <span className="text-body-s text-fg-secondary">{h.neighborhood}</span>
                  <span className="flex items-end gap-4 pt-8">
                    <span className="text-price-m text-fg">From ${h.fromPrice}</span>
                    <span className="text-body-s text-fg-secondary">a night</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
