import type { Requirement } from "../requirements";

/** One thing shown in the Copilot panel's conversation. */
export type PanelItem =
  | { type: "traveler"; id: string; text: string }
  | {
      type: "copilot";
      id: string;
      text: string;
      /** Thumbs up / down / Report row. Off for short procedural notes. */
      feedback: boolean;
      rating?: "up" | "down";
      /** Buttons under the answer, e.g. "View Sunset Harbor", "Talk to a person". */
      actions?: PanelAction[];
      /** Facts with a source, shown as a list inside the answer. */
      facts?: { text: string; source: string }[];
    }
  | {
      type: "change";
      id: string;
      title: "Budget changed" | "Requirement removed" | "Requirement added" | "Requirement corrected";
      from?: string;
      to?: string;
      /** Requirements before the change, for Undo. */
      undo: Requirement[];
      undone?: boolean;
    }
  | { type: "checking"; id: string; steps: string[]; done: number }
  | { type: "stopped"; id: string; partial: string };

export type PanelAction =
  | { kind: "link"; label: string; href: string; style: "primary" | "secondary" | "ghost" }
  | { kind: "person"; label: string }
  | { kind: "ask"; label: string; text: string; style: "secondary" | "ghost" };

/** What a reply does: the panel items to add and any requirement change. */
export type Reply = {
  items: PanelItem[];
  /** New requirement list, when the reply changes the search. */
  requirements?: Requirement[];
  /** Suggested next steps under the conversation (Rule 1: never a question list). */
  suggestions?: string[];
  /** Simulate the "Copilot is checking" moment before the answer arrives. */
  checking?: string[];
};

export type ReplyContext = {
  requirements: Requirement[];
  /** Screen the panel is on, so answers can stay in scope. */
  screen: "results" | "hotel" | "compare" | "booking" | "trip";
  hotelId?: string;
};
