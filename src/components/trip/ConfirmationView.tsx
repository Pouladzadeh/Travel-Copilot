"use client";

import { useState } from "react";
import { useBooking, useHydrated } from "@/lib/bookingRecord";
import { useCurrentConversation } from "@/lib/copilot/store";
import { dayLabel } from "@/lib/dates";
import { hotelById } from "@/lib/hotels";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { calendarFile, download, receiptText, requirementsOf } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { Handover } from "../results/Handover";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
import { BeforeYouTravel, ConfirmationNumber, KeptData, NoBooking, PaidSummary, TripFeedback, YourStay } from "./TripParts";

/** Confirmation (Figma 17:451). */
export function ConfirmationView() {
  const b = useBooking();
  const hydrated = useHydrated();
  const { conversation } = useCurrentConversation();
  const [handover, setHandover] = useState(false);
  const h = b ? hotelById(b.hotelId) : undefined;

  if (!hydrated) return <SiteHeader className="border-line bg-surface border-b" />;
  if (!b || !h) return <NoBooking />;

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] items-start gap-32 p-32">
          <div className="flex min-w-0 flex-1 flex-col gap-24">
            <ol className="flex items-center gap-12" aria-label="Checkout steps">
              {["Choose a room", "Review and pay", "Confirmation"].map((s, i) => (
                <li key={s} className="flex items-center gap-12">
                  {i > 0 && <span aria-hidden="true" className="h-px w-40 bg-[var(--color-border-strong)]" />}
                  <span
                    className={`text-label-m flex items-center gap-8 ${i === 2 ? "text-fg" : "text-fg-secondary"}`}
                    aria-current={i === 2 ? "step" : undefined}
                  >
                    <span className="bg-confirmed flex size-24 items-center justify-center rounded-[12px]">
                      <Icon name="step-check" size={14} />
                    </span>
                    {s}
                  </span>
                </li>
              ))}
            </ol>

            <section className="border-line bg-surface flex items-start gap-16 rounded-lg border p-24" aria-labelledby="booked">
              <span className="rounded-pill bg-confirmed flex size-48 shrink-0 items-center justify-center">
                <Icon name="success-check" size={24} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-8">
                <h1 id="booked" className="text-heading-l text-fg">
                  You’re booked at {h.name}
                </h1>
                <ConfirmationNumber value={b.confirmation} />
                <p className="text-body-m text-fg-secondary">
                  {dayLabel(b.checkIn)} to {dayLabel(b.checkOut)} · A confirmation email is on its way to you.
                </p>
                <div className="flex flex-wrap items-center gap-8 pt-8">
                  <ButtonLink href="/trip">View trip</ButtonLink>
                  <Button variant="secondary" onClick={() => download(`${b.confirmation}.ics`, "text/calendar", calendarFile(b, h))}>
                    Add to calendar
                  </Button>
                  <ButtonLink href="/trip/manage" variant="secondary">
                    Manage booking
                  </ButtonLink>
                  <Button variant="ghost" onClick={() => download(`${b.confirmation}-receipt.txt`, "text/plain", receiptText(b, h))}>
                    Download receipt
                  </Button>
                </div>
              </div>
            </section>

            <YourStay b={b} h={h} />
            <BeforeYouTravel b={b} h={h} onPerson={() => setHandover(true)} />
            <KeptData b={b} />
            <TripFeedback />
            <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE} Nothing was booked or charged.</p>
          </div>

          <aside className="sticky top-16 w-[400px] shrink-0 self-start">
            {handover ? (
              <div className="border-line bg-surface rounded-lg border p-24">
                <Handover
                  requirements={requirementsOf(b)}
                  staysViewed={[h.name]}
                  openQuestion={`About reservation ${b.confirmation}`}
                  onBack={() => setHandover(false)}
                />
              </div>
            ) : (
              <PaidSummary b={b} h={h} adults={conversation?.search.adults ?? 2} />
            )}
          </aside>
        </div>
      </main>
      <SlimFooter />
    </>
  );
}
