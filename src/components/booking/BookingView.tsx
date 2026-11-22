"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  bookingChecks,
  checkSummary,
  DECLINE_TEST_CARD,
  FIELD_LABEL,
  formatCard,
  money2,
  quote,
  validate,
  type GuestForm,
  type Rate,
} from "@/lib/booking";
import { confirmationNumber, saveBooking } from "@/lib/bookingRecord";
import { peekConversation, useCurrentConversation } from "@/lib/copilot/store";
import { dayLabel, nights as nightsBetween } from "@/lib/dates";
import { type Hotel } from "@/lib/hotels";
import { decodeRequirements, encodeRequirements } from "@/lib/requirements";
import { SAMPLE_DATA_NOTICE } from "@/lib/sample-data";
import { Button, ButtonLink } from "../Button";
import { Field } from "../Field";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { SlimFooter } from "../results/ResultsParts";
import { StatusPill } from "../StatusPill";
import { BookingAsk } from "./BookingAsk";

export type BookingParams = {
  hotel: Hotel;
  rate: Rate;
  checkIn: string;
  checkOut: string;
  req?: string;
  /** Sample-data scenario to show a designed state: "price-changed". */
  scenario?: string;
};

const EMPTY_FORM: GuestForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  arrival: "",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  zip: "",
};
/** Price change in the "price changed" scenario (Figma 76:146: $240 → $252 a night). */
const PRICE_STEP = 12;

