"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MessageCircle, Send, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";

type ProfileSummary = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Ticket = {
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
};

type Message = {
  id: string;
  ticket_id: string;
  profile_id: string;
  message: string;
  is_staff_reply: boolean | null;
  created_at: string;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

export default function UserTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTicket();
    loadMessages();
  }, [id]);

  function singleProfile(profile: ProfileSummary | ProfileSummary[] | null) {
    return Array.isArray(profile) ? profile[0] || null : profile;
  }

  async function loadTicket() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, reference_number, profile_id, type, category, priority, title, description, status, archived, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Ticket load error:", error);
    }

    setTicket((data as Ticket) || null);
    setLoading(false);
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("support_messages")
      .select(
        `
        id,
        ticket_id,
        profile_id,
        message,
        is_staff_reply,
        created_at,
        profiles:profile_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Messages load error:", error);
    }

    setMessages((data as Message[]) || []);
  }

  async function sendReply() {
    if (!ticket || !reply.trim()) return;

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required.");
      setSending(false);
      return;
    }

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      profile_id: user.id,
      message: reply,
      is_staff_reply: false,
    });

    if (error) {
      alert(error.message);
      setSending(false);
      return;
    }

    await supabase
      .from("support_tickets")
      .update({
        status: "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    setReply("");
    await loadMessages();
    await loadTicket();
    setSending(false);
  }

  if (loading) {
    return (
      <AppShell>
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading ticket...</p>
        </section>
      </AppShell>
    );
  }

  if (!ticket) {
    return (
      <AppShell>
        <Link
          href="/support"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Support
        </Link>

        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <h1 className="text-3xl font-black">Ticket not found.</h1>
          <p className="mt-2 text-white/50">
            This ticket may not exist or you may not have access to it.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        href="/support"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Support
      </Link>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <article className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                  {ticket.type.replaceAll("_", " ")} · {ticket.category}
                </p>

                <h1 className="mt-2 text-3xl font-black">{ticket.title}</h1>

                <p className="mt-2 text-sm font-black text-purple-200">
                  Ref: {ticket.reference_number || ticket.id.slice(0, 8)}
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm text-white/40">
                  <Clock size={15} />
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black capitalize text-emerald-300">
                {ticket.archived
                  ? "Archived"
                  : ticket.status?.replaceAll("_", " ")}
              </span>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">
                {ticket.description}
              </p>
            </div>
          </article>

          <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <h2 className="mb-5 text-2xl font-black">Conversation</h2>

            {messages.length === 0 && (
              <p className="text-sm text-white/45">
                No replies yet. Staff will reply here when they review your
                ticket.
              </p>
            )}

            <div className="space-y-4">
              {messages.map((message) => {
                const author = singleProfile(message.profiles);

                return (
                  <article
                    key={message.id}
                    className={`rounded-[1.5rem] border p-4 ${
                      message.is_staff_reply
                        ? "border-purple-300/20 bg-purple-300/10"
                        : "border-white/10 bg-white/[0.035]"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] text-purple-200">
                        {author?.avatar_url ? (
                          <img
                            src={author.avatar_url}
                            alt={author.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={17} />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-black">
                          {message.is_staff_reply
                            ? "LURP Staff"
                            : author?.display_name ||
                              author?.username ||
                              "You"}
                        </p>
                        <p className="text-xs text-white/35">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">
                      {message.message}
                    </p>
                  </article>
                );
              })}
            </div>

            {!ticket.archived && ticket.status !== "closed" && (
              <div className="mt-6 flex gap-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  placeholder="Continue the conversation..."
                  className="flex-1 resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 text-sm text-white outline-none placeholder:text-white/25"
                />

                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="h-fit rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] disabled:opacity-50"
                >
                  <Send size={17} />
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <MessageCircle size={22} />
            </div>

            <h2 className="text-xl font-black">Ticket Details</h2>

            <div className="mt-5 space-y-2 text-sm text-white/50">
              <p>Reference: {ticket.reference_number || ticket.id.slice(0, 8)}</p>
              <p>Priority: {ticket.priority}</p>
              <p>Category: {ticket.category}</p>
              <p>Type: {ticket.type.replaceAll("_", " ")}</p>
              <p>Status: {ticket.archived ? "Archived" : ticket.status}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
            <h3 className="font-black text-emerald-200">Support Ticket</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-100/70">
              Staff replies and updates will appear in this conversation.
            </p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}