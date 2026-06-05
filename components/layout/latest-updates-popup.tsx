"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Bell, Gift, Sparkles, Trophy, X } from "lucide-react";

const APP_UPDATE_VERSION = "2025-01-01-xp-rewards";

const updates = [
  {
    title: "XP progression",
    description: "Earn XP from posts, comments, uploads, characters and likes.",
    icon: Trophy,
  },
  {
    title: "Reward codes",
    description: "Unlock staff-checkable codes for in-game rewards.",
    icon: Gift,
  },
  {
    title: "Achievements",
    description: "Earn badges for milestones across LURP Connect.",
    icon: BadgeCheck,
  },
  {
    title: "Notifications",
    description: "Level ups and rewards now appear in the bell.",
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-3 py-4 backdrop-blur-sm sm:px-5">
      <div className="relative max-h-[92vh] w-full max-w-[520px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#111118] shadow-2xl shadow-black/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.20),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(217,70,239,0.10),transparent_32%)]" />

        <button
          onClick={closePopup}
          className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-white/[0.05] p-2 text-white/50 transition hover:bg-white/[0.09] hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="relative max-h-[92vh] overflow-y-auto p-4 sm:p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <Sparkles size={21} />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200">
            Latest Update
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Progression is live.
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/55">
            XP, achievements, reward codes and notifications are now available
            on LURP Connect.
          </p>

          <div className="mt-5 grid gap-2">
            {updates.map((update) => (
              <div
                key={update.title}
                className="flex gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                  <update.icon size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-black">{update.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-white/50">
                    {update.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={closePopup}
            className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.01]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}