"use client";

import { useSyncExternalStore } from "react";

/** True when the query matches. On the server and during hydration it returns `serverValue`. */
export function useMediaQuery(query: string, serverValue = true) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** The Copilot panel sits beside the content from 1024px; below that it is a bottom sheet. */
export const useDesktop = () => useMediaQuery("(min-width: 1024px)");
