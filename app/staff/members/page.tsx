"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  Clock,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type Moderation = {
  profile_id: string;
  banned: boolean | null;
  banned_until: string | null;
  portal_timeout: boolean | null;
  timeout_until: string | null;
  can_post: boolean | null;
  can_comment: boolean | null;
  can_create_tickets: boolean | null;
  can_apply_whitelist: boolean | null;
};

type Member = Profile & {
  member_moderation: Moderation[] | null;
};

function getModeration(member: Member) {
  return member.member_moderation?.[0] || null;
}

function isActiveUntil(date: string | null | undefined) {
  if (!date) return false;
  return new Date(date).getTime() > Date.now();
}

export default function StaffMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();

    const channel = supabase
      .channel("staff-members-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "member_moderation",
        },
        () => loadMembers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMembers() {
  setLoading(true);

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Profiles load error:", JSON.stringify(profilesError, null, 2));
    setMembers([]);
    setLoading(false);
    return;
  }

  const { data: moderationData, error: moderationError } = await supabase
    .from("member_moderation")
    .select(
      "profile_id, banned, banned_until, portal_timeout, timeout_until, can_post, can_comment, can_create_tickets, can_apply_whitelist"
    );

  if (moderationError) {
    console.error(
      "Moderation load error:",
      JSON.stringify(moderationError, null, 2)
    );
  }

  const moderationByProfile = new Map(
    (moderationData || []).map((item) => [item.profile_id, item])
  );

  const combinedMembers = (profilesData || []).map((profile) => ({
    ...profile,
    member_moderation: moderationByProfile.has(profile.id)
      ? [moderationByProfile.get(profile.id)]
      : [],
  }));

  setMembers(combinedMembers as Member[]);
  setLoading(false);
}
  const filteredMembers = members.filter((member) => {
    const query = search.toLowerCase();

    return (
      member.id.toLowerCase().includes(query) ||
      member.username?.toLowerCase().includes(query) ||
      member.display_name?.toLowerCase().includes(query)
    );
  });

  const bannedCount = members.filter((member) => {
    const mod = getModeration(member);
    return mod?.banned;
  }).length;

  const timeoutCount = members.filter((member) => {
    const mod = getModeration(member);
    return mod?.portal_timeout && isActiveUntil(mod.timeout_until);
  }).length;

  return (
    <AppShell>
      <PageHeader
        badge="Staff Portal"
        title="Member management."
        description="Monitor portal members, bans, timeouts and posting permissions."
        icon={Users}
      />

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <PremiumCard>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <ShieldCheck size={22} />
            </div>

            <h2 className="text-xl font-black">Moderation Overview</h2>

            <div className="mt-5 grid gap-3">
              <StatBox label="Total Members" value={members.length} />
              <StatBox label="Banned Accounts" value={bannedCount} danger />
              <StatBox label="Active Timeouts" value={timeoutCount} warning />
            </div>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">Tools</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Open a member to ban accounts, timeout access, block posting,
              block comments, disable tickets or prevent whitelist applications.
            </p>
          </PremiumCard>
        </aside>

        <section className="space-y-5">
          <PremiumCard>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-white/40">
                  Portal Members
                </p>
                <h2 className="text-2xl font-black">
                  {loading ? "Loading..." : `${filteredMembers.length} Members`}
                </h2>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/60 lg:w-96">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, username or ID..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>
          </PremiumCard>

          {loading && (
            <PremiumCard>
              <p className="text-white/55">Loading members...</p>
            </PremiumCard>
          )}

          {!loading && filteredMembers.length === 0 && (
            <PremiumCard>
              <h2 className="text-2xl font-black">No members found.</h2>
              <p className="mt-2 text-sm text-white/45">
                Try searching another username or profile ID.
              </p>
            </PremiumCard>
          )}

          {!loading &&
            filteredMembers.map((member) => {
              const mod = getModeration(member);
              const banned = Boolean(mod?.banned);
              const timedOut = Boolean(
                mod?.portal_timeout && isActiveUntil(mod.timeout_until)
              );

              return (
                <Link
                  key={member.id}
                  href={`/staff/members/${member.id}`}
                  className="premium-panel premium-card-hover block rounded-[2rem] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.username || "Member"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={20} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black tracking-[-0.03em]">
                          {member.display_name ||
                            member.username ||
                            "Unknown Member"}
                        </h3>
                        <p className="mt-1 truncate text-xs text-white/35">
                          {member.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {banned && <StatusBadge variant="danger">Banned</StatusBadge>}
                      {timedOut && (
                        <StatusBadge variant="warning">Timed Out</StatusBadge>
                      )}
                      {!banned && !timedOut && (
                        <StatusBadge variant="success">Active</StatusBadge>
                      )}

                      {mod?.can_post === false && (
                        <StatusBadge variant="warning">Post Blocked</StatusBadge>
                      )}

                      {mod?.can_comment === false && (
                        <StatusBadge variant="warning">
                          Comment Blocked
                        </StatusBadge>
                      )}

                      <ArrowUpRight size={16} className="text-white/30" />
                    </div>
                  </div>
                </Link>
              );
            })}
        </section>
      </section>
    </AppShell>
  );
}

function StatBox({
  label,
  value,
  danger = false,
  warning = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-black ${
          danger ? "text-red-300" : warning ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}