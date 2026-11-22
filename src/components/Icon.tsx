/* eslint-disable @next/next/no-img-element */
/**
 * Icons exported from the Figma file. Colours are baked into each SVG,
 * the same way the Figma components use them, so an icon is picked by name
 * rather than tinted in code.
 */
export type IconName =
  | "close"
  | "plus-link"
  | "search"
  | "pin"
  | "calendar"
  | "user"
  | "sparkle"
  | "sparkle-disabled"
  | "send"
  | "send-active"
  | "chip-x"
  | "chip-plus"
  | "chip-alert"
  | "chevron-down"
  | "pill-sparkle"
  | "pill-check"
  | "pill-alert"
  | "pill-alert-danger"
  | "pill-compass"
  | "pill-clock"
  | "pill-partial"
  | "msg-sparkle"
  | "thumb-up"
  | "flag"
  | "card-image"
  | "heart"
  | "star"
  | "card-pin"
  | "card-sparkle"
  | "checkbox-check"
  | "float-pin"
  | "globe"
  | "globe-footer"
  | "menu"
  | "chevron-up"
  | "trust-check"
  | "star-featured"
  | "phone-sparkle"
  | "phone-send"
  | "faq-minus"
  | "faq-plus"
  | "clock"
  | "plane"
  | "bed"
  | "cal-previous"
  | "cal-next"
  | "stepper-minus"
  | "stepper-plus"
  | "stepper-minus-disabled"
  | "select-chevron"
  | "compact-search"
  | "arrow-left"
  | "heart-20"
  | "grid"
  | "star-16"
  | "pin-16";

export function Icon({ name, size, className = "" }: { name: IconName; size: number; className?: string }) {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Thumbs-down: Figma draws it as the thumbs-up group rotated 180°. */
export function ThumbDownIcon() {
  return (
    <span className="relative block size-16 shrink-0 overflow-hidden" aria-hidden="true">
      <span className="absolute inset-[20.62%_17.19%_15.62%_16.1%] rotate-180">
        <span className="absolute inset-[-6.86%_-6.56%]">
          <img src="/icons/thumb-down-group.svg" alt="" className="block size-full max-w-none" />
        </span>
      </span>
    </span>
  );
}