export function BookingView(p: BookingParams) {
  const { hotel: h } = p;
  const router = useRouter();
  const { conversation } = useCurrentConversation();
  const requirements = useMemo(() => conversation?.requirements ?? decodeRequirements(p.req), [conversation?.requirements, p.req]);
  const destination = conversation?.search.destination ?? "Miami";
  const n = nightsBetween(p.checkIn, p.checkOut);
  const late = requirements.some((r) => r.kind === "late-arrival");
  const budget = requirements.find((r) => r.kind === "budget");
  const askedAboutCancelling =
    requirements.some((r) => r.kind === "free-cancellation") ||
    !!conversation?.items.some((i) => i.type === "traveler" && /cancel/i.test(i.text));

  const [rate, setRate] = useState<Rate>(p.rate === "flexible" && h.flexibleRate ? "flexible" : "lowest");
  const [switched, setSwitched] = useState(false);
  const [priceState, setPriceState] = useState<"changed" | "accepted" | null>(p.scenario === "price-changed" ? "changed" : null);
  const [form, setForm] = useState<GuestForm>(() => ({ ...EMPTY_FORM, arrival: late ? "After midnight, around 12:30 am" : "" }));
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>([]);
  const [declined, setDeclined] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [handover, setHandover] = useState(false);
  const errorBox = useRef<HTMLDivElement>(null);
  const declinedBox = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLInputElement>(null);

  const bumped = priceState !== null;
  const base = quote(h, rate, n);
  const q = bumped ? quote(h, rate, n, base.perNight + PRICE_STEP) : base;
  const before = base;
  const flexQuote = h.flexibleRate ? quote(h, "flexible", n, bumped ? h.flexibleRate.pricePerNight + PRICE_STEP : undefined) : undefined;
  const checks = bookingChecks({
    hotel: h,
    q,
    requirements,
    askedAboutCancelling,
    destination,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    flexibleQuote: flexQuote,
  });
  const summary = checkSummary(checks);
  const lowQuote = quote(h, "lowest", n, bumped ? h.pricePerNight + PRICE_STEP : undefined);
  const needsAck = !q.refundable;
  const blockedByPrice = priceState === "changed";
  const canReserve = !blockedByPrice && (!needsAck || ack);

  // Keep the rate in the address so a refresh or a shared link shows the same booking.
  useEffect(() => {
    const params = new URLSearchParams({ hotel: h.id, rate, checkIn: p.checkIn, checkOut: p.checkOut });
    if (requirements.length) params.set("req", encodeRequirements(requirements));
    if (p.scenario) params.set("scenario", p.scenario);
    router.replace(`/booking?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate]);

  const set = (k: keyof GuestForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = k === "cardNumber" ? formatCard(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors.some((x) => x.field === k)) setErrors((all) => all.filter((x) => x.field !== k));
  };
  const err = (k: keyof GuestForm) => errors.find((x) => x.field === k)?.message;

  function switchRate(next: Rate) {
    setRate(next);
    setSwitched(next === "flexible");
    setAck(false);
  }

  function reserve() {
    if (!canReserve) return;
    const found = validate(form);
    setErrors(found);
    setDeclined(false);
    if (found.length) {
      requestAnimationFrame(() => errorBox.current?.focus());
      return;
    }
    if (form.cardNumber.replace(/\D/g, "") === DECLINE_TEST_CARD) {
      setDeclined(true);
      requestAnimationFrame(() => declinedBox.current?.focus());
      return;
    }
    saveBooking({
      confirmation: confirmationNumber(h.id, p.checkIn),
      hotelId: h.id,
      rate: q.rate,
      checkIn: p.checkIn,
      checkOut: p.checkOut,
      total: q.total,
      perNight: q.perNight,
      firstName: form.firstName.trim(),
      email: form.email.trim(),
      arrival: form.arrival.trim(),
      last4: form.cardNumber.replace(/\D/g, "").slice(-4),
      requirements: encodeRequirements(requirements),
      askedAboutCancelling,
    });
    router.push("/confirmation");
  }

  const hasThread = !!peekConversation();
  const freeUntil = q.freeUntil ? dayLabel(q.freeUntil) : "";

  return (
    <>
      <header className="border-line bg-surface flex justify-center border-b">
        <div className="flex w-full max-w-[var(--container)] items-center justify-between px-32 py-16">
          <Link href="/" aria-label="HelloWorld home">
            <Logo />
          </Link>
          <div className="flex items-center gap-24">
            <button
              type="button"
              onClick={() => {
                setAskOpen(true);
                setHandover(true);
              }}
              className="text-label-m text-fg-link hover:underline"
            >
              Talk to a person
            </button>
            <span
              className="rounded-pill bg-brand-subtle text-label-m text-fg-link flex size-36 items-center justify-center"
              aria-label="Signed in as Peri"
            >
              P
            </span>
          </div>
        </div>
      </header>
      <div className="border-line bg-surface flex justify-center border-b">
        <div className="flex w-full max-w-[var(--container)] items-center px-32 py-16">
          <Link href={`/hotels/${h.id}`} className="text-label-m text-fg-link flex items-center gap-4 hover:underline">
            <Icon name="arrow-left" size={16} />
            Back to {h.name}
          </Link>
        </div>
      </div>

      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] items-start gap-32 p-32">
          <div className="flex min-w-0 flex-1 flex-col gap-24">
            <Steps />
            <div className="flex flex-col gap-4">
              <h1 className="text-heading-l text-fg">Review and reserve</h1>
              <p className="text-body-m text-fg-secondary">Nothing is booked until you select Reserve.</p>
            </div>

            {priceState === "changed" && (
              <div role="alert" className="bg-unconfirmed flex flex-col gap-12 rounded-lg p-20">
                <div className="flex items-start gap-8">
                  <Icon name="pill-alert" size={16} />
                  <div className="flex flex-col gap-2">
                    <p className="text-label-m text-fg">The price went up while you were deciding</p>
                    <p className="text-body-m text-fg">
                      It was {money2(before.total)} in total. It is now {money2(q.total)}, which is {money2(q.total - before.total)} more.
                      Nothing has been charged.
                    </p>
                  </div>
                </div>
                <div className="flex gap-8 pl-24">
                  <Button onClick={() => setPriceState("accepted")}>Continue at {money2(q.total)}</Button>
                  <ButtonLink href={conversation?.resultsHref ?? "/results?destination=Miami&adults=2"} variant="secondary">
                    See other stays
                  </ButtonLink>
                </div>
              </div>
            )}
            {priceState === "changed" && budget && budget.kind === "budget" && (
              <div className="border-line bg-surface flex items-start gap-24 rounded-lg border px-20 py-16">
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-label-m text-fg">Budget, checked again</p>
                  <p className="text-body-m text-fg-secondary">
                    {money2(q.perNight).replace(".00", "")} a night is {q.perNight <= budget.maxPerNight ? "still under" : "now over"} your
                    ${budget.maxPerNight} limit.
                  </p>
                  <p className="text-body-s text-fg-secondary">Source: hotel rate</p>
                </div>
                {q.perNight <= budget.maxPerNight ? (
                  <StatusPill type="confirmed" label="Within budget" />
                ) : (
                  <StatusPill type="danger" label="Over budget" />
                )}
              </div>
            )}

            {switched && rate === "flexible" && (
              <div role="status" className="bg-confirmed flex items-start gap-12 rounded-lg px-20 py-16">
                <Icon name="pill-check" size={16} />
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-label-m text-fg">You switched to the flexible rate</p>
                  <p className="text-body-m text-fg">
                    Free cancellation until {freeUntil}. The total is now {money2(q.total)}, which is {money2(q.total - lowQuote.total)}{" "}
                    more. Nothing has been charged.
                  </p>
                </div>
                <button type="button" onClick={() => switchRate("lowest")} className="text-label-m text-fg-link hover:underline">
                  Switch back
                </button>
              </div>
            )}

            {/* Checked against your trip */}
            <section
              className="border-line-copilot bg-copilot flex flex-col gap-16 rounded-lg border p-24"
              aria-labelledby="checks-heading"
            >
              <div className="flex items-center gap-8">
                <Icon name="sparkle" size={20} />
                <h2 id="checks-heading" className="text-heading-m text-fg flex-1">
                  Checked against your trip
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setHandover(false);
                    setAskOpen(true);
                  }}
                  aria-expanded={askOpen}
                  className="text-label-m text-fg-copilot underline underline-offset-2"
                >
                  Ask about this booking
                </button>
              </div>
              <p className="text-body-m text-fg-secondary">
                Copilot compared this booking with what you told it. It is read-only on this page: it cannot change or make the reservation.
              </p>
              {!hasThread && requirements.length === 0 && (
                <p className="text-body-s text-fg-secondary">
                  You did not tell Copilot any preferences, so only the dates, place and rate are checked.
                </p>
              )}
              <div className="flex flex-wrap gap-8">
                {summary.map((s) => (
                  <StatusPill key={s.label} type={s.type} label={s.label} />
                ))}
              </div>
              <ul className="flex flex-col">
                {checks.map((c) => (
                  <li key={c.key} className="border-line-copilot flex items-start gap-24 border-t py-12">
                    <p className="text-label-m text-fg w-[150px] shrink-0">{c.label}</p>
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
                      <p className="text-body-m text-fg">{c.answer}</p>
                      <p className="text-body-s text-fg-secondary">{c.source}</p>
                      {c.action === "switch-flexible" && (
                        <div className="pt-4">
                          <Button variant="secondary" onClick={() => switchRate("flexible")}>
                            Switch to flexible rate
                          </Button>
                        </div>
                      )}
                      {c.action === "call" && (
                        <div className="text-label-m text-fg-link flex gap-16 pt-4">
                          <a href={`tel:${h.phone.replace(/\D/g, "")}`} className="hover:underline">
                            Call the hotel: {h.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setAskOpen(true);
                              setHandover(true);
                            }}
                            className="hover:underline"
                          >
                            Talk to a person
                          </button>
                        </div>
                      )}
                    </div>
                    <StatusPill type={c.pill.type} label={c.pill.label} />
                  </li>
                ))}
              </ul>
            </section>

            {errors.length > 0 && (
              <div ref={errorBox} tabIndex={-1} role="alert" className="bg-danger flex items-start gap-8 rounded-lg p-20 outline-none">
                <Icon name="pill-alert-danger" size={16} />
                <div className="flex flex-col gap-4">
                  <p className="text-label-m text-fg">
                    {errors.length === 1 ? "1 thing needs" : `${errors.length} things need`} fixing before you can reserve
                  </p>
                  <ul className="flex flex-col gap-2">
                    {errors.map((e) => (
                      <li key={e.field}>
                        <a href={`#f-${e.field}`} className="text-body-s text-fg-link underline underline-offset-2">
                          {e.short}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <form
              className="flex flex-col gap-24"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                reserve();
              }}
            >
              <fieldset className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24">
                <legend className="text-heading-m text-fg float-left mb-0 w-full">Guest details</legend>
                <div className="flex gap-16">
                  <Field
                    id="f-firstName"
                    icon={null}
                    label={FIELD_LABEL.firstName}
                    placeholder="First name"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={set("firstName")}
                    error={err("firstName")}
                    className="flex-1"
                  />
                  <Field
                    id="f-lastName"
                    icon={null}
                    label={FIELD_LABEL.lastName}
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={set("lastName")}
                    error={err("lastName")}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-start gap-16">
                  <Field
                    id="f-email"
                    icon={null}
                    type="email"
                    label={FIELD_LABEL.email}
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={set("email")}
                    error={err("email")}
                    className="flex-1"
                  />
                  <Field
                    id="f-phone"
                    icon={null}
                    type="tel"
                    label={FIELD_LABEL.phone}
                    placeholder="For the hotel to reach you"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    error={err("phone")}
                    className="flex-1"
                  />
                </div>
                <Field
                  id="f-arrival"
                  icon={null}
                  label={FIELD_LABEL.arrival}
                  placeholder="Optional, for example 9:00 pm"
                  value={form.arrival}
                  onChange={set("arrival")}
                  hint={
                    late
                      ? "Filled in from what you told Copilot. Change it if your plans changed. It is sent to the hotel with your reservation."
                      : "Optional. It is sent to the hotel with your reservation."
                  }
                />
              </fieldset>

              {declined && (
                <div ref={declinedBox} tabIndex={-1} role="alert" className="bg-danger flex items-start gap-8 rounded-lg p-20 outline-none">
                  <Icon name="pill-alert-danger" size={16} />
                  <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                      <p className="text-label-m text-fg">Your card was declined</p>
                      <p className="text-body-m text-fg">
                        Nothing was charged. Your room and price are held for 10 minutes while you try again.
                      </p>
                    </div>
                    <div className="flex items-center gap-8">
                      <Button
                        onClick={() => {
                          setForm((f) => ({ ...f, cardNumber: "", expiry: "", cvc: "" }));
                          setDeclined(false);
                          requestAnimationFrame(() => cardRef.current?.focus());
                        }}
                      >
                        Try another card
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setAskOpen(true);
                          setHandover(true);
                        }}
                      >
                        Talk to a person
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <fieldset className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24">
                <legend className="text-heading-m text-fg float-left mb-0 w-full">Payment</legend>
                <p className="text-body-s text-fg-secondary flex items-center gap-[6px]">
                  <Icon name="lock" size={16} />
                  Payment is encrypted. Copilot never sees your card details.
                </p>
                <Field
                  id="f-cardName"
                  icon={null}
                  label={FIELD_LABEL.cardName}
                  placeholder="Name as it appears on the card"
                  autoComplete="cc-name"
                  value={form.cardName}
                  onChange={set("cardName")}
                  error={err("cardName")}
                />
                <Field
                  ref={cardRef}
                  id="f-cardNumber"
                  icon={null}
                  label={FIELD_LABEL.cardNumber}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={form.cardNumber}
                  onChange={set("cardNumber")}
                  error={err("cardNumber")}
                />
                <div className="flex items-start gap-16">
                  <Field
                    id="f-expiry"
                    icon={null}
                    label={FIELD_LABEL.expiry}
                    placeholder="MM / YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={form.expiry}
                    onChange={set("expiry")}
                    error={err("expiry")}
                    className="flex-1"
                  />
                  <Field
                    id="f-cvc"
                    icon={null}
                    label={FIELD_LABEL.cvc}
                    placeholder="3 or 4 digits"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={form.cvc}
                    onChange={set("cvc")}
                    error={err("cvc")}
                    className="flex-1"
                  />
                  <Field
                    id="f-zip"
                    icon={null}
                    label={FIELD_LABEL.zip}
                    placeholder="ZIP or postal code"
                    autoComplete="postal-code"
                    value={form.zip}
                    onChange={set("zip")}
                    error={err("zip")}
                    className="flex-1"
                  />
                </div>
              </fieldset>

              <div className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24">
                {needsAck && (
                  <label className="flex cursor-pointer items-start gap-12">
                    <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="peer sr-only" />
                    <span
                      aria-hidden="true"
                      className={`mt-2 flex size-20 shrink-0 items-center justify-center rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-border-focus)] ${
                        ack ? "bg-brand" : "border-line-input bg-surface border-[1.5px]"
                      }`}
                    >
                      {ack && <Icon name="checkbox-check" size={20} />}
                    </span>
                    <span className="text-body-l text-fg">
                      I understand this rate is non-refundable and cannot be changed after I reserve.
                    </span>
                  </label>
                )}
                <div className="flex items-center gap-16">
                  <Button type="submit" disabled={!canReserve} className="shrink-0">
                    Reserve for {money2(q.total)}
                  </Button>
                  <p className="text-body-s text-fg-secondary flex-1">
                    {blockedByPrice
                      ? "Confirm the new price above to continue. "
                      : needsAck && !ack
                        ? "Tick the box above to continue. "
                        : ""}
                    Your card is charged {money2(q.total)} when you select Reserve.
                    {q.refundable && freeUntil ? ` You can cancel for free until ${freeUntil}.` : ""} Copilot cannot make this reservation
                    for you.
                  </p>
                </div>
                <p className="text-body-s text-fg-tertiary">By reserving you agree to the Terms and the hotel’s rules.</p>
              </div>
            </form>
            <p className="text-body-s text-fg-tertiary">
              {SAMPLE_DATA_NOTICE} No payment is taken: card details stay in this page and are never stored or sent.
            </p>
          </div>

          <aside className="sticky top-16 flex w-[400px] shrink-0 flex-col gap-16 self-start">
            {askOpen && (
              <BookingAsk
                hotel={h}
                q={q}
                flexibleQuote={flexQuote}
                requirements={requirements}
                showHandover={handover}
                onHandover={setHandover}
                onClose={() => {
                  setAskOpen(false);
                  setHandover(false);
                }}
              />
            )}
            {!askOpen && (
              <Summary
                h={h}
                q={q}
                checkIn={p.checkIn}
                checkOut={p.checkOut}
                adults={conversation?.search.adults ?? 2}
                kids={conversation?.search.children ?? 0}
                otherRate={rate === "lowest" ? flexQuote : lowQuote}
                onSwitch={() => switchRate(rate === "lowest" ? "flexible" : "lowest")}
              />
            )}
          </aside>
        </div>
      </main>
      <SlimFooter />
    </>
  );
}

