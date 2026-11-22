/**
 * SAMPLE DATA. Every hotel, price, review count, phone number and booking
 * reference here is invented for a portfolio project. Nothing is real.
 *
 * Trip year moved from 2026 to 2027 (Peri, 2026-11-21), so the stay is
 * Sat, Mar 20 – Tue, Mar 23, 2027.
 */

export const SAMPLE_DATA_NOTICE =
  "Sample data: every hotel, price, review and booking on this site is invented for a portfolio project. Photos are AI-generated.";

/** ISO dates for the sample trip. */
export const SAMPLE_TRIP = {
  destination: "Miami",
  checkIn: "2027-03-20",
  checkOut: "2027-03-23",
  adults: 2,
  children: 0,
  rooms: 1,
};

export type HotelSummary = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  neighborhood: string;
  /** Nightly price before taxes and fees. */
  fromPrice: number;
  photo: string;
};

export const FEATURED_STAYS: HotelSummary[] = [
  {
    id: "sunset-harbor",
    name: "Sunset Harbor Bayside Suites",
    rating: 4.5,
    reviewCount: 1200,
    neighborhood: "Coconut Grove, Miami",
    fromPrice: 240,
    photo: "/photos/sunset-harbor.png",
  },
  {
    id: "palmetto-court",
    name: "Palmetto Court Hotel",
    rating: 4.6,
    reviewCount: 410,
    neighborhood: "Coral Gables, Miami",
    fromPrice: 262,
    photo: "/photos/palmetto-court.png",
  },
  {
    id: "bayfront-garden",
    name: "Bayfront Garden Inn",
    rating: 4.2,
    reviewCount: 640,
    neighborhood: "Near Miami International Airport",
    fromPrice: 198,
    photo: "/photos/bayfront-garden.png",
  },
];

/** Home, "Find stays by what you need". Copy and counts from Figma. */
export type NeedTab = {
  id: "late" | "quiet" | "free-cancel" | "water";
  label: string;
  footnote: string;
  counts: Record<string, string>;
};

export const DESTINATIONS = [
  { city: "Miami Beach", photo: "/photos/miami-beach.png" },
  { city: "Lisbon", photo: "/photos/lisbon.png" },
  { city: "Kyoto", photo: "/photos/kyoto.png" },
  { city: "Mexico City", photo: "/photos/mexico-city.png" },
];

export const NEED_TABS: NeedTab[] = [
  {
    id: "late",
    label: "Late arrivals",
    footnote: "Counts show stays whose front desk hours are confirmed by the hotel.",
    counts: {
      "Miami Beach": "38 stays with a 24-hour front desk",
      Lisbon: "52 stays with a 24-hour front desk",
      Kyoto: "21 stays with a 24-hour front desk",
      "Mexico City": "44 stays with a 24-hour front desk",
    },
  },
  {
    id: "quiet",
    label: "Quiet stays",
    footnote: "Counts show stays where more than half of recent reviews mention quiet.",
    counts: {
      "Miami Beach": "27 stays where most reviews mention quiet",
      Lisbon: "61 stays where most reviews mention quiet",
      Kyoto: "74 stays where most reviews mention quiet",
      "Mexico City": "39 stays where most reviews mention quiet",
    },
  },
  {
    id: "free-cancel",
    label: "Free cancellation",
    footnote: "Counts show stays with at least one rate that can be cancelled for free.",
    counts: {
      "Miami Beach": "112 stays with a free-cancellation rate",
      Lisbon: "140 stays with a free-cancellation rate",
      Kyoto: "96 stays with a free-cancellation rate",
      "Mexico City": "121 stays with a free-cancellation rate",
    },
  },
  {
    id: "water",
    label: "Near the water",
    footnote: "Counts use the walking distance from the hotel’s address. A city with none shows 0, not a guess.",
    counts: {
      "Miami Beach": "85 stays within a 5-minute walk of the water",
      Lisbon: "33 stays within a 5-minute walk of the water",
      Kyoto: "12 stays within a 5-minute walk of the water",
      "Mexico City": "0 stays within a 5-minute walk of the water",
    },
  },
];

/** Destination picker (Figma state "Destination · suggestions"). */
export type PlaceSuggestion = {
  kind: "place" | "airport" | "stay";
  name: string;
  detail: string;
  /** What goes into the Destination field when chosen. */
  value: string;
};

export const PLACE_SUGGESTIONS: PlaceSuggestion[] = [
  { kind: "place", name: "Miami", detail: "City · Florida, United States", value: "Miami" },
  { kind: "place", name: "Miami Beach", detail: "City · Florida, United States", value: "Miami Beach" },
  {
    kind: "airport",
    name: "Miami International Airport (MIA)",
    detail: "Airport · 8 miles from downtown Miami",
    value: "Miami International Airport (MIA)",
  },
  { kind: "place", name: "Lisbon", detail: "City · Portugal", value: "Lisbon" },
  { kind: "place", name: "Kyoto", detail: "City · Japan", value: "Kyoto" },
  { kind: "place", name: "Mexico City", detail: "City · Mexico", value: "Mexico City" },
  { kind: "stay", name: "Sunset Harbor Bayside Suites", detail: "Hotel · Coconut Grove, Miami", value: "Miami" },
  { kind: "stay", name: "Palmetto Court Hotel", detail: "Hotel · Coral Gables, Miami", value: "Miami" },
  { kind: "stay", name: "Bayfront Garden Inn", detail: "Hotel · Near Miami International Airport", value: "Miami" },
];

/** The traveler's last search, shown in "Pick up where you left off". */
export const RECENT_SEARCH = {
  ...SAMPLE_TRIP,
  requirementText: "",
  requirements: ["late-arrival", "quiet", "budget:300"],
  staysFit: 3,
};
