import { describe, expect, it } from "vitest";
import { bookingChecks, bookingReply, checkSummary, quote, validate } from "../booking";
import { hotelById } from "../hotels";
import { decodeRequirements } from "../requirements";

const sunset = hotelById("sunset-harbor")!;
const reqs = decodeRequirements("late-arrival,quiet,budget:300");
const base = {
  hotel: sunset,
  requirements: reqs,
  askedAboutCancelling: true,
  destination: "Miami",
  checkIn: "2027-03-20",
  checkOut: "2027-03-23",
};

describe("Booking", () => {
  it("prices both rates as designed (Figma 15:327, 104:1648)", () => {
    expect(quote(sunset, "lowest", 3)).toMatchObject({ subtotal: 720, taxes: 92, total: 812, refundable: false });
    expect(quote(sunset, "flexible", 3)).toMatchObject({ subtotal: 804, taxes: 102, total: 906, refundable: true });
  });

  it("prices the 'price changed' state at $853 (Figma 76:146)", () => {
    expect(quote(sunset, "lowest", 3, 252).total).toBe(853);
  });

  it("checks the non-refundable booking against the trip", () => {
    const checks = bookingChecks({ ...base, q: quote(sunset, "lowest", 3) });
    expect(checkSummary(checks).map((s) => s.label)).toEqual(["1 differs from your request", "1 to check with the hotel", "3 match"]);
    expect(checks[0].answer).toBe(
      "This rate cannot be cancelled or changed. You asked about free cancellation earlier. The flexible rate costs $94 more in total.",
    );
    expect(checks[0].action).toBe("switch-flexible");
  });

  it("moves cancellation to a match on the flexible rate", () => {
    const checks = bookingChecks({ ...base, q: quote(sunset, "flexible", 3) });
    expect(checkSummary(checks).map((s) => s.label)).toEqual(["1 to check with the hotel", "4 match"]);
    expect(checks[0].key).toBe("hold");
  });

  it("explains non-refundable with the designed answer (moment 120:927)", () => {
    const a = bookingReply("What does non-refundable mean here?", sunset, quote(sunset, "lowest", 3));
    expect(a.text).toBe(
      "If you cancel or don’t arrive, you get nothing back of the $812.00, and the dates and room can’t be changed. The same room on the flexible rate is $906.00 and can be cancelled for free until Thu, Mar 18.",
    );
    expect(a.source).toBe("hotel rate rules");
  });

  it("never books or pays (Rule 5)", () => {
    const a = bookingReply("Can you book it for me?", sunset, quote(sunset, "lowest", 3));
    expect(a.text).toMatch(/can’t make or pay/);
  });

  it("finds the designed form errors (Figma 76:173)", () => {
    const errors = validate(
      {
        firstName: "Peri",
        lastName: "P",
        email: "peri@",
        phone: "",
        arrival: "",
        cardName: "Peri P",
        cardNumber: "4417 2290 18",
        expiry: "08 / 29",
        cvc: "123",
        zip: "98033",
      },
      new Date("2027-01-01"),
    );
    expect(errors.map((e) => e.short)).toEqual(["Email is incomplete", "Phone is missing", "Card number is too short"]);
  });
});
