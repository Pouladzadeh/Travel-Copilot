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
    <div className="rounded-pill border-line-input bg-surface flex items-center gap-12 border py-[6px] pr-[6px] pl-16">
      <button type="button" onClick={openDestination} className="flex items-center gap-12 text-left">
        <span className="text-label-m text-fg">{state.destination || "Where to?"}</span>
        <span className="bg-line-strong h-16 w-px" aria-hidden="true" />
        <span className="text-body-m text-fg-secondary">
          {state.checkIn && state.checkOut ? shortRange(state.checkIn, state.checkOut) : "Add dates"}
        </span>
        <span className="bg-line-strong h-16 w-px" aria-hidden="true" />
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
        className="bg-brand hover:bg-brand-hover flex size-32 items-center justify-center rounded-[16px]"
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
        className={`border-line bg-surface fixed inset-x-0 top-0 z-40 border-b shadow-[0px_4px_16px_0px_rgba(13,20,48,0.1)] transition-transform duration-200 ${
          scrolled ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <SiteHeader center={<CompactSearch />} />
      </div>

      <section className="relative overflow-hidden bg-[#f2f4f7]" aria-label="Find a stay">
        {/* Artwork layers, all decorative */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
          <div className="absolute top-[calc(50%-521.2px)] right-[-278px] h-[1000px] w-[1300px]">
            <div className="absolute inset-[-16%_-12.31%]">
              <img src="/visuals/hero-spotlight.svg" alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute top-[calc(50%+274.12px)] right-[-83.2px] h-[110px] w-[820px]">
            <div className="absolute inset-[-43.64%_-5.85%]">
              <img src="/visuals/hero-ground-shadow.svg" alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute top-[calc(50%+43px)] right-[-84px] h-[642px] w-[1140px] -translate-y-1/2">
            <Image src="/visuals/cobalt-hotel.png" alt="" fill priority sizes="1140px" className="object-contain" />
          </div>
          <FloatCard className="top-[calc(50%-296px)] right-[93.6px] flex flex-col items-start gap-[6px]">
            <StatusPill type="confirmed" label="Late check-in confirmed" />
            <p className="text-label-m text-fg whitespace-nowrap">Front desk open 24 hours</p>
            <p className="text-body-s text-fg-secondary whitespace-nowrap">Source: hotel policy page</p>
          </FloatCard>
          <FloatCard className="top-[calc(50%+264.86px)] right-[405.4px] flex items-center gap-[10px]">
            <Icon name="float-pin" size={20} />
            <span className="flex flex-col whitespace-nowrap">
              <span className="text-label-m text-fg">20 min from the airport</span>
              <span className="text-body-s text-fg-secondary">At night, by car</span>
            </span>
          </FloatCard>
          <div className="absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-b from-white/0 to-white" />
        </div>

        <SiteHeader className="relative" />

        {/* Phones and tablets: the artwork as a band above the copy (Mobile · Home 90:1195). */}
        <div aria-hidden="true" className="pointer-events-none relative h-[236px] overflow-hidden md:h-[340px] xl:hidden">
          <div className="absolute top-[-6px] right-[-14px] h-[248px] w-[440px] md:right-[max(-14px,calc(50%-380px))] md:h-[350px] md:w-[620px]">
            <Image
              src="/visuals/cobalt-hotel.png"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 620px, 440px"
              className="object-contain"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-b from-[rgba(246,247,249,0)] to-[#f6f7f9]" />
        </div>

        <div className="bg-page relative flex justify-center xl:bg-transparent">
          <div className="flex w-full max-w-[var(--container)] flex-col px-20 pt-0 pb-32 md:px-32 md:pb-48 xl:pt-80 xl:pb-[120px]">
            <div className="flex w-full max-w-[680px] flex-col gap-16 xl:w-[680px] xl:gap-32">
              <div className="flex flex-col gap-8 xl:gap-16">
                <h1 className="text-fg text-[32px] leading-[38px] font-bold tracking-[-0.4px] md:text-[48px] md:leading-[52px] md:tracking-[-1px] xl:w-[640px] xl:text-[68px] xl:leading-[68px] xl:tracking-[-1.7px]">
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
