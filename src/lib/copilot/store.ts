"use client";

/**
 * The Copilot conversation for one search, kept for the browser session so
 * the same thread follows the traveler from Results to Hotel detail and
 * Compare ("One conversation across screens"). A new search starts a new one.
 */
import { useCallback, useSyncExternalStore } from "react";
import type { Requirement } from "../requirements";
import type { PanelItem } from "./types";

export type TripSearch = {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
  rooms: number;
};

export type Conversation = {
  key: string;
  search: TripSearch;
  /** Where "Back to results" goes. */
  resultsHref: string;
  /** What the traveler typed on Home for this thread, if anything. */
  openingText?: string;
  requirements: Requirement[];
  items: PanelItem[];
  suggestions: string[];
  hidden: boolean;
  /** Stays that joined the list after the last change, shown with a "New" tag. */
  newIds: string[];
};

const STORAGE = "tc-conversation";
const listeners = new Set<() => void>();
let current: Conversation | null = null;

function read(): Conversation | null {
  if (current) return current;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE);
    current = raw ? (JSON.parse(raw) as Conversation) : null;
  } catch {
    current = null;
  }
  return current;
}

function write(next: Conversation) {
  current = next;
  try {
    window.sessionStorage.setItem(STORAGE, JSON.stringify(next));
  } catch {
    /* storage can be unavailable; the conversation still works in memory */
  }
  listeners.forEach((l) => l());
}

/**
 * One thread per destination and dates. A new question typed on Home starts
 * a new thread; coming back from Hotel detail or Compare continues it.
 */
export function useConversation(key: string, init: () => Omit<Conversation, "key">, openingText?: string) {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(),
    () => null,
  );

  const conversation: Conversation | null = snapshot && snapshot.key === key ? snapshot : null;

  const ensure = useCallback(() => {
    const existing = read();
    const isNewQuestion = !!openingText && existing?.openingText !== openingText;
    if (!existing || existing.key !== key || isNewQuestion) write({ key, ...init() });
    // init is stable per key for our callers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, openingText]);

  const update = useCallback((fn: (c: Conversation) => Conversation) => {
    const c = read();
    if (c) write(fn(c));
  }, []);

  return { conversation, ensure, update };
}

/** The stored thread, without subscribing (for one-off checks). */
export function peekConversation(): Conversation | null {
  return read();
}

/** For other screens (Hotel detail, Compare): continue the current thread. */
export function useCurrentConversation() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(),
    () => null,
  );
  const update = useCallback((fn: (c: Conversation) => Conversation) => {
    const c = read();
    if (c) write(fn(c));
  }, []);
  const start = useCallback((c: Conversation) => write(c), []);
  return { conversation: snapshot, update, start };
}
