"use client";

/** Stays picked for Compare, shared by Results and Hotel detail for the session. Up to three. */
import { useCallback, useSyncExternalStore } from "react";

const KEY = "tc-compare";
const listeners = new Set<() => void>();
let ids: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (ids) return ids;
  if (typeof window === "undefined") return EMPTY;
  try {
    ids = JSON.parse(window.sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    ids = [];
  }
  return ids ?? EMPTY;
}

function write(next: string[]) {
  ids = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* in-memory only */
  }
  listeners.forEach((l) => l());
}

export const MAX_COMPARE = 3;

export function useCompare() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
  const toggle = useCallback((id: string, on: boolean) => {
    const cur = read();
    if (on && !cur.includes(id) && cur.length < MAX_COMPARE) write([...cur, id]);
    if (!on) write(cur.filter((x) => x !== id));
  }, []);
  const clear = useCallback(() => write([]), []);
  return { ids: list, toggle, clear, full: list.length >= MAX_COMPARE };
}
