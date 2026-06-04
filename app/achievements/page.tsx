"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Camera,
  Crown,
  Lock,
  MessageCircle,
  Trophy,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  badge_icon: string | null;
  xp_reward: number;
};

type UserAchievement = {
  achievement_id: string;
  earned_at: string;
};

const iconMap = {
  User,
  MessageCircle,
  Camera,
  Briefcase,
  Crown,
  Trophy,
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: achievementData } = await supabase
        .from("achievements")
        .select("id, title, description, badge_icon, xp_reward")
        .eq("enabled", true)
        .order("created_at", { ascending: true });

      if (user) {
        const { data: earnedData } = await supabase
          .from("user_achievements")
          .select("achievement_id, earned_at")
          .eq("profile_id", user.id);

        setEarned(earnedData || []);
      }

      setAchievements(achievementData || []);
      setLoading(false);
    }

    loadAchievements();
  }, []);

  const earnedMap = useMemo(() => {
    const map: Record<string, UserAchievement> = {};

    earned.forEach((item) => {
      map[item.achievement_id] = item;
    });

    return map;
  }, [earned]);

  const earnedCount = earned.length;
  const totalCount = achievements.length;
  const progress =
    totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        badge="Achievements"
        title="Track your LURP milestones."
        description="Unlock badges by creating characters, posting, uploading media and staying active in the community."
        icon={Trophy}
      />

      {loading && (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading achievements...</p>
        </section>
      )}

      {!loading && (
        <>
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-white/40">
                  Achievement Progress
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  {earnedCount} / {totalCount} Unlocked
                </h2>
              </div>

              <div className="w-full md:max-w-md">
                <div className="mb-2 flex justify-between text-sm text-white/45">
                  <span>{progress}% Complete</span>
                  <span>{totalCount - earnedCount} Remaining</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-purple-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => {
              const earnedAchievement = earnedMap[achievement.id];
              const isEarned = Boolean(earnedAchievement);

              const Icon =
                iconMap[
                  (achievement.badge_icon || "Trophy") as keyof typeof iconMap
                ] || Trophy;

              return (
                <article
                  key={achievement.id}
                  className={`rounded-[2rem] border p-5 transition ${
                    isEarned
                      ? "border-purple-300/25 bg-purple-300/10"
                      : "border-white/10 bg-[#111118]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${
                      isEarned
                        ? "bg-purple-300/10 text-purple-200 ring-purple-300/15"
                        : "bg-white/[0.04] text-white/35 ring-white/10"
                    }`}
                  >
                    {isEarned ? <Icon size={26} /> : <Lock size={24} />}
                  </div>

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/45">
                    {isEarned ? (
                      <>
                        <BadgeCheck size={13} />
                        Unlocked
                      </>
                    ) : (
                      <>
                        <Lock size={13} />
                        Locked
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl font-black">{achievement.title}</h2>

                  {achievement.description && (
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {achievement.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-purple-200">
                      +{achievement.xp_reward} XP
                    </span>

                    {earnedAchievement && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/45">
                        {new Date(
                          earnedAchievement.earned_at
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </AppShell>
  );
}