function Steps() {
  return (
    <ol className="flex items-center gap-12" aria-label="Checkout steps">
      <li className="text-label-m text-fg-secondary flex items-center gap-8">
        <span className="bg-confirmed flex size-24 items-center justify-center rounded-[12px]">
          <Icon name="step-check" size={14} />
        </span>
        Choose a room
      </li>
      <li aria-hidden="true" className="h-px w-40 bg-[var(--color-border-strong)]" />
      <li className="text-label-m text-fg flex items-center gap-8" aria-current="step">
        <span className="bg-brand text-label-s text-fg-on-brand flex size-24 items-center justify-center rounded-[12px]">2</span>
        Review and pay
      </li>
      <li aria-hidden="true" className="h-px w-40 bg-[var(--color-border-strong)]" />
      <li className="text-label-m text-fg-secondary flex items-center gap-8">
        <span className="border-line-strong bg-surface text-label-s text-fg-secondary flex size-24 items-center justify-center rounded-[12px] border">
          3
        </span>
        Confirmation
      </li>
    </ol>
  );
}

function Summary({
  h,
  q,
  checkIn,
  checkOut,
  adults,
  kids,
  otherRate,
  onSwitch,
}: {
  h: Hotel;
  q: ReturnType<typeof quote>;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  otherRate?: ReturnType<typeof quote>;
  onSwitch: () => void;
}) {
  const guests = adults + kids;
  const deskHours = {
    confirmed: "desk open 24 hours",
    conditional: "night porter, call ahead",
    unconfirmed: "desk hours not published",
    no: "desk closes 11:00 pm",
  }[h.late.status];
  const showOther = otherRate && otherRate.rate !== q.rate;
  return (
    <section className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24" aria-label="Booking summary">
      <div className="bg-subtle relative h-[170px] overflow-hidden rounded-md">
        {h.photo && <Image src={h.photo} alt={`${h.name}, outside`} fill sizes="352px" className="object-cover" />}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-heading-s text-fg">{h.name}</p>
        <p className="text-body-s text-fg-secondary flex items-center gap-4">
          <Icon name="star" size={14} />
          {h.rating.toFixed(1)} · {h.reviewCount.toLocaleString("en-US")} reviews · {h.neighborhood}
        </p>
      </div>
      <dl className="border-line text-body-m flex flex-col gap-8 border-t pt-12">
        {[
          ["Room", q.room],
          ["Check-in", dayLabel(checkIn)],
          ["Check-in time", `${h.checkInFrom} · ${deskHours}`],
          ["Check-out", dayLabel(checkOut)],
          ["Guests", `${guests} ${guests === 1 ? "guest" : "guests"}, 1 room`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-16">
            <dt className="text-fg-secondary shrink-0">{k}</dt>
            <dd className="text-label-m text-fg text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col items-start gap-8">
        {q.refundable ? (
          <StatusPill
            type="confirmed"
            label={q.freeUntil ? `Free cancellation until ${dayLabel(q.freeUntil).split(", ")[1]}` : "Free cancellation"}
          />
        ) : (
          <StatusPill type="danger" label="Non-refundable" />
        )}
        <p className="text-body-s text-fg-secondary">
          {q.refundable
            ? `Cancel for free${q.freeUntil ? ` until ${dayLabel(q.freeUntil)}` : ""}.${q.afterDeadline ? ` After that, ${q.afterDeadline}.` : ""}`
            : "This rate cannot be cancelled or changed after you reserve."}
        </p>
        {showOther && (
          <button type="button" onClick={onSwitch} className="text-label-m text-fg-link hover:underline">
            {otherRate.refundable
              ? `Switch to flexible rate (+${money2(otherRate.total - q.total).replace(".00", "")})`
              : `Switch back to non-refundable (${money2(otherRate.total)})`}
          </button>
        )}
      </div>
      <div className="border-line text-body-m flex flex-col gap-8 border-t pt-12">
        <p className="text-label-m text-fg">Price details</p>
        <div className="flex justify-between">
          <span className="text-fg-secondary">
            {q.nights} {q.nights === 1 ? "night" : "nights"} × {money2(q.perNight)}
          </span>
          <span className="text-fg">{money2(q.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-fg-secondary">Taxes and fees</span>
          <span className="text-fg">{money2(q.taxes)}</span>
        </div>
      </div>
      <div className="border-line flex items-center justify-between border-t pt-12">
        <p className="text-heading-s text-fg">Total</p>
        <p className="text-price-l text-fg">{money2(q.total)}</p>
      </div>
      <p className="text-body-s text-fg-secondary">Charged today, taxes and fees included</p>
    </section>
  );
}
