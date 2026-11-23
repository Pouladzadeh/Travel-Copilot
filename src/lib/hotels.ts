/**
 * SAMPLE DATA. All hotels, prices, policies, review counts and phone numbers
 * are invented for a portfolio project.
 *
 * Five stays are designed in Figma. Twelve more were added (Peri approved,
 * 2026-11-21) so the counts on Results are real: 15 ranked stays plus one
 * wildcard and one sponsored stay, which are not part of the ranking.
 *
 * The twelve were chosen so every designed moment adds up:
 *   default (after midnight, quiet, ≤ $300)  → 3 of 15 fit
 *   budget raised to $350                     → 5 of 15 (two new)
 *   "quiet" removed                           → 7 of 15
 *   budget $180 (no match)                    → $200 shows 1, $265 shows 3,
 *                                               without quiet shows 0 extra
 */

export type LateStatus = "confirmed" | "conditional" | "unconfirmed" | "no";
export type QuietStatus = "confirmed" | "unconfirmed" | "no";

export type Hotel = {
  id: string;
  name: string;
  neighborhood: string;
  /** Street address, only where designed in Figma (Confirmation 74:1109). */
  address?: string;
  rating: number;
  reviewCount: number;
  /** Non-refundable nightly rate, taxes and fees not included. */
  pricePerNight: number;
  /** Total for the 3-night sample stay, taxes and fees included. */
  total: number;
  /** Cheapest rate can be cancelled for free. */
  freeCancellation: boolean;
  /** Last day to cancel for free, when the cheapest rate allows it. */
  freeUntil?: string;
  /** Flexible rate, when the cheapest one is non-refundable. */
  flexibleRate?: { pricePerNight: number; total: number; freeUntil: string; afterDeadline: string };
  /** Room offered for the sample dates. */
  room: { name: string; facts: string; faces?: string };
  checkInFrom: string;
  checkOutUntil: string;
  /** Extra photos for Hotel detail, when designed. */
  gallery?: string[];
  /** Review snippets, only where designed in Figma. */
  reviewSnippets?: { quote: string; meta: string }[];
  /** Neighborhood facts, only where designed in Figma. */
  area?: {
    name: string;
    gettingThere: string;
    around: string;
    nightWalk: { comfortable: number; poorlyLit: number };
    photo?: string;
  };
  photo?: string;
  placement: "ranked" | "wildcard" | "sponsored";
  phone: string;
  late: { status: LateStatus; evidence: string; source: string };
  quiet: { status: QuietStatus; quietMentions: number; noiseMentions: number };
  /** Parking, only where the listing was checked (Trip 121:1698). */
  parking?: { onSite: boolean; perNight?: number; reserve: boolean; evCharging: "yes" | "no" | "unconfirmed"; source: string };
  /** Minutes on foot to the nearest beach or bay, from a map estimate. */
  waterWalkMinutes: number;
  waterName: string;
  /** Minutes by car from Miami International Airport at night, from a map estimate. */
  airportMinutes: number;
  /** Designed copy for the default request, used verbatim on the card. */
  designed?: { reason: string; sources: string };
};

/** Map estimates by car at night for the added stays, by neighborhood. */
const AIRPORT_MINUTES: Record<string, number> = {
  "Coconut Grove": 20,
  "Upper East Side": 20,
  "South Beach": 25,
  Wynwood: 15,
  "Little Havana": 12,
  Downtown: 15,
  "Coral Way": 14,
  "Key Biscayne": 30,
  Edgewater: 17,
  "Design District": 16,
  "Mid-Beach": 25,
  Brickell: 16,
};

