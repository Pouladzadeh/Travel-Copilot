/** Date helpers. All dates are ISO "YYYY-MM-DD" strings in local time. */

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function nights(checkIn: string, checkOut: string): number {
  return Math.round((parseISO(checkOut).getTime() - parseISO(checkIn).getTime()) / 86_400_000);
}

/** "Sat, Mar 20" */
export function dayLabel(iso: string): string {
  const d = parseISO(iso);
  return `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`;
}

/** Search card: "Mar 20 – 23", or "Mar 30 – Apr 2" across months. */
export function shortRange(checkIn: string, checkOut: string): string {
  const a = parseISO(checkIn);
  const b = parseISO(checkOut);
  if (a.getMonth() === b.getMonth()) return `${MONTH[a.getMonth()]} ${a.getDate()} – ${b.getDate()}`;
  return `${MONTH[a.getMonth()]} ${a.getDate()} – ${MONTH[b.getMonth()]} ${b.getDate()}`;
}

/** Date picker: "Sat, Mar 20 – Tue, Mar 23" */
export function longRange(checkIn: string, checkOut: string): string {
  return `${dayLabel(checkIn)} – ${dayLabel(checkOut)}`;
}

/** Recent search: "Sat, Mar 20 to Tue, Mar 23" */
export function proseRange(checkIn: string, checkOut: string): string {
  return `${dayLabel(checkIn)} to ${dayLabel(checkOut)}`;
}

export function guestsLabel(adults: number, children: number, rooms: number): string {
  const a = `${adults} ${adults === 1 ? "adult" : "adults"}`;
  if (children === 0 && rooms === 1) return a;
  const c = children > 0 ? `, ${children} ${children === 1 ? "child" : "children"}` : "";
  return `${a}${c} · ${rooms} ${rooms === 1 ? "room" : "rooms"}`;
}

export function guestCount(adults: number, children: number): string {
  const n = adults + children;
  return `${n} ${n === 1 ? "guest" : "guests"}`;
}
