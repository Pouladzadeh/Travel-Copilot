"use client";

import { useRouter } from "next/navigation";
import { useCurrentConversation } from "@/lib/copilot/store";
import { MessageHotelForm } from "../feedback/MessageHotel";
import { ReportForm } from "../feedback/ReportAnswer";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";

/** The dialogs as pages, for links that arrive from outside a screen (footer, emails, the Copilot panel). */
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center px-12 py-24 sm:px-16 md:py-64">
        <section
          aria-labelledby="form-title"
          className="bg-surface border-line flex w-full max-w-[600px] flex-col gap-16 rounded-[20px] border p-20 md:gap-20 md:rounded-[24px] md:p-32"
        >
          <h1 id="form-title" className="text-heading-m text-fg">
            {title}
          </h1>
          {children}
        </section>
      </main>
      <SlimFooter />
    </>
  );
}

function useLeave() {
  const router = useRouter();
  return () => (window.history.length > 1 ? router.back() : router.push("/"));
}

export function ReportPage({ answerId }: { answerId?: string }) {
  const leave = useLeave();
  const { conversation } = useCurrentConversation();
  const item = conversation?.items.find((i) => i.id === answerId);
  return (
    <Shell title="Report this answer">
      <ReportForm answer={item?.type === "copilot" ? item.text : undefined} onDone={leave} />
    </Shell>
  );
}

export function MessageHotelPage({ hotelId, draft, kind }: { hotelId: string; draft?: string; kind?: "request" }) {
  const leave = useLeave();
  return (
    <Shell title="Message the hotel">
      <MessageHotelForm hotelId={hotelId} draft={draft} kind={kind} onDone={leave} />
    </Shell>
  );
}