export const HOTELS: Hotel[] = [
  // ── Designed in Figma ─────────────────────────────────────────────
  {
    id: "sunset-harbor",
    name: "Sunset Harbor Bayside Suites",
    neighborhood: "Coconut Grove, Miami",
    address: "2901 Bayshore Lane, Coconut Grove, Miami, FL 33133",
    parking: { onSite: true, perNight: 28, reserve: false, evCharging: "unconfirmed", source: "hotel listing" },
    rating: 4.5,
    reviewCount: 1200,
    pricePerNight: 240,
    total: 812,
    freeCancellation: false,
    flexibleRate: { pricePerNight: 268, total: 906, freeUntil: "2027-03-18", afterDeadline: "the first night, $268, is charged" },
    room: { name: "King Room, bay view", facts: "Sleeps 2 · 320 sq ft · balcony", faces: "the bay" },
    checkInFrom: "From 3:00 pm",
    checkOutUntil: "Until 11:00 am",
    photo: "/photos/sunset-harbor.png",
    gallery: [
      "/photos/sunset-harbor-room.png",
      "/photos/sunset-harbor-lobby.png",
      "/photos/sunset-harbor-balcony.png",
      "/photos/coconut-grove-street.png",
    ],
    reviewSnippets: [
      { quote: "Quiet at night, and the front desk was there when we arrived at 1 am.", meta: "Stayed Feb 2026 · Couple" },
      { quote: "The bay view was worth it. The street side can be noisy on Saturdays.", meta: "Stayed Jan 2026 · Solo traveler" },
      { quote: "Easy check-in, comfortable bed, and a short walk to cafés.", meta: "Stayed Dec 2025 · Family" },
    ],
    area: {
      name: "Coconut Grove",
      gettingThere: "About 20 minutes by car from Miami International Airport late at night.",
      around: "Residential streets, with cafés and a bayfront park within a 10-minute walk.",
      nightWalk: { comfortable: 46, poorlyLit: 3 },
      photo: "/photos/coconut-grove-street.png",
    },
    placement: "ranked",
    phone: "(305) 555-0142",
    late: {
      status: "confirmed",
      evidence: "Reception is open 24 hours. Guests arriving after midnight can check in at the front desk.",
      source: "hotel policy page",
    },
    quiet: { status: "confirmed", quietMentions: 212, noiseMentions: 31 },
    waterWalkMinutes: 12,
    waterName: "the bay",
    airportMinutes: 20,
    designed: {
      reason: "Front desk is open 24 hours, so arriving after midnight works. Guests often describe the street as quiet.",
      sources: "Sources: hotel policy page · 212 of 1,200 reviews mention “quiet”",
    },
  },
  {
    id: "palmetto-court",
    name: "Palmetto Court Hotel",
    neighborhood: "Coral Gables, Miami",
    rating: 4.6,
    reviewCount: 410,
    pricePerNight: 262,
    total: 884,
    freeCancellation: true,
    freeUntil: "2027-03-18",
    room: { name: "Queen Room, garden side", facts: "Sleeps 2 · 260 sq ft" },
    checkInFrom: "From 3:00 pm",
    checkOutUntil: "Until 11:00 am",
    photo: "/photos/palmetto-court.png",
    placement: "ranked",
    phone: "(305) 555-0167",
    late: {
      status: "conditional",
      evidence: "The night porter lets guests in after midnight if they call ahead on the day of arrival.",
      source: "hotel policy page",
    },
    quiet: { status: "confirmed", quietMentions: 88, noiseMentions: 6 },
    waterWalkMinutes: 35,
    waterName: "the bay",
    airportMinutes: 25,
    designed: {
      reason: "On a residential street. The night porter lets guests in after midnight if you call ahead on the day you arrive.",
      sources: "Sources: hotel policy page · 88 of 410 reviews mention “quiet”",
    },
  },
  {
    id: "bayfront-garden",
    name: "Bayfront Garden Inn",
    neighborhood: "Near Miami International Airport",
    rating: 4.2,
    reviewCount: 640,
    pricePerNight: 198,
    total: 672,
    freeCancellation: true,
    freeUntil: "2027-03-19",
    room: { name: "King Room", facts: "Sleeps 2 · 280 sq ft" },
    checkInFrom: "From 3:00 pm",
    checkOutUntil: "Until 11:00 am",
    photo: "/photos/bayfront-garden.png",
    placement: "ranked",
    phone: "(305) 555-0188",
    late: {
      status: "unconfirmed",
      evidence: "Check-in from 3:00 pm. No closing time for the front desk.",
      source: "hotel listing",
    },
    quiet: { status: "confirmed", quietMentions: 97, noiseMentions: 12 },
    waterWalkMinutes: 40,
    waterName: "the bay",
    airportMinutes: 8,
    designed: {
      reason:
        "Closest to the airport of the three. I could not confirm front desk hours after 11 pm, so check with the hotel before booking.",
      sources: "Sources: hotel listing · no desk hours published",
    },
  },
  {
    id: "coral-sands",
    name: "Coral Sands Beach Hotel",
    neighborhood: "South Beach, Miami Beach",
    rating: 4.4,
    reviewCount: 980,
    pricePerNight: 289,
    total: 972,
    freeCancellation: true,
    room: { name: "King Room, ocean view", facts: "Sleeps 2 · 300 sq ft", faces: "the street and the ocean" },
    checkInFrom: "From 3:00 pm",
    checkOutUntil: "Until 11:00 am",
    photo: "/photos/coral-sands.png",
    placement: "wildcard",
    phone: "(305) 555-0119",
    late: { status: "confirmed", evidence: "The front desk is open 24 hours.", source: "hotel policy page" },
    quiet: { status: "no", quietMentions: 22, noiseMentions: 164 },
    waterWalkMinutes: 1,
    waterName: "the beach",
    airportMinutes: 25,
    designed: {
      reason: "Not a match for quiet: it sits on a busy street. Shown because it is on the beach and the front desk is open 24 hours.",
      sources: "Sources: hotel policy page · 164 of 980 reviews mention “noise”",
    },
  },
  {
    id: "brickell-meridian",
    name: "The Brickell Meridian",
    neighborhood: "Brickell, Miami",
    rating: 4.3,
    reviewCount: 2150,
    pricePerNight: 275,
    total: 928,
    freeCancellation: true,
    room: { name: "King Room, city view", facts: "Sleeps 2 · 340 sq ft" },
    checkInFrom: "From 3:00 pm",
    checkOutUntil: "Until 11:00 am",
    photo: "/photos/brickell-meridian.png",
    placement: "sponsored",
    phone: "(305) 555-0103",
    late: { status: "confirmed", evidence: "The front desk is open 24 hours.", source: "hotel policy page" },
    quiet: { status: "unconfirmed", quietMentions: 140, noiseMentions: 152 },
    waterWalkMinutes: 15,
    waterName: "the bay",
    airportMinutes: 15,
    designed: {
      reason: "The hotel paid for this spot. Front desk is open 24 hours. I could not confirm how quiet the rooms are.",
      sources: "Sources: hotel policy page · no clear pattern in 2,150 reviews",
    },
  },

  // ── Added sample stays (not in Figma) ─────────────────────────────
  // Late arrival and quiet both fine, but over $300 a night.
  stay(
    "grove-isle",
    "Grove Isle Courtyard Hotel",
    "Coconut Grove, Miami",
    4.5,
    730,
    318,
    true,
    "confirmed",
    "confirmed",
    120,
    9,
    8,
    "the bay",
  ),
  stay(
    "biscayne-palm",
    "Biscayne Palm House",
    "Upper East Side, Miami",
    4.4,
    515,
    334,
    true,
    "confirmed",
    "confirmed",
    74,
    5,
    6,
    "the bay",
  ),
  // Late arrival fine and under $300, but not quiet.
  stay(
    "ocean-drive-lofts",
    "Ocean Drive Lofts",
    "South Beach, Miami Beach",
    4.1,
    1340,
    226,
    true,
    "confirmed",
    "no",
    18,
    290,
    2,
    "the beach",
  ),
  stay("wynwood-social", "Wynwood Social Hotel", "Wynwood, Miami", 4.0, 860, 212, false, "confirmed", "no", 12, 205, 30, "the bay"),
  stay("little-havana-inn", "Little Havana Inn", "Little Havana, Miami", 4.2, 390, 189, true, "confirmed", "no", 15, 88, 45, "the bay"),
  stay("downtown-metro", "Downtown Metro Suites", "Downtown, Miami", 4.0, 1120, 254, true, "confirmed", "no", 30, 176, 14, "the bay"),
  // No check-in after midnight.
  stay("coral-way-guesthouse", "Coral Way Guesthouse", "Coral Way, Miami", 4.3, 210, 164, true, "no", "confirmed", 40, 3, 50, "the bay"),
  stay("key-biscayne-cottages", "Key Biscayne Cottages", "Key Biscayne", 4.6, 320, 295, true, "no", "confirmed", 66, 2, 3, "the beach"),
  stay("edgewater-bay", "Edgewater Bay Hotel", "Edgewater, Miami", 4.1, 470, 231, true, "no", "unconfirmed", 31, 29, 5, "the bay"),
  stay(
    "design-district",
    "Design District Suites",
    "Design District, Miami",
    4.3,
    280,
    279,
    false,
    "no",
    "confirmed",
    52,
    4,
    25,
    "the bay",
  ),
  stay(
    "mid-beach-garden",
    "Mid-Beach Garden Hotel",
    "Mid-Beach, Miami Beach",
    4.2,
    610,
    248,
    true,
    "no",
    "confirmed",
    81,
    10,
    4,
    "the beach",
  ),
  stay("brickell-park", "Brickell Park Residences", "Brickell, Miami", 3.9, 450, 205, true, "no", "no", 9, 71, 18, "the bay"),
];

