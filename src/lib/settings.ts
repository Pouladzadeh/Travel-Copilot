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
    // Turning remembering off (or resetting) forgets what was kept.
    if (!next?.remember) window.localStorage.removeItem("tc-remembered");
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

/**
 * Remembered requirements (My data: "Remember my preferences for next time").
 * Saved only while that setting is on; cleared when it is turned off or
 * everything is deleted. Home offers them back as suggested chips: the
 * traveler still has to pick each one, and Copilot says nothing about them.
 */
const REMEMBER_KEY = "tc-remembered";
let rememberedCache: { raw: string | null; value: string } = { raw: null, value: "" };

function readRemembered(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY);
    if (raw !== rememberedCache.raw) rememberedCache = { raw, value: raw ?? "" };
  } catch {
    /* storage blocked: nothing remembered */
  }
  return rememberedCache.value;
}

/** Encoded requirements, as in the URL ("late-arrival,quiet,budget:300"). Empty string clears. */
export function saveRemembered(encoded: string) {
  try {
    if (encoded) window.localStorage.setItem(REMEMBER_KEY, encoded);
    else window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    rememberedCache = { raw: null, value: encoded };
  }
  listeners.forEach((l) => l());
}

export function useRemembered() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readRemembered,
    () => "",
  );
}
