import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

/**
 * Site header (Figma "Site header" 24:472). 76px, 1280 container.
 * `center` holds the compact search on scroll (Figma state 78:366).
 */
export function SiteHeader({ center, className = "" }: { center?: ReactNode; className?: string }) {
  return (
    <header className={`flex w-full justify-center ${className}`}>
      <div className="flex w-full max-w-[var(--container)] items-center justify-between px-32 py-16">
        <Link href="/" aria-label="HelloWorld Booking, home" className="flex items-center gap-32">
          <Logo />
        </Link>
        {center}
        <nav className="flex items-center gap-24" aria-label="Account">
          <Link href="#" className="text-label-m text-fg hover:underline">
            Help
          </Link>
          <Link href="/trip" className="text-label-m text-fg hover:underline">
            Trips
          </Link>
          <div className="flex items-center gap-8">
            <button
              type="button"
              aria-label="Language and currency: English (US), USD"
              className="rounded-pill hover:bg-subtle flex size-40 items-center justify-center"
            >
              <Icon name="globe" size={20} />
            </button>
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-pill border-line bg-surface flex items-center gap-[10px] border py-[5px] pr-[6px] pl-[14px] hover:shadow-sm"
            >
              <Icon name="menu" size={18} />
              <span className="rounded-pill bg-brand-subtle text-label-m text-fg-link flex size-32 items-center justify-center">P</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
