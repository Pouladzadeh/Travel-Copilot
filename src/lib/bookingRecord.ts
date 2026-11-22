"use client";

/**
 * The reservation made on Booking, kept for the browser session so
 * Confirmation, Trip and Manage booking can show it. SAMPLE DATA: nothing is
 * really booked or paid. Card details are never kept, only the last 4 digits.
 */
import { useSyncExternalStore } from "react";
import type { Rate } from "./booking";

export type BookingRecord = {
  confirmation: string;
  hotelId: string;
  rate: Rate;
  checkIn: string;
  checkOut: string;
  perNight: number;
  total: number;
  firstName: string;
  email: string;
  arrival: string;
  last4: string;
  /** Encoded requirements at the time of booking. */
  requirements: string;
  askedAboutCancelling: boolean;
  /** Set when the traveler cancels in Manage booking. */
  cancelledOn?: string;
};

const KEY = "tc-booking";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: BookingRecord | null } = { raw: null, value: null };

function read(): BookingRecord | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw !== cache.raw) {
    try {
      cache = { raw, value: raw ? (JSON.parse(raw) as BookingRecord) : null };
    } catch {
      cache = { raw, value: null };
    }
  }
  return cache.value;
}

export function saveBooking(b: BookingRecord) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* in-memory only */
  }
  listeners.forEach((l) => l());
}

export function updateBooking(fn: (b: BookingRecord) => BookingRecord) {
  const b = read();
  if (b) saveBooking(fn(b));
}

export function useBooking() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}

/** "HW-4821-0320": four digits from the stay, then the check-in month and day. */
export function confirmationNumber(hotelId: string, checkIn: string) {
  let h = 0;
  for (const c of `${hotelId}|${checkIn}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  // The designed sample trip keeps the number shown in Figma.
  const four = hotelId === "sunset-harbor" && checkIn.endsWith("-03-20") ? 4821 : 1000 + (h % 9000);
  return `HW-${four}-${checkIn.slice(5, 7)}${checkIn.slice(8, 10)}`;
}

/** False during server render and hydration, so session-only data doesn't flash an empty state. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
