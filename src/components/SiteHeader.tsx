"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

/**
 * Site header (Figma "Site header" 24:472, Mobile · Home 90:1186). 76px on
 * desktop, 68px on phones where Help, Trips and language move into the
 * account menu. `center` holds the compact search on scroll (78:366),
 * shown from tablet up.
 */
export function SiteHeader({ center, className = "" }: { center?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menu.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <header className={`flex w-full justify-center ${className}`}>
      <div className="flex w-full max-w-[var(--container)] items-center justify-between gap-16 px-20 py-12 md:px-32 md:py-16">
        <Link href="/" aria-label="HelloWorld Booking, home" className="flex shrink-0 items-center gap-32">
          <Logo />
        </Link>
        {center && <div className="hidden min-w-0 lg:flex">{center}</div>}
        <nav className="flex items-center gap-24" aria-label="Account">
          <Link href="#" className="text-label-m text-fg hidden hover:underline md:inline">
            Help
          </Link>
          <Link href="/trip" className="text-label-m text-fg hidden hover:underline md:inline">
            Trips
          </Link>
          <div className="flex items-center gap-8">
            <button
              type="button"
              aria-label="Language and currency: English (US), USD"
              className="rounded-pill hover:bg-subtle hidden size-40 items-center justify-center md:flex"
            >
              <Icon name="globe" size={20} />
            </button>
            <div className="relative" ref={menu}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen(!open)}
                className="rounded-pill border-line bg-surface flex min-h-44 items-center gap-[10px] border py-[5px] pr-[6px] pl-[14px] hover:shadow-sm"
              >
                <Icon name="menu" size={18} />
                <span className="rounded-pill bg-brand-subtle text-label-m text-fg-link flex size-32 items-center justify-center">P</span>
              </button>
              {open && (
                <div
                  role="menu"
                  className="border-line bg-surface absolute top-[calc(100%+8px)] right-0 z-40 flex w-[220px] flex-col rounded-md border py-8 shadow-[0px_12px_32px_0px_rgba(13,20,48,0.16)]"
                >
                  {[
                    ["Trips", "/trip"],
                    ["My data", "/my-data"],
                    ["How Copilot ranks stays", "/how-copilot-ranks"],
                    ["Help", "#"],
                  ].map(([label, href]) => (
                    <Link
                      key={label}
                      role="menuitem"
                      href={href}
                      onClick={() => setOpen(false)}
                      className="text-body-m text-fg hover:bg-subtle px-16 py-12"
                    >
                      {label}
                    </Link>
                  ))}
                  <span className="border-line text-body-s text-fg-secondary mt-4 flex items-center gap-8 border-t px-16 pt-12 pb-4">
                    <Icon name="globe" size={16} />
                    English (US) · USD
                  </span>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
