"use client";

import Link from "next/link";
import { useState } from "react";
import { useBooking, useHydrated } from "@/lib/bookingRecord";
import { useCurrentConversation } from "@/lib/copilot/store";
import { dayLabel } from "@/lib/dates";
import { hotelById } from "@/lib/hotels";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { bookingQuote, calendarFile, download, receiptText, requirementsOf, TRIP_SUGGESTIONS, tripReply } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { Handover } from "../results/Handover";
import { SlimFooter } from "../results/ResultsParts";
import { ScopedCopilot } from "../ScopedCopilot";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";
import { BeforeYouTravel, ConfirmationNumber, KeptData, NoBooking, PaidSummary, YourStay } from "./TripParts";

/** Trip (Figma 105:1719): the booked stay, with Copilot scoped to it. */
export function TripView() {
  const b = useBooking();
  const hydrated = useHydrated();
  const { conversation } = useCurrentConversation();
  const [panel, setPanel] = useState<"copilot" | "person" | "hidden">("copilot");
  const h = b ? hotelById(b.hotelId) : undefined;

  if (!hydrated) return <SiteHeader className="border-line bg-surface border-b" />;
  if (!b || !h) return <NoBooking />;

  const q = bookingQuote(b, h);
  const adults = conversation?.search.adults ?? 2;
  const upcoming = b.checkIn >= new Date().toISOString().slice(0, 10);
  const status = b.cancelledOn ? "Cancelled" : upcoming ? "Booked" : "Completed";
  const destination = conversation?.search.destination ?? "Miami";

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] items-start gap-32 p-32">
          <div className="flex min-w-0 flex-1 flex-col gap-24">
            {/* No trips list is designed yet, so "All trips" goes home. */}
            <Link href="/" className="text-label-m text-fg-link flex items-center gap-[6px] self-start hover:underline">
              <Icon name="arrow-left" size={16} />
              All trips
            </Link>

            <section className="border-line bg-surface flex flex-col items-start gap-8 rounded-lg border p-24" aria-labelledby="trip-title">
              <div className="flex items-center gap-8">
                <StatusPill type={b.cancelledOn ? "danger" : "confirmed"} label={status} />
                <span className="text-body-s text-fg-secondary">
                  {b.cancelledOn ? "Cancelled trip" : upcoming ? "Upcoming trip" : "Past trip"} · 1 stay
                </span>
              </div>
              <h1 id="trip-title" className="text-heading-l text-fg">
                {destination} · {dayLabel(b.checkIn)} to {dayLabel(b.checkOut)}
              </h1>
              <ConfirmationNumber value={b.confirmation} />
              <p className="text-body-m text-fg-secondary">
                {h.name} · {q.room} · {adults} {adults === 1 ? "guest" : "guests"}
              </p>
              <div className="flex flex-wrap items-center gap-8 pt-8">
                <ButtonLink href="/trip/manage">Manage booking</ButtonLink>
                {!b.cancelledOn && (
                  <Button variant="secondary" onClick={() => download(`${b.confirmation}.ics`, "text/calendar", calendarFile(b, h))}>
                    Add to calendar
                  </Button>
                )}
                <Button variant="ghost" onClick={() => download(`${b.confirmation}-receipt.txt`, "text/plain", receiptText(b, h))}>
                  Download receipt
                </Button>
              </div>
            </section>

            <YourStay b={b} h={h} />
            {!b.cancelledOn && <BeforeYouTravel b={b} h={h} onPerson={() => setPanel("person")} />}
            <KeptData b={b} />
            <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE} Nothing was booked or charged.</p>
          </div>

          <aside className="flex w-[400px] shrink-0 flex-col gap-24 self-start">
            <PaidSummary b={b} h={h} adults={adults} />
            {panel === "person" ? (
              <div className="border-line bg-surface rounded-lg border p-24">
                <Handover
                  requirements={requirementsOf(b)}
                  staysViewed={[h.name]}
                  openQuestion={`About reservation ${b.confirmation}`}
                  onBack={() => setPanel("copilot")}
                />
              </div>
            ) : panel === "hidden" ? (
              <button
                type="button"
                onClick={() => setPanel("copilot")}
                className="rounded-pill border-line-copilot bg-surface text-label-m text-fg hover:bg-copilot flex items-center gap-8 self-start border px-16 py-8"
              >
                <Icon name="sparkle" size={16} />
                Travel Copilot
                <span className="text-fg-link">Show</span>
              </button>
            ) : (
              <ScopedCopilot
                title="Travel Copilot"
                intro="Ask about this booking or the hotel. Copilot can draft messages and prepare changes. You send and confirm them."
                placeholder="Ask about this trip"
                suggestions={TRIP_SUGGESTIONS}
                reply={(text) => tripReply(text, b, h)}
                onHide={() => setPanel("hidden")}
                onPerson={() => setPanel("person")}
                footer={
                  <div className="flex flex-col gap-8">
                    <p className="text-body-s text-fg-secondary">
                      Copilot can be wrong. It shows its sources and cannot change or cancel a booking.
                    </p>
                    <div className="text-label-s text-fg-link flex gap-16">
                      <Link href="/my-data" className="hover:underline">
                        My data
                      </Link>
                      <button type="button" onClick={() => setPanel("person")} className="hover:underline">
                        Talk to a person
                      </button>
                    </div>
                  </div>
                }
              />
            )}
          </aside>
        </div>
      </main>
      <SlimFooter />
    </>
  );
}
