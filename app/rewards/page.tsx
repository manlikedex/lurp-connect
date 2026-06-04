"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Car,
  Copy,
  Gift,
  Package,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

type RewardCode = {
  id: string;
  code: string;
  reward_title: string;
  reward_description: string | null;
  reward_type: string | null;
  xp_required: number | null;
  status: string | null;
  issued_at: string;
  claimed_at: string | null;
};

type Profile = {
  xp: number;
  level: number;
};

const rewardTiers = [
  {
    level: 2,
    title: "Starter Pack",
    type: "Items",
    description: "Useful in-game starter items for active community members.",
    icon: Package,
  },
  {
    level: 5,
    title: "Community Vehicle Token",
    type: "Vehicle",
    description: "Claim an approved starter vehicle from the LURP reward list.",
    icon: Car,
  },
  {
    level: 10,
    title: "Supporter Bonus Pack",
    type: "Items",
    description: "A higher-tier in-game item pack for trusted active members.",
    icon: Gift,
  },
  {
    level: 15,
    title: "Priority Event Entry",
    type: "Community",
    description: "Priority access to selected community events and giveaways.",
    icon: Trophy,
  },
];

export default function RewardsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [codes, setCodes] = useState<RewardCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRewards() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user.id)
        .single();

      const { data: rewardData } = await supabase
        .from("reward_codes")
        .select("*")
        .eq("profile_id", user.id)
        .order("issued_at", { ascending: false });

      setProfile(profileData);
      setCodes(rewardData || []);
      setLoading(false);
    }

    loadRewards();
  }, []);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    alert("Reward code copied.");
  }

  return (
    <AppShell>
      <PageHeader
        badge="Community Rewards"
        title="Earn rewards for being active."
        description="Level up through community activity and unlock in-game reward codes staff can verify."
        icon={Gift}
      />

      {loading && (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading rewards...</p>
        </section>
      )}

      {!loading && !profile && (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <h2 className="text-2xl font-black">Login required</h2>
          <p className="mt-2 text-white/55">
            Login with Discord to view your rewards.
          </p>
        </section>
      )}

      {profile && (
        <>
          <section className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]">
            <aside className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                <Sparkles size={26} />
              </div>

              <p className="text-sm font-bold text-white/40">Your Progress</p>
              <h2 className="mt-2 text-4xl font-black">
                Level {profile.level}
              </h2>
              <p className="mt-1 text-white/45">{profile.xp} XP earned</p>
            </aside>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {rewardTiers.map((tier) => {
                const unlocked = profile.level >= tier.level;

                return (
                  <article
                    key={tier.title}
                    className={`rounded-[2rem] border p-5 ${
                      unlocked
                        ? "border-purple-300/20 bg-purple-300/10"
                        : "border-white/10 bg-[#111118]"
                    }`}
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                      <tier.icon size={22} />
                    </div>

                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                      Level {tier.level} · {tier.type}
                    </p>

                    <h3 className="mt-2 text-xl font-black">{tier.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {tier.description}
                    </p>

                    <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/55">
                      {unlocked ? "Unlocked" : "Locked"}
                    </div>
                  </article>
                );
              })}
            </section>
          </section>

          <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Your Reward Codes</h2>
                <p className="mt-1 text-sm text-white/45">
                  Give these codes to staff when claiming in-game rewards.
                </p>
              </div>

              <BadgeCheck className="text-purple-200" />
            </div>

            {codes.length === 0 && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">
                You do not have any reward codes yet. Level up to unlock your
                first community reward.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {codes.map((reward) => (
                <article
                  key={reward.id}
                  className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-5"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/80">
                    {reward.reward_type || "community"}
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    {reward.reward_title}
                  </h3>

                  {reward.reward_description && (
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {reward.reward_description}
                    </p>
                  )}

                  <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-[#08080d] p-4">
                    <p className="text-xs font-bold text-white/35">
                      Staff Reference Code
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <code className="text-lg font-black text-purple-200">
                        {reward.code}
                      </code>

                      <button
                        onClick={() => copyCode(reward.code)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black capitalize text-white/55">
                    {reward.status}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}