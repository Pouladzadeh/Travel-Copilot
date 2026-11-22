import { describe, expect, it } from "vitest";
import { confirmationNumber, type BookingRecord } from "../bookingRecord";
import { hotelById } from "../hotels";
import { beforeYouTravel, calendarFile, keptSummary, refundToday, tripReply } from "../trip";

const sunset = hotelById("sunset-harbor")!;
const b: BookingRecord = {
  confirmation: confirmationNumber("sunset-harbor", "2027-03-20"),
  hotelId: "sunset-harbor",
  rate: "lowest",
  checkIn: "2027-03-20",
  checkOut: "2027-03-23",
  perNight: 240,
  total: 812,
  firstName: "Peri",
  email: "peri@example.com",
  arrival: "After midnight, around 12:30 am",
  last4: "4417",
  requirements: "late-arrival,quiet,budget:300",
  askedAboutCancelling: true,
};

describe("After booking", () => {
  it("keeps the designed confirmation number for the sample trip", () => {
    expect(b.confirmation).toBe("HW-4821-0320");
    expect(confirmationNumber("palmetto-court", "2027-03-20")).toMatch(/^HW-\d{4}-0320$/);
  });

  it("builds the designed 'Before you travel' checklist (Figma 17:482)", () => {
    const items = beforeYouTravel(b, sunset);
    expect(items.map((i) => i.title)).toEqual([
      "Confirm the late-arrival hold",
      "Your arrival time was sent",
      "This booking cannot be cancelled",
      "Getting there",
    ]);
    expect(items[0].draft).toBe(
      "Hello, I have reservation HW-4821-0320 and arrive around 12:30 am on Sat, Mar 20. Can you confirm my room will be held until then?",
    );
    expect(items[3].text).toBe("About 20 minutes by car from Miami International Airport late at night.");
  });

  it("says what Copilot kept (Figma 17:530)", () => {
    expect(keptSummary(b, true)).toBe(
      "Your requirements (arriving after midnight, quiet, up to $300 a night), your question about free cancellation, and this conversation. They are used only to help with this trip, and you can delete them at any time.",
    );
  });

  it("makes an all-day calendar event for the stay", () => {
    const ics = calendarFile(b, sunset);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270320");
    expect(ics).toContain("DTEND;VALUE=DATE:20270324");
  });
});

describe("Trip and Manage booking", () => {
  it("answers parking from the hotel data, as designed (Figma 121:1698)", () => {
    const a = tripReply("Is there parking at the hotel?", b, sunset);
    expect(a.text).toBe(
      "Yes. The hotel lists on-site parking at $28 a night, with no need to reserve. I could not confirm whether it has charging for electric cars.",
    );
    expect(a.source).toBe("hotel listing");
  });

  it("never cancels or changes for the traveler", () => {
    expect(tripReply("Cancel my booking", b, sunset).text).toMatch(/can’t be cancelled/);
    expect(tripReply("Change my arrival time", b, sunset).link?.href).toBe("/trip/manage");
  });

  it("refunds by the rate rules (Figma 105:2157)", () => {
    expect(refundToday(b, 240, false)).toBe(0);
    const flex = { ...b, rate: "flexible" as const, total: 906 };
    expect(refundToday(flex, 268, true, "2027-03-18", "2027-03-01")).toBe(906);
    expect(refundToday(flex, 268, true, "2027-03-18", "2027-03-19")).toBe(638);
  });
});
