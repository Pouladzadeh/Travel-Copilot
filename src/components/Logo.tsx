/* eslint-disable @next/next/no-img-element */
/**
 * HelloWorld Booking wordmark (Figma component Logo 26:497), supplied by Peri.
 * Light surfaces only. The source PNG is cropped exactly as in Figma.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative block h-[36px] w-[136px] shrink-0 overflow-hidden ${className}`}
      role="img"
      aria-label="HelloWorld Booking"
    >
      <img
        src="/brand/logo.png"
        alt=""
        className="absolute max-w-none"
        style={{ height: "476.19%", left: "-13.1%", top: "-200%", width: "125.94%" }}
      />
    </span>
  );
}
