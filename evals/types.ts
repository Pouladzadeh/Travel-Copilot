export type Turn = { from: "traveler" | "copilot"; text: string };

export type EvalCase = {
  id: string;
  rule: string;
  heldout: boolean;
  origin: string;
  screen: "results" | "hotel" | "compare" | "booking" | "trip";
  hotelId?: string;
  hotelIds?: string[];
  /** Encoded requirements, e.g. "late-arrival", "budget:300". */
  requirements: string[];
  turns: Turn[];
  must: string[];
  mustNot: string[];
  /** Code checks; see checks.ts for the vocabulary. */
  code: string[];
};
