"use client";

/**
 * The Copilot conversation for one search, kept for the browser session so
 * the same thread follows the traveler from Results to Hotel detail and
 * Compare ("One conversation across screens"). A new search starts a new one.
 */
import { useCallback, useSyncExternalStore } from "react";
import type { Requirement } from "../requirements";
import type { PanelItem } from "./types";

export type Conversation = {
  key: string;
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

export function useConversation(key: string, init: () => Omit<Conversation, "key">) {
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
    if (!existing || existing.key !== key) write({ key, ...init() });
    // init is stable per key for our callers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback((fn: (c: Conversation) => Conversation) => {
    const c = read();
    if (c) write(fn(c));
  }, []);

  return { conversation, ensure, update };
}

/** Read-only access for other screens (Hotel detail, Compare). */
export function getConversation(): Conversation | null {
  return read();
}
