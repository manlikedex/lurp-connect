"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

type RewardCode = {
  id: string;
  profile_id: string;
  code: string;
  reward_title: string;
  reward_description: string | null;
  reward_type: string | null;
  xp_required: number | null;
  status: string | null;
  issued_at: string;
  claimed_at: string | null;
  profiles:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null;
};

export default function RewardCheckerPage() {
  const [code, setCode] = useState("");
  const [reward, setReward] = useState<RewardCode | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkCode() {
    if (!code.trim()) {
      alert("Enter a reward code.");
      return;
    }

    setLoading(true);
    setReward(null);

    const { data, error } = await supabase
      .from("reward_codes")
      .select(
        `
        *,
        profiles:profile_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error(error);
      alert(error.message);
    }

    setReward(data as RewardCode | null);
    setLoading(false);
  }

  async function markClaimed() {
    if (!reward) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("reward_codes")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        checked_by: user?.id || null,
      })
      .eq("id", reward.id);

    if (error) {
      alert(error.message);
      return;
    }

    setReward({
      ...reward,
      status: "claimed",
      claimed_at: new Date().toISOString(),
    });

    alert("Reward marked as claimed.");
  }

  return (
    <AppShell>
      <PageHeader
        badge="Staff Tool"
        title="Reward Code Checker."
        description="Verify LURP reward reference codes before issuing in-game items, vehicles or community perks."
        icon={ShieldCheck}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <ClipboardCheck size={26} />
          </div>

          <h2 className="text-2xl font-black">Check Reward Code</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Enter the player&apos;s reward code exactly as shown on their rewards
            page.
          </p>

          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="LURP-ABC123"
              className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/25"
            />
          </div>

          <button
            onClick={checkCode}
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] disabled:opacity-60"
          >
            <Search size={17} />
            {loading ? "Checking..." : "Check Code"}
          </button>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
          {!reward && !loading && (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <ShieldCheck size={46} className="text-white/30" />
              <h2 className="mt-5 text-2xl font-black">
                No reward selected.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/50">
                Search a valid reward reference code to confirm whether it is
                active, claimed or invalid.
              </p>
            </div>
          )}

          {reward && (
            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/80">
                    {reward.reward_type || "community"} reward
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    {reward.reward_title}
                  </h2>
                </div>

                {reward.status === "active" ? (
                  <CheckCircle2 size={34} className="text-emerald-300" />
                ) : (
                  <XCircle size={34} className="text-red-300" />
                )}
              </div>

              {reward.reward_description && (
                <p className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-white/60">
                  {reward.reward_description}
                </p>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Info label="Code" value={reward.code} />
                <Info label="Status" value={reward.status || "unknown"} />
                <Info
                  label="Issued To"
                  value={
                    reward.profiles?.display_name ||
                    reward.profiles?.username ||
                    "Unknown Member"
                  }
                />
                <Info
                  label="Issued"
                  value={new Date(reward.issued_at).toLocaleString()}
                />
                <Info
                  label="XP Required"
                  value={String(reward.xp_required || 0)}
                />
                <Info
                  label="Claimed"
                  value={
                    reward.claimed_at
                      ? new Date(reward.claimed_at).toLocaleString()
                      : "Not claimed"
                  }
                />
              </div>

              <button
                onClick={markClaimed}
                disabled={reward.status === "claimed"}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BadgeCheck size={17} />
                {reward.status === "claimed"
                  ? "Already Claimed"
                  : "Mark Reward As Claimed"}
              </button>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 break-words font-black">{value}</p>
    </div>
  );
}