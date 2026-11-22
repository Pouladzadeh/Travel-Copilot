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
    <footer className="flex justify-center border-t border-line bg-surface">
      <div className="flex w-full max-w-[var(--container)] flex-col gap-40 px-32 pb-24 pt-48">
        {showHelpBand && (
          <div className="flex items-center justify-between rounded-lg bg-brand-subtle px-32 py-24">
            <div className="flex flex-col gap-4">
              <p className="text-heading-m text-fg">Need help choosing or changing a stay?</p>
              <p className="text-body-m text-fg-secondary">Talk to a person at any step, before or after you book.</p>
            </div>
            <div className="flex items-center gap-12">
              <Link href="#" className={buttonClass("ghost")}>
                Help center
              </Link>
              <Link href="#" className={buttonClass("secondary")}>
                Talk to a person
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-start gap-48">
          <div className="flex min-w-0 flex-1 flex-col gap-12">
            <Logo />
            <p className="text-body-m text-fg-secondary">Stays that fit the trip you are actually taking.</p>
          </div>
          {columns.map((c) => (
            <div key={c.title} className="flex w-[168px] flex-col gap-12">
              <p className="text-label-m text-fg">{c.title}</p>
              {c.links.map((l) => (
                <Link key={l.label} href={l.href} className="text-body-m text-fg-secondary hover:text-fg hover:underline">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-24">
          <div className="flex items-center gap-24">
            <p className="text-body-s text-fg-secondary">© 2026 HelloWorld</p>
            <p className="flex items-center gap-[6px] text-body-s text-fg-secondary">
              <Icon name="sparkle" size={16} />
              Travel Copilot is an AI assistant. It can be wrong, so anything it could not confirm is marked.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-[6px] rounded-pill border border-line px-12 py-[7px] text-label-m text-fg hover:bg-subtle"
          >
            <Icon name="globe-footer" size={18} />
            English (US) · USD
          </button>
        </div>
      </div>
    </footer>
  );
}
