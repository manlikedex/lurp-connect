"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, BadgeCheck, Gift, Bell, Trophy } from "lucide-react";

const APP_UPDATE_VERSION = "2025-01-01-xp-rewards";

const updates = [
  {
    title: "XP progression is now live",
    description:
      "Earn XP from community activity including posts, comments, uploads, characters and received likes.",
    icon: Trophy,
  },
  {
    title: "Rewards and claim codes",
    description:
      "Level up to unlock reward codes that staff can verify for in-game items, cars and community perks.",
    icon: Gift,
  },
  {
    title: "Achievements added",
    description:
      "Unlock achievements for milestones like your first character, first post and first upload.",
    icon: BadgeCheck,
  },
  {
    title: "Notifications improved",
    description:
      "Level ups, achievements and reward unlocks now appear in your notification bell.",
    icon: Bell,
  },
];

export function LatestUpdatesPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem("lurp_seen_update_version");

    if (seenVersion !== APP_UPDATE_VERSION) {
      setOpen(true);
    }
  }, []);

  function closePopup() {
    localStorage.setItem("lurp_seen_update_version", APP_UPDATE_VERSION);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118] shadow-2xl shadow-black/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(217,70,239,0.12),transparent_32%)]" />

        <button
          onClick={closePopup}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/50 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <Sparkles size={26} />
          </div>

          <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
            Latest LURP Connect Update
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
            Progression update is here.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
            We have added XP, achievements, rewards, staff-checkable reward
            codes and more community progression features.
          </p>

          <div className="mt-7 grid gap-3">
            {updates.map((update) => (
              <div
                key={update.title}
                className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                  <update.icon size={19} />
                </div>

                <div>
                  <h3 className="font-black">{update.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    {update.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={closePopup}
            className="mt-7 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
          >
            Got it, show me the app
          </button>
        </div>
      </div>
    </div>
  );
}