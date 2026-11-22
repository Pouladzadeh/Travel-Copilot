import Image from "next/image";
import { Icon } from "../Icon";
import { StatusPill } from "../StatusPill";

/**
 * Home "Travel Copilot" section (Figma 24:603): airport background, hand and
 * phone mockup, three principles. The phone screen is marketing art, so the
 * traveler bubble is dark here on purpose (product uses light grey).
 */

const PRINCIPLES = [
  { title: "Your preferences stay with you", body: "Change your budget or arrival time and your results update." },
  { title: "See the source", body: "Check the hotel policy or guest review behind each answer." },
  { title: "You decide when to book", body: "Copilot checks the details. You make the reservation." },
];

function MiniChip({ children }: { children: string }) {
  return (
    <span className="rounded-pill bg-brand-subtle px-8 py-[3px] text-[10px] font-semibold leading-[14px] tracking-[0.1px] text-fg-link">
      {children}
    </span>
  );
}

function PhoneScreen() {
  return (
    <div className="absolute left-[216px] top-[82px] flex h-[541px] w-[265px] flex-col gap-[10px] overflow-hidden px-12 pb-8 pt-[14px]">
      <div className="flex items-center gap-[6px]">
        <Icon name="sparkle" size={16} />
        <p className="flex-1 text-[14px] font-semibold leading-[20px] tracking-[-0.1px] text-fg">Travel Copilot</p>
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className="text-[10px] font-semibold leading-[14px] tracking-[0.1px] text-fg-secondary">What I understood</p>
        <div className="flex flex-wrap gap-4">
          <MiniChip>Arriving after midnight</MiniChip>
          <MiniChip>Quiet</MiniChip>
          <MiniChip>Up to $300</MiniChip>
        </div>
      </div>
      <div className="flex justify-end">
        <p className="w-[190px] rounded-[14px] rounded-br-[4px] bg-inverse px-[10px] py-8 text-[12px] leading-[16px] text-fg-on-brand">
          I land at 11:30 pm. Can I check in after midnight?
        </p>
      </div>
      <div className="flex flex-col items-start gap-[6px] rounded-[14px] rounded-tl-[4px] border border-line-copilot bg-copilot p-[10px]">
        <p className="flex items-center gap-4 text-[10px] font-semibold leading-[14px] tracking-[0.1px] text-fg-copilot">
          <Icon name="sparkle" size={12} />
          Copilot
        </p>
        <p className="text-[12px] leading-[16px] text-fg">
          Two hotels confirm check-in after midnight. The third has not published its desk hours.
        </p>
        <div className="flex flex-col items-start gap-4">
          <StatusPill type="confirmed" label="2 confirmed · hotel policy" />
          <StatusPill type="unconfirmed" label="1 unconfirmed · check first" />
        </div>
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.1px] text-fg-copilot underline">View hotel policies</p>
      </div>
      <div className="flex gap-4">
        {["Compare the two", "Only free cancellation"].map((s) => (
          <span
            key={s}
            className="rounded-pill border border-line-input bg-surface px-8 py-4 text-[10px] font-semibold leading-[14px] tracking-[0.1px] text-fg"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex h-[34.56px] items-center gap-[8.64px] rounded-[7.2px] border-[0.72px] border-line-input bg-surface py-[4.32px] pl-[8.64px] pr-[4.32px]">
        <Icon name="phone-sparkle" size={12.96} />
        <p className="flex-1 text-[11.52px] leading-[17.28px] text-fg-tertiary">Ask about these hotels</p>
        <span className="flex size-[25.92px] items-center justify-center rounded-[12.96px] bg-subtle">
          <Icon name="phone-send" size={11.52} />
        </span>
      </div>
    </div>
  );
}

export function CopilotBand() {
  return (
    <section className="relative flex h-[680px] justify-center overflow-hidden bg-copilot" aria-labelledby="copilot-heading">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-[-39px] h-[758px] w-[1010px] opacity-92">
          <Image src="/visuals/airport.png" alt="" fill sizes="1010px" className="object-cover" />
        </div>
        <div className="absolute right-[2px] top-0 h-[680px] w-[1010px] bg-gradient-to-r from-[#f5f9f8] from-0% via-[rgba(245,249,248,0.92)] via-22% to-[rgba(245,249,248,0)] to-62%" />
        <div className="absolute right-[88px] top-[-10px] h-[840px] w-[560px]">
          <div className="absolute inset-0 drop-shadow-[0px_24px_48px_rgba(13,26,77,0.25)]">
            <Image src="/visuals/hand-phone.png" alt="" fill sizes="560px" className="object-cover" />
          </div>
          <PhoneScreen />
        </div>
      </div>

      <div className="relative flex h-full w-full max-w-[var(--container)] flex-col justify-center gap-32 px-32 py-64">
        <div className="flex w-[580px] flex-col gap-32">
          <p className="flex items-center gap-8 text-heading-s text-fg-copilot">
            <Icon name="sparkle" size={22} />
            Travel Copilot
          </p>
          <h2 id="copilot-heading" className="text-[44px] font-bold leading-[50px] tracking-[-0.88px] text-fg">
            Say what matters.
            <br />
            See why each stay fits.
          </h2>
          <ul className="flex flex-col">
            {PRINCIPLES.map((p, i) => (
              <li
                key={p.title}
                className={`flex flex-col gap-4 ${i === 0 ? "pb-20" : "py-20"} ${
                  i < PRINCIPLES.length - 1 ? "border-b border-[rgba(10,92,82,0.18)]" : ""
                }`}
              >
                <p className="text-[20px] font-bold leading-[26px] tracking-[-0.1px] text-fg">{p.title}</p>
                <p className="text-body-l text-fg-secondary">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
