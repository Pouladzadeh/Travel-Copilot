import Link from "next/link";
import { buttonClass } from "./Button";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

/** Footer (Figma 24:666): help band, link columns, AI disclosure. */

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "#" },
      { label: "Talk to a person", href: "#" },
      { label: "Cancellation options", href: "#" },
    ],
  },
  {
    title: "Travel Copilot",
    links: [
      { label: "How Copilot works", href: "/how-copilot-ranks" },
      { label: "My data", href: "/my-data" },
      { label: "Report an answer", href: "/report" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Cookie settings", href: "#" },
    ],
  },
];

export function SiteFooter({ showHelpBand = true }: { showHelpBand?: boolean }) {
  return (
    <footer className="border-line bg-surface flex justify-center border-t">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-24 px-20 pt-32 pb-24 md:gap-40 md:px-32 md:pt-48">
        {showHelpBand && (
          <div className="bg-brand-subtle flex flex-col items-start gap-12 rounded-lg p-20 md:flex-row md:items-center md:justify-between md:px-32 md:py-24">
            <div className="flex flex-col gap-4">
              <p className="text-heading-m text-fg">Need help choosing or changing a stay?</p>
              <p className="text-body-m text-fg-secondary">Talk to a person at any step, before or after you book.</p>
            </div>
            <div className="flex w-full flex-col-reverse gap-8 sm:w-auto sm:flex-row sm:items-center sm:gap-12">
              <Link href="#" className={`${buttonClass("ghost")} max-sm:hidden`}>
                Help center
              </Link>
              <Link href="#" className={buttonClass("secondary")}>
                Talk to a person
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-16 gap-y-24 md:flex md:items-start md:gap-48">
          <div className="hidden min-w-0 flex-1 flex-col gap-12 md:flex">
            <Logo />
            <p className="text-body-m text-fg-secondary">Stays that fit the trip you are actually taking.</p>
          </div>
          {columns.map((c) => (
            <div key={c.title} className="flex flex-col gap-12 md:w-[168px]">
              <p className="text-label-m text-fg">{c.title}</p>
              {c.links.map((l) => (
                <Link key={l.label} href={l.href} className="text-body-m text-fg-secondary hover:text-fg hover:underline">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="border-line flex flex-col gap-12 border-t pt-12 md:flex-row md:items-center md:justify-between md:pt-24">
          <div className="flex flex-col-reverse gap-12 md:flex-row md:items-center md:gap-24">
            <p className="text-body-s text-fg-secondary">© 2026 HelloWorld</p>
            <p className="text-body-s text-fg-secondary flex items-start gap-[6px] md:items-center">
              <Icon name="sparkle" size={16} />
              Travel Copilot is an AI assistant. It can be wrong, so anything it could not confirm is marked.
            </p>
          </div>
          <button
            type="button"
            className="rounded-pill border-line text-label-m text-fg hover:bg-subtle flex items-center gap-[6px] self-end border px-12 py-[7px] md:self-auto"
          >
            <Icon name="globe-footer" size={18} />
            English (US) · USD
          </button>
        </div>
      </div>
    </footer>
  );
}
