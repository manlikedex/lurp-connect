"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bug,
  FileUp,
  Gift,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Send,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";
import { canCurrentUserCreateTickets } from "@/lib/permission-checks";

const ticketTypes = [
  {
    type: "bug",
    title: "Bug Report",
    description: "Report website, server or feature issues.",
    icon: Bug,
  },
  {
    type: "suggestion",
    title: "Suggestion",
    description: "Suggest new ideas or improvements.",
    icon: Lightbulb,
  },
  {
    type: "player_report",
    title: "Player Report",
    description: "Report rule breaks or player behaviour.",
    icon: ShieldAlert,
  },
  {
    type: "rule_question",
    title: "Rule Question",
    description: "Ask staff about a rule or situation.",
    icon: HelpCircle,
  },
  {
    type: "reward_issue",
    title: "Reward Issue",
    description: "Get help with XP, rewards or claim codes.",
    icon: Gift,
  },
  {
    type: "account_issue",
    title: "Account Support",
    description: "Get help with your profile or account.",
    icon: UserRound,
  },
];

const categories = [
  "Website",
  "FiveM",
  "Discord",
  "Rewards",
  "Profile",
  "Events",
  "Businesses",
  "Rules",
  "Other",
];

const priorities = ["low", "normal", "high", "urgent"];

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

type Ticket = {
  id: string;
  type: string;
  category: string;
  priority: string | null;
  title: string;
  description: string;
  status: string | null;
  created_at: string;
};

