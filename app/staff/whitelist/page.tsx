"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardCheck,
  Clock,
  FileText,
  Inbox,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";

type ProfileSummary = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type WhitelistApplication = {
  id: string;
  reference_number: string | null;
  profile_id: string;
  character_name: string | null;
  age: string | null;
  status: string | null;
  completion_time_seconds: number | null;
  created_at: string;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

const statuses = ["all", "pending", "changes_requested", "approved", "denied"];

function singleProfile(profile: ProfileSummary | ProfileSummary[] | null) {
  return Array.isArray(profile) ? profile[0] || null : profile;
}

function formatTime(seconds: number | null) {
  if (!seconds) return "Unknown";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

export default function StaffWhitelistPage() {
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();

    const channel = supabase
      .channel(`staff-whitelist-${activeStatus}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whitelist_applications",
        },
        () => loadApplications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeStatus]);

  async function loadApplications() {
    setLoading(true);

    let query = supabase
      .from("whitelist_applications")
      .select(
        `
        id,
        reference_number,
        profile_id,
        character_name,
        age,
        status,
        completion_time_seconds,
        created_at,
        profiles:profile_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false });

    if (activeStatus !== "all") {
      query = query.eq("status", activeStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Whitelist load error:", error);
      setApplications([]);
      setLoading(false);
      return;
    }

    setApplications((data as WhitelistApplication[]) || []);
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Staff Portal"
        title="Whitelist applications."
        description="Review, approve, deny, cooldown or blacklist whitelist applicants."
        icon={ShieldCheck}
      />

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <PremiumCard>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <ClipboardCheck size={22} />
            </div>

            <h2 className="text-xl font-black">Filter Applications</h2>

            <div className="mt-5 grid gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`rounded-full px-4 py-3 text-left text-sm font-black capitalize transition ${
                    activeStatus === status
                      ? "bg-white text-[#111118]"
                      : "border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                  }`}
                >
                  {status.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">Moderation Tools</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Open an application to approve, deny, request changes, place a
              cooldown, or blacklist the applicant.
            </p>
          </PremiumCard>
        </aside>

        <section className="space-y-4">
          <PremiumCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/40">
                  Application Queue
                </p>
                <h2 className="text-2xl font-black">
                  {loading
                    ? "Loading..."
                    : `${applications.length} Applications`}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                <FileText size={22} />
              </div>
            </div>
          </PremiumCard>

          {loading && (
            <PremiumCard>
              <p className="text-white/55">Loading applications...</p>
            </PremiumCard>
          )}

          {!loading && applications.length === 0 && (
            <PremiumCard className="text-center">
              <Inbox size={42} className="mx-auto text-white/25" />
              <h2 className="mt-4 text-2xl font-black">
                No applications found
              </h2>
              <p className="mt-2 text-sm text-white/45">
                There are no applications matching this status.
              </p>
            </PremiumCard>
          )}

          {!loading &&
            applications.map((application) => {
              const owner = singleProfile(application.profiles);

              return (
                <Link
                  key={application.id}
                  href={`/staff/whitelist/${application.id}`}
                  className="premium-panel premium-card-hover block rounded-[2rem] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                        {application.reference_number ||
                          application.id.slice(0, 8)}
                      </p>

                      <h3 className="mt-2 text-2xl font-black tracking-[-0.035em]">
                        {application.character_name || "Unnamed Character"}
                      </h3>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/50">
                          <Clock size={13} />
                          {new Date(
                            application.created_at
                          ).toLocaleDateString()}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/50">
                          Age: {application.age || "Unknown"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/50">
                          Time:{" "}
                          {formatTime(application.completion_time_seconds)}
                        </span>

                        <StatusBadge
                          variant={
                            application.status === "approved"
                              ? "success"
                              : application.status === "denied"
                                ? "danger"
                                : application.status === "changes_requested"
                                  ? "warning"
                                  : "purple"
                          }
                        >
                          {application.status?.replaceAll("_", " ") ||
                            "pending"}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-purple-300/10 text-purple-200">
                        {owner?.avatar_url ? (
                          <img
                            src={owner.avatar_url}
                            alt={owner.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {owner?.display_name ||
                            owner?.username ||
                            "Unknown Member"}
                        </p>
                        <p className="text-xs text-white/35">Applicant</p>
                      </div>

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