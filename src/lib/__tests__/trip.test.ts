import { describe, expect, it } from "vitest";
import { confirmationNumber, type BookingRecord } from "../bookingRecord";
import { hotelById } from "../hotels";
import { beforeYouTravel, calendarFile, keptSummary } from "../trip";

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
