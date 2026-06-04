"use client";

import { useEffect, useState } from "react";
import { Circle, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type OnlineMember = {
  profile_id: string;
  last_seen: string;
  profiles:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null;
};

export function OnlineMembers() {
  const [members, setMembers] = useState<OnlineMember[]>([]);

  useEffect(() => {
    refreshPresence();
    loadOnlineMembers();

    const interval = setInterval(() => {
      refreshPresence();
      loadOnlineMembers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function refreshPresence() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("online_members").upsert({
      profile_id: user.id,
      last_seen: new Date().toISOString(),
    });
  }

  async function loadOnlineMembers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("online_members")
      .select(
        `
        profile_id,
        last_seen,
        profiles:profile_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .gte("last_seen", fiveMinutesAgo)
      .order("last_seen", { ascending: false });

    if (error) {
      console.error("Online members error:", error);
      return;
    }

    const formattedMembers =
  data?.map((member) => ({
    ...member,
    profiles: Array.isArray(member.profiles)
      ? member.profiles[0] || null
      : member.profiles,
  })) || [];

setMembers(formattedMembers as OnlineMember[]);
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white/40">Currently Online</p>
          <h2 className="text-xl font-black">{members.length} Members</h2>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black text-emerald-300">
          <Circle size={8} className="fill-current" />
          Live
        </div>
      </div>

      {members.length === 0 && (
        <p className="text-sm text-white/45">No members online right now.</p>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.profile_id}
            className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-purple-300/10 text-purple-200">
              {member.profiles?.avatar_url ? (
                <img
                  src={member.profiles.avatar_url}
                  alt={member.profiles.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={18} />
              )}

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111118] bg-emerald-400" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black">
                {member.profiles?.display_name ||
                  member.profiles?.username ||
                  "LURP Member"}
              </p>
              <p className="text-xs text-white/40">Active now</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}