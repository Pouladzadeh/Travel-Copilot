"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A panel that opens under a search segment. Closes on Escape or a click
 * outside both the panel and its anchor. Shadow and radius from Figma
 * (Search controls, 101:507).
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  className = "",
  label,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={`absolute z-30 mt-12 rounded-lg border border-line bg-surface shadow-[0px_12px_32px_0px_rgba(13,20,48,0.16)] ${className}`}
    >
      {children}
    </div>
  );
}
