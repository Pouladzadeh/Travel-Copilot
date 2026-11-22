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
    <span className="rounded-pill bg-brand-subtle text-fg-link px-8 py-[3px] text-[10px] leading-[14px] font-semibold tracking-[0.1px]">
      {children}
    </span>
  );
}

function PhoneScreen() {
  return (
    <div className="absolute top-[82px] left-[216px] flex h-[541px] w-[265px] flex-col gap-[10px] overflow-hidden px-12 pt-[14px] pb-8">
      <div className="flex items-center gap-[6px]">
        <Icon name="sparkle" size={16} />
        <p className="text-fg flex-1 text-[14px] leading-[20px] font-semibold tracking-[-0.1px]">Travel Copilot</p>
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className="text-fg-secondary text-[10px] leading-[14px] font-semibold tracking-[0.1px]">What I understood</p>
        <div className="flex flex-wrap gap-4">
          <MiniChip>Arriving after midnight</MiniChip>
          <MiniChip>Quiet</MiniChip>
          <MiniChip>Up to $300</MiniChip>
        </div>
      </div>
      <div className="flex justify-end">
        <p className="bg-inverse text-fg-on-brand w-[190px] rounded-[14px] rounded-br-[4px] px-[10px] py-8 text-[12px] leading-[16px]">
          I land at 11:30 pm. Can I check in after midnight?
        </p>
      </div>
      <div className="border-line-copilot bg-copilot flex flex-col items-start gap-[6px] rounded-[14px] rounded-tl-[4px] border p-[10px]">
        <p className="text-fg-copilot flex items-center gap-4 text-[10px] leading-[14px] font-semibold tracking-[0.1px]">
          <Icon name="sparkle" size={12} />
          Copilot
        </p>
        <p className="text-fg text-[12px] leading-[16px]">
          Two hotels confirm check-in after midnight. The third has not published its desk hours.
        </p>
        <div className="flex flex-col items-start gap-4">
          <StatusPill type="confirmed" label="2 confirmed · hotel policy" />
          <StatusPill type="unconfirmed" label="1 unconfirmed · check first" />
        </div>
        <p className="text-fg-copilot text-[11px] leading-[14px] font-semibold tracking-[0.1px] underline">View hotel policies</p>
      </div>
      <div className="flex gap-4">
        {["Compare the two", "Only free cancellation"].map((s) => (
          <span
            key={s}
            className="rounded-pill border-line-input bg-surface text-fg border px-8 py-4 text-[10px] leading-[14px] font-semibold tracking-[0.1px]"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex-1" />
      <div className="border-line-input bg-surface flex h-[34.56px] items-center gap-[8.64px] rounded-[7.2px] border-[0.72px] py-[4.32px] pr-[4.32px] pl-[8.64px]">
        <Icon name="phone-sparkle" size={12.96} />
        <p className="text-fg-tertiary flex-1 text-[11.52px] leading-[17.28px]">Ask about these hotels</p>
        <span className="bg-subtle flex size-[25.92px] items-center justify-center rounded-[12.96px]">
          <Icon name="phone-send" size={11.52} />
        </span>
      </div>
    </div>
  );
}

/** Phones and tablets: the same hand and phone, 0.72× in a 350 × 440 card (Mobile · Home 116:1791). */
function HandPhoneCard() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-[440px] w-full max-w-[350px] overflow-hidden rounded-[16px]">
      <Image src="/visuals/airport.png" alt="" fill sizes="350px" className="object-cover" />
      <div className="absolute top-[16px] left-[-41px] h-[840px] w-[560px] origin-top-left scale-[0.72]">
        <div className="absolute inset-0 drop-shadow-[0px_24px_48px_rgba(13,26,77,0.25)]">
          <Image src="/visuals/hand-phone.png" alt="" fill sizes="404px" className="object-cover" />
        </div>
        <PhoneScreen />
      </div>
    </div>
  );
}

export function CopilotBand() {
  return (
    <section className="bg-copilot relative flex justify-center overflow-hidden xl:h-[680px]" aria-labelledby="copilot-heading">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        <div className="absolute top-[-39px] right-0 h-[758px] w-[1010px] opacity-92">
          <Image src="/visuals/airport.png" alt="" fill sizes="1010px" className="object-cover" />
        </div>
        <div className="absolute top-0 right-[2px] h-[680px] w-[1010px] bg-gradient-to-r from-[#f5f9f8] from-0% via-[rgba(245,249,248,0.92)] via-22% to-[rgba(245,249,248,0)] to-62%" />
        <div className="absolute top-[-10px] right-[88px] h-[840px] w-[560px]">
          <div className="absolute inset-0 drop-shadow-[0px_24px_48px_rgba(13,26,77,0.25)]">
            <Image src="/visuals/hand-phone.png" alt="" fill sizes="560px" className="object-cover" />
          </div>
          <PhoneScreen />
        </div>
      </div>

      <div className="relative flex h-full w-full max-w-[var(--container)] flex-col gap-24 px-20 py-32 md:flex-row md:items-center md:gap-48 md:px-32 md:py-48 xl:justify-start xl:py-64">
        <div className="flex w-full flex-col gap-24 md:min-w-0 md:flex-1 xl:w-[580px] xl:flex-none xl:gap-32">
          <p className="text-label-m md:text-heading-s text-fg-copilot flex items-center gap-8">
            <Icon name="sparkle" size={22} />
            Travel Copilot
          </p>
          <h2
            id="copilot-heading"
            className="text-fg -mt-16 text-[24px] leading-[28px] font-bold tracking-[-0.3px] md:mt-0 md:text-[36px] md:leading-[42px] xl:text-[44px] xl:leading-[50px] xl:tracking-[-0.88px]"
          >
            Say what matters.
            <br className="hidden md:block" /> See why each stay fits.
          </h2>
          <ul className="flex flex-col">
            {PRINCIPLES.map((p, i) => (
              <li
                key={p.title}
                className={`flex flex-col gap-4 ${i === 0 ? "pb-20" : "py-20"} ${
                  i < PRINCIPLES.length - 1 ? "border-b border-[rgba(10,92,82,0.18)]" : ""
                }`}
              >
                <p className="text-heading-s text-fg md:text-[20px] md:leading-[26px] md:font-bold md:tracking-[-0.1px]">{p.title}</p>
                <p className="text-body-l text-fg-secondary">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="xl:hidden">
          <HandPhoneCard />
        </div>
      </div>
    </section>
  );
}
