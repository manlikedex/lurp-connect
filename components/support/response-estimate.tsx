"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  Headphones,
  LoaderCircle,
  Ticket,
} from "lucide-react";

type ResponseEstimateData = {
  estimate: string;
  minMinutes: number | null;
  maxMinutes: number | null;
  status: "fast" | "normal" | "busy" | "offline";
  activeStaff: number;
  openTickets: number;
  recentStaffReplies: number;
  calculatedAt: string;
  message: string;
};

const statusStyles = {
  fast: {
    label: "Fast response expected",
    classes: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
  },
  normal: {
    label: "Normal response time",
    classes: "border-purple-300/20 bg-purple-400/10 text-purple-200",
  },
  busy: {
    label: "Support is busy",
    classes: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  },
  offline: {
    label: "Limited staff activity",
    classes: "border-red-300/20 bg-red-400/10 text-red-300",
  },
};

export function ResponseEstimate({
  priority = "normal",
}: {
  priority?: string;
}) {
  const [estimate, setEstimate] = useState<ResponseEstimateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadEstimate() {
      try {
        const response = await fetch(
          `/api/support/response-estimate?priority=${encodeURIComponent(
            priority
          )}`,
          {
            cache: "no-store",
          }
        );

        const body = (await response.json()) as ResponseEstimateData;

        if (active) {
          setEstimate(body);
        }
      } catch (error) {
        console.error("Response estimate load error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEstimate();

    const interval = window.setInterval(loadEstimate, 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [priority]);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3 text-sm text-white/45">
          <LoaderCircle size={17} className="animate-spin" />
          Calculating staff response time...
        </div>
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  const style = statusStyles[estimate.status];

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
            <Clock3 size={15} />
            Estimated response
          </div>

          <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            {estimate.estimate}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/50">
            {estimate.message}
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black ${style.classes}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat
          icon={Headphones}
          label="Active Staff"
          value={String(estimate.activeStaff)}
        />

        <Stat
          icon={Ticket}
          label="Open Queue"
          value={String(estimate.openTickets)}
        />

        <Stat
          icon={Activity}
          label="Recent Replies"
          value={String(estimate.recentStaffReplies)}
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-white/30">
        This is an estimate based on live staff activity, the current support
        queue and time of day. Urgent issues may be handled sooner.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-black/10 p-3">
      <div className="flex items-center gap-2 text-white/35">
        <Icon size={14} />
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}