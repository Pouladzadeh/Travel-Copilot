"use client";

import { useState } from "react";
import { updateBooking, useBooking, useHydrated } from "@/lib/bookingRecord";
import { clearConversation, useCurrentConversation } from "@/lib/copilot/store";
import { dayLabel } from "@/lib/dates";
import { hotelById } from "@/lib/hotels";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { beforeYouTravel, calendarFile, download, keptSummary, receiptText, requirementsOf } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { Icon } from "../Icon";
import { Handover } from "../results/Handover";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
import { ChecklistRow, PaidSummary, TripFeedback } from "./TripParts";

/** Confirmation (Figma 17:451). */
export function ConfirmationView() {
  const b = useBooking();
  const { conversation } = useCurrentConversation();
  const [copied, setCopied] = useState(false);
  const [handover, setHandover] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "done">("idle");
  const hydrated = useHydrated();
  const h = b ? hotelById(b.hotelId) : undefined;

  if (!hydrated) return <SiteHeader className="border-line bg-surface border-b" />;
  if (!b || !h) {
    return (
      <>
        <SiteHeader className="border-line bg-surface border-b" />
        <main className="bg-page flex min-h-[60vh] justify-center">
          <div className="flex w-full max-w-[var(--container)] flex-col items-start gap-12 p-32">
            <h1 className="text-heading-l text-fg">No booking to show</h1>
            <p className="text-body-m text-fg-secondary">
              Reservations made on this site are kept only while this browser tab is open. Start a new search to book a stay.
            </p>
            <ButtonLink href="/">Search stays</ButtonLink>
          </div>
        </main>
        <SlimFooter />
      </>
    );
  }

  const items = beforeYouTravel(b, h);
  const hasConversation = !!conversation && conversation.items.length > 0 && deleteStep !== "done";
  const address = h.address ?? `${h.neighborhood}, FL`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(b!.confirmation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the number stays on screen */
    }
  }

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
                <div className="bg-subtle flex items-center gap-12 rounded-md px-12 py-8">
                  <span className="text-body-s text-fg-secondary">Confirmation number</span>
                  <span className="text-heading-s text-fg">{b.confirmation}</span>
                  <button type="button" onClick={copy} className="text-label-m text-fg-link flex items-center gap-4 hover:underline">
                    <Icon name="copy" size={16} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <span className="sr-only" aria-live="polite">
                    {copied ? "Confirmation number copied" : ""}
                  </span>
                </div>
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

            <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="your-stay">
              <div className="flex items-center justify-between gap-16">
                <h2 id="your-stay" className="text-heading-m text-fg">
                  Your stay
                </h2>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-label-m text-fg-link hover:underline"
                >
                  Get directions<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
              <dl className="grid grid-cols-2 gap-x-24 gap-y-16">
                {[
                  ["Address", address],
                  ["Hotel phone", h.phone],
                  [
                    "Check-in",
                    `${dayLabel(b.checkIn)}, ${h.checkInFrom.toLowerCase()}.${h.late.status === "confirmed" ? " Front desk open 24 hours." : ""}`,
                  ],
                  ["Check-out", `${dayLabel(b.checkOut)}, ${h.checkOutUntil.toLowerCase()}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-2">
                    <dt className="text-body-s text-fg-secondary">{k}</dt>
                    <dd className="text-body-l text-fg">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border-line-copilot bg-copilot flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="before">
              <h2 id="before" className="text-heading-m text-fg flex items-center gap-8">
                <Icon name="sparkle" size={20} />
                Before you travel
              </h2>
              <p className="text-body-m text-fg-secondary">
                A short checklist from Copilot, based on what it could and could not confirm while you were choosing.
              </p>
              <ul className="flex flex-col">
                {items.map((it) => (
                  <ChecklistRow key={it.key} item={it} h={h} onPerson={() => setHandover(true)} />
                ))}
              </ul>
            </section>

            <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-labelledby="kept">
              <h2 id="kept" className="text-heading-m text-fg">
                What Copilot kept from this trip
              </h2>
              {deleteStep === "done" ? (
                <p className="text-body-m text-fg" role="status">
                  Deleted. Your requirements and the conversation for this trip are gone. Your reservation is not affected.
                </p>
              ) : (
                <p className="text-body-m text-fg">{keptSummary(b, hasConversation)}</p>
              )}
              {deleteStep === "confirm" ? (
                <div className="bg-danger flex flex-col gap-12 rounded-md p-16" role="alertdialog" aria-labelledby="del-q">
                  <p id="del-q" className="text-label-m text-fg">
                    Delete this trip’s Copilot data? This cannot be undone. Your reservation stays booked.
                  </p>
                  <div className="flex gap-8">
                    <Button
                      onClick={() => {
                        clearConversation();
                        updateBooking((x) => ({ ...x, requirements: "", askedAboutCancelling: false }));
                        setDeleteStep("done");
                      }}
                    >
                      Delete
                    </Button>
                    <Button variant="secondary" onClick={() => setDeleteStep("idle")}>
                      Keep it
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-8">
                  <ButtonLink href="/my-data" variant="secondary">
                    Review my data
                  </ButtonLink>
                  {deleteStep !== "done" && (requirementsOf(b).length > 0 || hasConversation) && (
                    <Button variant="ghost" onClick={() => setDeleteStep("confirm")}>
                      Delete this trip’s data
                    </Button>
                  )}
                </div>
              )}
            </section>

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
