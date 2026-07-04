"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Filter,
  Inbox,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

type ProfileSummary = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type StaffTicket = {
  id: string;
  reference_number: string | null;
  profile_id: string;
  type: string;
  category: string;
  priority: string | null;
  title: string;
  description: string;
  status: string | null;
  archived: boolean | null;
  created_at: string;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

const statuses = [
  "all",
  "open",
  "reviewing",
  "waiting_for_player",
  "resolved",
  "closed",
  "archived",
];

export default function StaffTicketsPage() {
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [activeStatus]);

  function singleProfile(profile: ProfileSummary | ProfileSummary[] | null) {
    return Array.isArray(profile) ? profile[0] || null : profile;
  }

  async function loadTickets() {
    setLoading(true);

    let query = supabase
      .from("support_tickets")
      .select(
        `
        id,
        reference_number,
        profile_id,
        type,
        category,
        priority,
        title,
        description,
        status,
        archived,
        created_at,
        profiles:profile_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false });

    if (activeStatus === "archived") {
      query = query.eq("archived", true);
    } else {
      query = query.eq("archived", false);

      if (activeStatus !== "all") {
        query = query.eq("status", activeStatus);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Staff tickets load error:", error);
      setTickets([]);
      setLoading(false);
      return;
    }

    setTickets((data as StaffTicket[]) || []);
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Staff Portal"
        title="Support tickets."
        description="Review, respond to and manage LURP Connect support tickets."
        icon={ShieldCheck}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <Filter size={22} />
            </div>

            <h2 className="text-xl font-black">Filter Tickets</h2>

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
          </div>

          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
            <Inbox className="text-emerald-300" />
            <h3 className="mt-3 font-black text-emerald-200">
              Staff Ticket Queue
            </h3>
            <p className="mt-2 text-sm leading-6 text-emerald-100/70">
              New support tickets submitted through LURP Connect appear here for
              staff review.
            </p>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/40">Ticket Queue</p>
                <h2 className="text-2xl font-black">
                  {loading ? "Loading..." : `${tickets.length} Tickets`}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                <Ticket size={22} />
              </div>
            </div>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
              <p className="text-white/55">Loading tickets...</p>
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-8 text-center">
              <Inbox size={42} className="mx-auto text-white/25" />
              <h2 className="mt-4 text-2xl font-black">No tickets found</h2>
              <p className="mt-2 text-sm text-white/45">
                There are no tickets matching this status.
              </p>
            </div>
          )}

          {!loading &&
            tickets.map((ticket) => {
              const owner = singleProfile(ticket.profiles);

              return (
                <Link
                  key={ticket.id}
                  href={`/staff/tickets/${ticket.id}`}
                  className="block rounded-[2rem] border border-white/10 bg-[#111118] p-5 transition hover:-translate-y-1 hover:bg-white/[0.035]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                        {ticket.reference_number || ticket.id.slice(0, 8)} ·{" "}
                        {ticket.type.replaceAll("_", " ")} · {ticket.category}
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {ticket.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                        {ticket.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/50">
                          <Clock size={13} />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 capitalize text-white/50">
                          {ticket.priority || "normal"}
                        </span>

                        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 capitalize text-emerald-300">
                          {ticket.archived
                            ? "Archived"
                            : ticket.status?.replaceAll("_", " ") || "open"}
                        </span>
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
                        <p className="text-xs text-white/35">Submitted by</p>
                      </div>
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