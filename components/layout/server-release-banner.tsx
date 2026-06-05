"use client";

import { useEffect, useMemo, useState } from "react";
import { Rocket } from "lucide-react";

const RELEASE_DATE = new Date("2026-06-26T00:00:00+01:00");

export function ServerReleaseBanner() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    const difference = RELEASE_DATE.getTime() - now.getTime();

    if (difference <= 0) {
      return {
        live: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      live: false,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [now]);

  return (
    <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-emerald-400/20 bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-emerald-500/15">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
            <Rocket size={24} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
              Official Announcement
            </p>

            <h2 className="mt-1 text-lg font-black sm:text-xl">
              {countdown.live
                ? "🚀 LURP Server Is Now Live"
                : "🚀 LURP Server Release — 26th June 2026"}
            </h2>

            <p className="mt-1 text-sm text-white/65">
              {countdown.live
                ? "London Underworld Roleplay is officially live. Join the community and start your story."
                : "London Underworld Roleplay officially launches on 26th June 2026."}
            </p>
          </div>
        </div>

        {!countdown.live ? (
          <div className="grid grid-cols-4 gap-2 sm:min-w-[360px]">
            <TimeBox label="Days" value={countdown.days} />
            <TimeBox label="Hours" value={countdown.hours} />
            <TimeBox label="Mins" value={countdown.minutes} />
            <TimeBox label="Secs" value={countdown.seconds} />
          </div>
        ) : (
          <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
            Server Online
          </div>
        )}
      </div>
    </div>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <p className="text-lg font-black text-white sm:text-xl">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
    </div>
  );
}