function stay(
  id: string,
  name: string,
  neighborhood: string,
  rating: number,
  reviewCount: number,
  pricePerNight: number,
  freeCancellation: boolean,
  late: LateStatus,
  quiet: QuietStatus,
  quietMentions: number,
  noiseMentions: number,
  waterWalkMinutes: number,
  waterName: string,
): Hotel {
  const lateEvidence: Record<LateStatus, { evidence: string; source: string }> = {
    confirmed: { evidence: "The front desk is open 24 hours.", source: "hotel policy page" },
    conditional: { evidence: "Late arrivals must call ahead.", source: "hotel policy page" },
    unconfirmed: { evidence: "No front desk hours published.", source: "hotel listing" },
    no: { evidence: "The front desk closes at 11:00 pm. No late check-in.", source: "hotel policy page" },
  };
  return {
    id,
    name,
    neighborhood,
    rating,
    reviewCount,
    pricePerNight,
    // Same taxes-and-fees ratio as the designed stays (about 12.8%).
    total: Math.round(pricePerNight * 3 * 1.128),
    freeCancellation,
    placement: "ranked",
    room: { name: "King Room", facts: "Sleeps 2" },
    checkInFrom: "From 3:00 pm",
    checkOutUntil: "Until 11:00 am",
    phone: `(305) 555-01${String(20 + (id.length % 60)).padStart(2, "0")}`,
    late: { status: late, ...lateEvidence[late] },
    quiet: { status: quiet, quietMentions, noiseMentions },
    waterWalkMinutes,
    waterName,
    airportMinutes: AIRPORT_MINUTES[neighborhood.split(",")[0]] ?? 20,
    // Generated with Figma AI for these invented stays (scratch file "Travel Copilot – generated hotel photos").
    photo: `/photos/${id}.png`,
  };
}

