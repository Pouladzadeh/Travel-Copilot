"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { money2 } from "@/lib/booking";
import { updateBooking, useBooking, useHydrated } from "@/lib/bookingRecord";
import { useCurrentConversation } from "@/lib/copilot/store";
import { dayLabel } from "@/lib/dates";
import { hotelById } from "@/lib/hotels";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { bookingQuote, refundToday, requirementsOf, todayISO } from "@/lib/trip";
import { Button, ButtonLink } from "../Button";
import { Field } from "../Field";
import { Icon } from "../Icon";
import { Handover } from "../results/Handover";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";
import { NoBooking, PaidSummary } from "./TripParts";

/** Manage booking (Figma 105:1925). Every change is a button the traveler presses; Copilot only drafts. */
export function ManageView() {
  const b = useBooking();
  const hydrated = useHydrated();
  const { conversation } = useCurrentConversation();
  const [editing, setEditing] = useState<"arrival" | "contact" | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [handover, setHandover] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const h = b ? hotelById(b.hotelId) : undefined;

  if (!hydrated) return <SiteHeader className="border-line bg-surface border-b" />;
  if (!b || !h) return <NoBooking />;

  const q = bookingQuote(b, h);
  const refund = refundToday(b, q.perNight, q.refundable, q.freeUntil);
  const freeNow = q.refundable && (!q.freeUntil || todayISO() <= q.freeUntil);

  function done(msg: string) {
    setEditing(null);
    setSaved(msg);
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] items-start gap-32 p-32">
          <div className="flex min-w-0 flex-1 flex-col gap-24">
            <Link href="/trip" className="text-label-m text-fg-link flex items-center gap-[6px] self-start hover:underline">
              <Icon name="arrow-left" size={16} />
              Back to trip
            </Link>
            <div className="flex flex-col gap-4">
              <h1 className="text-heading-l text-fg">Manage booking</h1>
              <p className="text-body-m text-fg-secondary">
                {h.name} · Confirmation {b.confirmation}
              </p>
            </div>

            {saved && (
              <p
                ref={statusRef}
                tabIndex={-1}
                role="status"
                className="bg-confirmed text-body-m text-fg flex items-start gap-8 rounded-md p-16 outline-none"
              >
                <Icon name="pill-check" size={16} />
                {saved}
              </p>
            )}

            {b.cancelledOn ? (
              <div className="bg-danger flex items-start gap-12 rounded-md p-16">
                <StatusPill type="danger" label="Cancelled" />
                <div className="text-body-m text-fg flex flex-col gap-2">
                  <p className="text-label-m">This booking is cancelled</p>
                  <p>
                    You cancelled on {dayLabel(b.cancelledOn)}.{" "}
                    {refundToday(b, q.perNight, q.refundable, q.freeUntil, b.cancelledOn) > 0
                      ? `${money2(refundToday(b, q.perNight, q.refundable, q.freeUntil, b.cancelledOn))} is refunded to the card ending in ${b.last4}.`
                      : "Nothing was refunded, as the rate is non-refundable."}
                  </p>
                </div>
              </div>
            ) : q.refundable ? (
              <div className="bg-confirmed flex items-start gap-12 rounded-md p-16">
                <StatusPill type="confirmed" label={freeNow ? "Free cancellation" : "Deadline passed"} />
                <div className="text-body-m text-fg flex flex-col gap-2">
                  <p className="text-label-m">
                    {freeNow
                      ? `You can cancel for free${q.freeUntil ? ` until ${dayLabel(q.freeUntil)}` : ""}`
                      : "The free-cancellation deadline has passed"}
                  </p>
                  <p>Dates and room type are fixed online. You can update your arrival time, your details and requests to the hotel.</p>
                </div>
              </div>
            ) : (
              <div className="bg-unconfirmed flex items-start gap-12 rounded-md p-16">
                <StatusPill type="danger" label="Non-refundable" />
                <div className="text-body-m text-fg flex flex-col gap-2">
                  <p className="text-label-m">This rate cannot be changed or refunded</p>
                  <p>Dates and room type are fixed. You can still update your arrival time, your details and requests to the hotel.</p>
                </div>
              </div>
            )}

            {!b.cancelledOn && (
              <section className="flex flex-col gap-12" aria-labelledby="can-change">
                <h2 id="can-change" className="text-heading-s text-fg">
                  What you can change
                </h2>

                <Option
                  title="Arrival time"
                  text={`Now: ${b.arrival ? b.arrival.charAt(0).toLowerCase() + b.arrival.slice(1) : "not set"}. Free to change. The hotel is told straight away.`}
                  open={editing === "arrival"}
                  action={
                    <Button variant="secondary" onClick={() => setEditing("arrival")}>
                      Change
                    </Button>
                  }
                >
                  <EditForm
                    fields={[
                      { key: "arrival", label: "Estimated arrival time", value: b.arrival, placeholder: "For example, around 12:30 am" },
                    ]}
                    onCancel={() => setEditing(null)}
                    onSave={(v) => {
                      updateBooking((x) => ({ ...x, arrival: v.arrival.trim() }));
                      done(`Saved. ${h.name} now has your arrival time as “${v.arrival.trim() || "not set"}”.`);
                    }}
                  />
                </Option>

                <Option
                  title="Guest name and contact"
                  text="The name on the booking, your email and your phone number."
                  open={editing === "contact"}
                  action={
                    <Button variant="secondary" onClick={() => setEditing("contact")}>
                      Edit
                    </Button>
                  }
                >
                  <EditForm
                    fields={[
                      { key: "firstName", label: "First name", value: b.firstName },
                      { key: "lastName", label: "Last name", value: b.lastName ?? "" },
                      { key: "email", label: "Email", value: b.email, type: "email" },
                      { key: "phone", label: "Phone", value: b.phone ?? "", type: "tel" },
                    ]}
                    validate={(v) =>
                      !v.firstName.trim() || !v.lastName.trim()
                        ? "Add the first and last name as they appear on your ID."
                        : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())
                          ? "Enter the full email address, like name@example.com."
                          : null
                    }
                    onCancel={() => setEditing(null)}
                    onSave={(v) => {
                      updateBooking((x) => ({
                        ...x,
                        firstName: v.firstName.trim(),
                        lastName: v.lastName.trim(),
                        email: v.email.trim(),
                        phone: v.phone.trim(),
                      }));
                      done("Saved. The hotel has your updated details.");
                    }}
                  />
                </Option>

                <Option
                  title="Request to the hotel"
                  text="A high floor, a cot, an early breakfast. Copilot can draft it. You send it."
                  action={
                    <ButtonLink href={`/message-hotel?hotel=${h.id}&kind=request`} variant="secondary">
                      Write a request
                    </ButtonLink>
                  }
                />
              </section>
            )}

            {!b.cancelledOn && (
              <section className="flex flex-col gap-12" aria-labelledby="cancel">
                <h2 id="cancel" className="text-heading-s text-fg">
                  Cancel
                </h2>
                <div className="border-line bg-surface flex flex-col gap-16 rounded-lg border px-24 py-20">
                  <div className="flex items-center gap-16">
                    <div className="text-body-m flex min-w-0 flex-1 flex-col gap-2">
                      <p className="text-label-m text-fg">Cancel this booking</p>
                      <p className="text-fg-secondary">
                        You would get {money2(refund)} back of the {money2(b.total)} you paid. This cannot be undone.
                      </p>
                    </div>
                    {!confirmCancel && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                        className="text-label-m text-fg-danger bg-surface rounded-md border border-[var(--color-text-danger)] px-20 py-12 hover:bg-[var(--color-bg-danger)]"
                      >
                        Cancel booking
                      </button>
                    )}
                  </div>
                  {confirmCancel && (
                    <div className="bg-danger flex flex-col gap-12 rounded-md p-16" role="alertdialog" aria-labelledby="cancel-q">
                      <p id="cancel-q" className="text-label-m text-fg">
                        Cancel your stay at {h.name}, {dayLabel(b.checkIn)} to {dayLabel(b.checkOut)}?{" "}
                        {refund > 0
                          ? `${money2(refund)} is refunded to the card ending in ${b.last4}.`
                          : `You get nothing back of the ${money2(b.total)}.`}{" "}
                        This cannot be undone.
                      </p>
                      <div className="flex gap-8">
                        <button
                          type="button"
                          onClick={() => {
                            updateBooking((x) => ({ ...x, cancelledOn: todayISO() }));
                            setConfirmCancel(false);
                            done(
                              refund > 0
                                ? `Cancelled. ${money2(refund)} is on its way back to your card.`
                                : "Cancelled. Nothing was refunded.",
                            );
                          }}
                          className="text-label-m text-fg-on-brand rounded-md bg-[var(--color-text-danger)] px-20 py-12 hover:opacity-90"
                        >
                          Yes, cancel booking
                        </button>
                        <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
                          Keep my booking
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="bg-brand-subtle flex items-center gap-16 rounded-lg px-24 py-20">
              <div className="text-body-m flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-label-m text-fg">Has something gone wrong?</p>
                <p className="text-fg-secondary">
                  If your flight is cancelled or you are unwell, a person can ask the hotel for an exception. We cannot promise the hotel’s
                  answer.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setHandover(true)}>
                Talk to a person
              </Button>
            </div>
            <p className="text-body-s text-fg-tertiary">{SAMPLE_DATA_NOTICE} Changes here are kept only in this browser tab.</p>
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

function Option({
  title,
  text,
  action,
  open = false,
  children,
}: {
  title: string;
  text: string;
  action: React.ReactNode;
  open?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-line bg-surface flex flex-col gap-16 rounded-lg border px-24 py-20">
      <div className="flex items-center gap-16">
        <div className="text-body-m flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="text-label-m text-fg">{title}</h3>
          <p className="text-fg-secondary">{text}</p>
        </div>
        {!open && action}
      </div>
      {open && children}
    </div>
  );
}

type FieldSpec = { key: string; label: string; value: string; placeholder?: string; type?: string };

function EditForm({
  fields,
  validate,
  onSave,
  onCancel,
}: {
  fields: FieldSpec[];
  validate?: (v: Record<string, string>) => string | null;
  onSave: (v: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, f.value])));
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex flex-col gap-12"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const err = validate?.(v) ?? null;
        setError(err);
        if (!err) onSave(v);
      }}
    >
      <div className="grid grid-cols-2 gap-12">
        {fields.map((f, i) => (
          <Field
            key={f.key}
            icon={null}
            label={f.label}
            type={f.type}
            placeholder={f.placeholder}
            value={v[f.key]}
            autoFocus={i === 0}
            onChange={(e) => setV((x) => ({ ...x, [f.key]: e.target.value }))}
            className={fields.length === 1 ? "col-span-2" : ""}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-body-s text-fg-danger">
          {error}
        </p>
      )}
      <div className="flex gap-8">
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
