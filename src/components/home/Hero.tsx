"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { guestsLabel, shortRange } from "@/lib/dates";
import { Icon } from "../Icon";
import { SearchCard } from "../search/SearchCard";
import { useSearch } from "../search/searchState";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";

/**
 * Home hero (Figma 38:514): the cobalt hotel artwork, staged on a spotlight,
 * with two floating evidence cards. Art positions are measured from the right
 * edge and the vertical centre so they track the hero as the card grows
 * (Home · search filled is 37px taller and the art moves down by half).
 */

function CompactSearch() {
  const { state, dispatch, resultsHref } = useSearch();
  function openDestination() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch({ type: "open", picker: "destination" });
  }
  return (
    <div className="flex items-center gap-12 rounded-pill border border-line-input bg-surface py-[6px] pl-16 pr-[6px]">
      <button type="button" onClick={openDestination} className="flex items-center gap-12 text-left">
        <span className="text-label-m text-fg">{state.destination || "Where to?"}</span>
        <span className="h-16 w-px bg-line-strong" aria-hidden="true" />
        <span className="text-body-m text-fg-secondary">
          {state.checkIn && state.checkOut ? shortRange(state.checkIn, state.checkOut) : "Add dates"}
        </span>
        <span className="h-16 w-px bg-line-strong" aria-hidden="true" />
        <span className="text-body-m text-fg-secondary">{guestsLabel(state.adults, state.children, state.rooms)}</span>
      </button>
      <a
        href={resultsHref ?? "#"}
        onClick={(e) => {
          if (!resultsHref) {
            e.preventDefault();
            openDestination();
          }
        }}
        aria-label="Search stays"
        className="flex size-32 items-center justify-center rounded-[16px] bg-brand hover:bg-brand-hover"
      >
        <Icon name="compact-search" size={16} />
      </a>
    </div>
  );
}

function FloatCard({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div
      className={`absolute rounded-[16px] border border-white/90 bg-white/[0.82] px-16 py-[14px] shadow-[0px_18px_40px_-6px_rgba(13,26,77,0.22)] backdrop-blur-[10px] ${className}`}
    >
      {children}
    </div>
  );
}

export function Hero() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Header · on scroll (Figma state 78:366) */}
      <div
        aria-hidden={!scrolled}
        inert={!scrolled}
        className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-surface shadow-[0px_4px_16px_0px_rgba(13,20,48,0.1)] transition-transform duration-200 ${
          scrolled ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <SiteHeader center={<CompactSearch />} />
      </div>

      <section className="relative overflow-hidden bg-[#f2f4f7]" aria-label="Find a stay">
        {/* Artwork layers, all decorative */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-278px] top-[calc(50%-521.2px)] h-[1000px] w-[1300px]">
            <div className="absolute inset-[-16%_-12.31%]">
              <img src="/visuals/hero-spotlight.svg" alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute right-[-83.2px] top-[calc(50%+274.12px)] h-[110px] w-[820px]">
            <div className="absolute inset-[-43.64%_-5.85%]">
              <img src="/visuals/hero-ground-shadow.svg" alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute right-[-84px] top-[calc(50%+43px)] h-[642px] w-[1140px] -translate-y-1/2">
            <Image src="/visuals/cobalt-hotel.png" alt="" fill priority sizes="1140px" className="object-contain" />
          </div>
          <FloatCard className="right-[93.6px] top-[calc(50%-296px)] flex flex-col items-start gap-[6px]">
            <StatusPill type="confirmed" label="Late check-in confirmed" />
            <p className="whitespace-nowrap text-label-m text-fg">Front desk open 24 hours</p>
            <p className="whitespace-nowrap text-body-s text-fg-secondary">Source: hotel policy page</p>
          </FloatCard>
          <FloatCard className="right-[405.4px] top-[calc(50%+264.86px)] flex items-center gap-[10px]">
            <Icon name="float-pin" size={20} />
            <span className="flex flex-col whitespace-nowrap">
              <span className="text-label-m text-fg">20 min from the airport</span>
              <span className="text-body-s text-fg-secondary">At night, by car</span>
            </span>
          </FloatCard>
          <div className="absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-b from-white/0 to-white" />
        </div>

        <SiteHeader className="relative" />

        <div className="relative flex justify-center">
          <div className="flex w-full max-w-[var(--container)] flex-col px-32 pb-[120px] pt-80">
            <div className="flex w-[680px] flex-col gap-32">
              <div className="flex flex-col gap-16">
                <h1 className="w-[640px] text-[68px] font-bold leading-[68px] tracking-[-1.7px] text-fg">
                  Find a stay that fits your trip.
                </h1>
                <p className="text-body-l text-fg-secondary">
                  Search the usual way, or tell Travel Copilot what matters. Every match shows why it fits.
                </p>
              </div>
              <SearchCard />
            </div>
          </div>
        </div>
        <div ref={sentinel} className="absolute bottom-0 h-px w-full" aria-hidden="true" />
      </section>
    </>
  );
}