/**
 * Demo only: stays without their own gallery reuse Sunset Harbor's room,
 * lobby and balcony photos, plus their own outside photo, so every Hotel
 * detail page shows the designed photo grid (Peri, 22 Nov 2026).
 */
const DEMO_GALLERY = ["/photos/sunset-harbor-room.png", "/photos/sunset-harbor-lobby.png", "/photos/sunset-harbor-balcony.png"];
for (const h of HOTELS) {
  if (!h.gallery && h.photo) h.gallery = [...DEMO_GALLERY, h.photo];
}

export function hotelById(id: string): Hotel | undefined {
  return HOTELS.find((h) => h.id === id);
}

/** One answer about parking, used by Hotel detail and Trip so they never disagree. */
export function parkingAnswer(h: Hotel): { text: string; source?: string } | undefined {
  const p = h.parking;
  if (!p) return undefined;
  if (!p.onSite) return { text: `The hotel lists no on-site parking.`, source: p.source };
  const price = p.perNight ? ` at $${p.perNight} a night` : "";
  const reserve = p.reserve ? ", and you need to reserve it" : ", with no need to reserve";
  const ev =
    p.evCharging === "unconfirmed"
      ? " I could not confirm whether it has charging for electric cars."
      : p.evCharging === "yes"
        ? " It has charging for electric cars."
        : " It has no charging for electric cars.";
  return { text: `Yes. The hotel lists on-site parking${price}${reserve}.${ev}`, source: p.source };
}
