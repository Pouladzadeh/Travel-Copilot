"use client";

/**
 * "What Copilot may keep and use" (My data 56:651). Kept in this browser
 * only. Defaults follow the design: remembering and improving are off,
 * the labeled wildcard is on.
 */
import { useSyncExternalStore } from "react";

export type CopilotSettings = { remember: boolean; improve: boolean; wildcard: boolean };
export const DEFAULT_SETTINGS: CopilotSettings = { remember: false, improve: false, wildcard: true };

const KEY = "tc-settings";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: CopilotSettings } = { raw: null, value: DEFAULT_SETTINGS };

function read(): CopilotSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cache.value;
  }
  if (raw !== cache.raw) {
    try {
      cache = { raw, value: raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS };
    } catch {
      cache = { raw, value: DEFAULT_SETTINGS };
    }
  }
  return cache.value;
}

export function saveSettings(next: CopilotSettings | null) {
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    cache = { raw: null, value: next ?? DEFAULT_SETTINGS };
  }
  listeners.forEach((l) => l());
}

export function useSettings() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT_SETTINGS,
  );
}
