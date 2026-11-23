import { describe, expect, it } from "vitest";
import { HOTELS } from "../hotels";
import summaries from "../reviewSummaries.json";
import { REVIEWS } from "../reviews";

type P = { label: string; reviews: number[] };
const S = (summaries as unknown as { summaries: Record<string, { summary: string; liked: P[]; watchFor: P[] }> }).summaries;

describe("sample reviews and Copilot summaries", () => {
  it("every stay has eight sample reviews and a summary", () => {
    for (const h of HOTELS) {
      expect(REVIEWS[h.id], h.id).toHaveLength(8);
      expect(S[h.id]?.summary, h.id).toBeTruthy();
      expect(S[h.id]?.liked.length ?? 0, h.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("every liked and watch-for label cites real reviews", () => {
    for (const [id, s] of Object.entries(S)) {
      for (const p of [...s.liked, ...s.watchFor]) {
        expect(p.reviews.length, `${id}: ${p.label}`).toBeGreaterThan(0);
        for (const n of p.reviews) expect(REVIEWS[id][n - 1], `${id} #${n}`).toBeDefined();
      }
    }
  });

  it("reviews never confirm late check-in at a stay where the desk closes at 11 pm", () => {
    for (const h of HOTELS.filter((x) => x.late.status === "no")) {
      for (const r of REVIEWS[h.id]) expect(r.text, h.id).not.toMatch(/desk was (open|there)|checked in at (1|2|12)/i);
    }
  });
});
