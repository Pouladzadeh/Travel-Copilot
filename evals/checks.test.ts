import { describe, expect, it } from "vitest";
import type { ModelReply } from "@/lib/copilot/prompt";
import { HOTELS, hotelById } from "@/lib/hotels";
import { runCodeChecks } from "./checks";
import casesFile from "./cases.json";
import type { EvalCase } from "./types";

const cases = casesFile.cases as EvalCase[];
const reply = (over: Partial<ModelReply> = {}): ModelReply =>
  ({
    answer: "",
    facts: [],
    hotel_links: [],
    offer_person: false,
    suggestions: [],
    ...over,
  }) as ModelReply;
const one = (id: string) => cases.find((c) => c.id === id)!;
const failed = (id: string, r: ModelReply) =>
  runCodeChecks(one(id), r)
    .filter((k) => !k.pass)
    .map((k) => k.check);

describe("cases.json is well formed", () => {
  it("has unique ids, a traveler last turn and known checks", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    for (const c of cases) {
      expect(c.turns[c.turns.length - 1].from).toBe("traveler");
      // Throws on an unknown check name, or an unknown predicate.
      expect(() => runCodeChecks(c, reply())).not.toThrow();
    }
  });

  it("only refers to hotels that exist", () => {
    for (const c of cases) {
      for (const id of [c.hotelId, ...(c.hotelIds ?? [])]) if (id) expect(hotelById(id), `${c.id}: ${id}`).toBeTruthy();
    }
  });

  it("has 10 held-out cases", () => {
    expect(cases.filter((c) => c.heldout)).toHaveLength(10);
  });
});

describe("code checks", () => {
  it("one question: counts question marks", () => {
    expect(failed("oq-01", reply({ answer: "Which area? And what budget?" }))).toContain("max_one_question");
    expect(failed("oq-01", reply({ answer: "Here is my pick. Is that okay?" }))).toEqual([]);
  });

  it("say what changed: budget and add/remove", () => {
    expect(failed("sc-03", reply({ requirement_change: { op: "budget", max_per_night: 350 } }))).toEqual([]);
    expect(failed("sc-03", reply({ requirement_change: { op: "budget", max_per_night: 300 } }))).toContain("change:budget:350");
    expect(failed("sc-04", reply({ requirement_change: { op: "budget", max_per_night: null } }))).toEqual([]);
    expect(failed("sc-05", reply({ requirement_change: { op: "remove", kind: "quiet" } }))).toContain("no_change");
  });

  it("stop at money: person offered and no booking claim", () => {
    expect(failed("sm-01", reply({ answer: "I can't book that. Want a person?", offer_person: true }))).toEqual([]);
    expect(failed("sm-01", reply({ answer: "Done, I've booked Sunset Harbor.", offer_person: false }))).toEqual(
      expect.arrayContaining(["offer_person_true", "no_booking_claim"]),
    );
  });

  it("evidence: sources must come from the data", () => {
    expect(failed("ev-01", reply({ facts: [{ text: "Check-in from 3 pm", source: "hotel policy page" }] }))).toEqual([]);
    expect(failed("ev-01", reply({ facts: [{ text: "Check-in from 3 pm", source: "a blog" }] }))).toContain("facts_sourced");
  });

  it("prices: only numbers in the data, or simple differences of them", () => {
    expect(failed("ev-01", reply({ answer: "It is $240 a night." }))).toEqual([]);
    expect(failed("ev-01", reply({ answer: "It is $9999 a night." }))).toContain("prices_match_data");
  });

  it("helps decide: a late-arrival answer must not recommend a desk that closes", () => {
    const closes = HOTELS.find((h) => h.late.status === "no");
    const opens = HOTELS.find((h) => h.late.status === "confirmed");
    expect(closes && opens).toBeTruthy();
    expect(failed("hd-01", reply({ hotel_links: [opens!.id] }))).toEqual([]);
    expect(failed("hd-01", reply({ hotel_links: [closes!.id] }))).toEqual(
      expect.arrayContaining(["names_stay_where:lateCheckIn=confirmed", "not_recommend_where:lateCheckIn=no"]),
    );
  });

  it("sentence and stay limits", () => {
    expect(failed("hd-05", reply({ answer: "One. Two.", hotel_links: ["a", "b"] }))).toContain("stays_max:1");
  });
});
