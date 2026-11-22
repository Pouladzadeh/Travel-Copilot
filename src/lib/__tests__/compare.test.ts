import { describe, expect, it } from "vitest";
import { choiceReply, compareRows, compareSummary, isSame, tally, tradeOff } from "../compare";
import { hotelById } from "../hotels";
import { decodeRequirements } from "../requirements";

const reqs = decodeRequirements("late-arrival,quiet,budget:300");
const two = ["sunset-harbor", "palmetto-court"].map((id) => hotelById(id)!);
const three = [...two, hotelById("bayfront-garden")!];

describe("Compare", () => {
  it("writes the designed trade-off for two stays (Figma 16:412)", () => {
    expect(tradeOff(two, reqs, 3)).toBe(
      "At the lowest price, Sunset Harbor costs $72 less, but that rate cannot be cancelled. With free cancellation, Palmetto Court is $22 cheaper, but you have to call ahead on the day you arrive.",
    );
  });

  it("adds the third stay to the trade-off (Figma 80:1133)", () => {
    expect(tradeOff(three, reqs, 3)).toMatch(
      /Bayfront Garden Inn is the cheapest at \$672 and can be cancelled, but its late check-in is unconfirmed\.$/,
    );
  });

  it("tallies each stay against the requirements plus cancellation", () => {
    const rows = compareRows(two, reqs, 3);
    expect(tally(rows, 0)).toEqual({ total: 4, text: "2 met · 1 partly · 1 not met" });
    expect(tally(rows, 1)).toEqual({ total: 4, text: "3 met · 1 needs a call" });
  });

  it("hides only rows that are the same for every stay", () => {
    const same = compareRows(two, reqs, 3)
      .filter(isSame)
      .map((r) => r.key);
    expect(same).toEqual(["budget"]);
  });

  it("asks one question when the stays differ on two things (Rule 1)", () => {
    expect(compareSummary(two, reqs)).toBe(
      "Both work for a midnight arrival and your budget. They differ on two things, so the choice is yours: which matters more, not having to call ahead, or being able to cancel?",
    );
  });

  it("answers the choice with facts and leaves booking to the traveler", () => {
    const r = choiceReply("cancel", two, reqs, 3);
    expect(r.hotel.id).toBe("palmetto-court");
    expect(r.text).toContain("free cancellation until Thu, Mar 18, $884 in total");
    expect(r.text).toContain("you have to call ahead on the day you arrive");
    expect(r.text).not.toMatch(/book(ed)? it for you|I('ll| will) book/i);
  });
});