export default function SupportPage() {
  const [selectedType, setSelectedType] = useState(ticketTypes[0]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canCreateTicket, setCanCreateTicket] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);

  const [form, setForm] = useState({
    category: "Website",
    priority: "normal",
    title: "",
    description: "",
  });

  useEffect(() => {
    loadTickets();
    checkTicketPermission();
  }, []);

  async function checkTicketPermission() {
    const allowed = await canCurrentUserCreateTickets();
    setCanCreateTicket(allowed);
  }

  async function loadTickets() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingTickets(false);
      return;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, type, category, priority, title, description, status, created_at"
      )
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Support ticket load error:", JSON.stringify(error, null, 2));
    }

    setTickets((data as Ticket[]) || []);
    setLoadingTickets(false);
  }

  function handleAttachment(file: File | null) {
    if (!file) {
      setAttachment(null);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert("Only images and videos are allowed.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Attachment must be under 25MB.");
      return;
    }

    setAttachment(file);
  }

  async function uploadAttachment(userId: string) {
    if (!attachment) return null;

    const extension = attachment.name.split(".").pop();
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${userId}/${safeName}`;

    const { error } = await supabase.storage
      .from("ticket-attachments")
      .upload(path, attachment, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("ticket-attachments")
      .getPublicUrl(path);

    return {
      url: data.publicUrl,
      type: attachment.type.startsWith("image/") ? "image" : "video",
      name: attachment.name,
    };
  }

  async function submitTicket() {
    if (!canCreateTicket) {
      alert("Staff have blocked you from creating support tickets.");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      alert("Please add a title and description.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login with Discord first.");
      setSubmitting(false);
      return;
    }

    let uploadedAttachment = null;

    try {
      uploadedAttachment = await uploadAttachment(user.id);
    } catch (error) {
      console.error("Attachment upload error:", error);
      alert("Attachment upload failed.");
      setSubmitting(false);
      return;
    }

    const { data: createdTicket, error } = await supabase
      .from("support_tickets")
      .insert({
        profile_id: user.id,
        type: selectedType.type,
        category: form.category,
        priority: form.priority,
        title: form.title,
        description: form.description,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Support ticket error:", JSON.stringify(error, null, 2));
      alert(error.message);
      setSubmitting(false);
      return;
    }

    if (createdTicket) {
      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: createdTicket.id,
          profile_id: user.id,
          message: form.description,
          is_staff_reply: false,
          attachment_url: uploadedAttachment?.url || null,
          attachment_type: uploadedAttachment?.type || null,
          attachment_name: uploadedAttachment?.name || null,
        });

      if (messageError) {
        console.error(
          "Initial support message error:",
          JSON.stringify(messageError, null, 2)
        );
      }

      try {
        await fetch("/api/support/discord-webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createdTicket),
        });
      } catch (webhookError) {
        console.error("Discord webhook error:", webhookError);
      }
    }

    alert("Support ticket submitted.");

    setForm({
      category: "Website",
      priority: "normal",
      title: "",
      description: "",
    });

    setAttachment(null);
    await loadTickets();
    setSubmitting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Support Centre"
        title="Need help with LURP Connect?"
        description="Submit bug reports, suggestions, player reports, reward issues and account support requests."
        icon={MessageCircle}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <h2 className="text-xl font-black">What do you need help with?</h2>

            <div className="mt-5 grid gap-3">
              {ticketTypes.map((item) => {
                const active = selectedType.type === item.type;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item)}
                    className={`flex gap-3 rounded-[1.4rem] border p-4 text-left transition ${
                      active
                        ? "border-purple-300/25 bg-purple-300/10"
                        : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]"
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                      <item.icon size={20} />
                    </div>

                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-white/50">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-400/20 bg-amber-500/10 p-5">
            <div className="flex gap-3">
              <AlertTriangle size={22} className="shrink-0 text-amber-300" />
              <div>
                <h3 className="font-black text-amber-200">
                  Provide clear evidence
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-100/70">
                  Player reports and bugs should include clips, screenshots,
                  times, names or steps to reproduce where possible.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
            {!canCreateTicket ? (
              <div className="rounded-[1.5rem] border border-red-300/20 bg-red-400/10 p-5">
                <h2 className="text-2xl font-black text-red-300">
                  Ticket creation blocked
                </h2>
                <p className="mt-2 text-sm text-red-100/65">
                  Staff have disabled your ability to create support tickets.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                    <selectedType.icon size={22} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white/40">
                      New Support Ticket
                    </p>
                    <h2 className="text-2xl font-black">
                      {selectedType.title}
                    </h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-black text-white/70">
                      Category
                    </span>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.3rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none"
                    >
                      {categories.map((category) => (
                        <option
                          key={category}
                          value={category}
                          className="bg-[#111118]"
                        >
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-white/70">
                      Priority
                    </span>
                    <select
                      value={form.priority}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          priority: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.3rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm capitalize text-white outline-none"
                    >
                      {priorities.map((priority) => (
                        <option
                          key={priority}
                          value={priority}
                          className="bg-[#111118]"
                        >
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-black text-white/70">
                    Title
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Short summary of the issue"
                    className="w-full rounded-[1.3rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-black text-white/70">
                    Description
                  </span>
                  <textarea
                    rows={8}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Explain what happened, who was involved, when it happened, and include evidence links if available..."
                    className="w-full resize-none rounded-[1.3rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25"
                  />
                </label>

                <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-white/70">
                        Image / Video Evidence
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        PNG, JPG, WEBP, GIF, MP4, WEBM or MOV. Max 25MB.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/70 transition hover:bg-white/[0.08]">
                      <FileUp size={16} />
                      Choose File
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                        onChange={(event) =>
                          handleAttachment(event.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {attachment && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-[1rem] border border-purple-300/20 bg-purple-400/10 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-purple-100">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-purple-100/50">
                          {(attachment.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="rounded-full bg-white/10 p-2 text-white/60 hover:bg-white/20"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={submitTicket}
                  disabled={submitting}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
            <h2 className="text-2xl font-black">My Recent Tickets</h2>

            {loadingTickets && (
              <p className="mt-4 text-sm text-white/45">Loading tickets...</p>
            )}

            {!loadingTickets && tickets.length === 0 && (
              <p className="mt-4 text-sm text-white/45">
                You have not submitted any support tickets yet.
              </p>
            )}

            <div className="mt-5 grid gap-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/tickets/${ticket.id}`}
                  className="block rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/[0.055]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                        {ticket.type.replaceAll("_", " ")} · {ticket.category}
                      </p>
                      <h3 className="mt-1 font-black">{ticket.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black capitalize text-white/55">
                        {ticket.priority}
                      </span>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black capitalize text-emerald-300">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}