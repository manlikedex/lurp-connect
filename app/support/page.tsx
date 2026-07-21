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
import { ResponseEstimate } from "@/components/support/response-estimate";
import { supabase } from "@/lib/supabase";
import {
  getCurrentTicketPermission,
  type TicketPermissionResult,
} from "@/lib/permission-checks";

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

const defaultPermission: TicketPermissionResult = {
  allowed: true,
  reason: null,
  expiresAt: null,
  restriction: null,
};

export default function SupportPage() {
  const [selectedType, setSelectedType] = useState(ticketTypes[0]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [ticketPermission, setTicketPermission] =
    useState<TicketPermissionResult>(defaultPermission);

  const [form, setForm] = useState({
    category: "Website",
    priority: "normal",
    title: "",
    description: "",
  });

  useEffect(() => {
    loadTickets();
    checkTicketPermission();

    const channel = supabase
      .channel("support-page-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => loadTickets()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_restrictions",
        },
        () => checkTicketPermission()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "member_moderation",
        },
        () => checkTicketPermission()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function checkTicketPermission() {
    setLoadingPermission(true);

    const permission = await getCurrentTicketPermission();

    setTicketPermission(permission);
    setLoadingPermission(false);
  }

  async function loadTickets() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Support auth error:",
        JSON.stringify(userError, null, 2)
      );
      setTickets([]);
      setLoadingTickets(false);
      return;
    }

    if (!user) {
      setTickets([]);
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
      console.error(
        "Support ticket load error:",
        JSON.stringify(error, null, 2)
      );
      setTickets([]);
      setLoadingTickets(false);
      return;
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
    if (!attachment) {
      return null;
    }

    const rawExtension = attachment.name.split(".").pop() || "file";
    const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${userId}/${safeName}`;

    const { error } = await supabase.storage
      .from("ticket-attachments")
      .upload(path, attachment, {
        cacheControl: "3600",
        contentType: attachment.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

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
    const latestPermission = await getCurrentTicketPermission();
    setTicketPermission(latestPermission);

    if (!latestPermission.allowed) {
      alert(
        latestPermission.reason ||
          "Staff have blocked you from creating support tickets."
      );
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      alert("Please add a title and description.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Login with Discord first.");
      setSubmitting(false);
      return;
    }

    let uploadedAttachment: {
      url: string;
      type: string;
      name: string;
    } | null = null;

    try {
      uploadedAttachment = await uploadAttachment(user.id);
    } catch (error) {
      console.error(
        "Attachment upload error:",
        error instanceof Error ? error.message : error
      );
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
        title: form.title.trim(),
        description: form.description.trim(),
        status: "open",
      })
      .select(
        "id, profile_id, type, category, priority, title, description, status, created_at"
      )
      .single();

    if (error) {
      console.error(
        "Support ticket error:",
        JSON.stringify(error, null, 2)
      );
      alert(error.message);
      setSubmitting(false);
      return;
    }

    const { error: messageError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: createdTicket.id,
        profile_id: user.id,
        message: form.description.trim(),
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
      const webhookResponse = await fetch(
        "/api/support/discord-webhook",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createdTicket),
        }
      );

      if (!webhookResponse.ok) {
        const webhookBody = await webhookResponse
          .json()
          .catch(() => null);

        console.error(
          "Support webhook error:",
          webhookBody || webhookResponse.statusText
        );
      }
    } catch (webhookError) {
      console.error("Discord webhook error:", webhookError);
    }

    alert("Support ticket submitted.");

    setForm({
      category: "Website",
      priority: "normal",
      title: "",
      description: "",
    });

    setSelectedType(ticketTypes[0]);
    setAttachment(null);

    await loadTickets();
    setSubmitting(false);
  }

  const canCreateTicket = ticketPermission.allowed;

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
            <h2 className="text-xl font-black">
              What do you need help with?
            </h2>

            <div className="mt-5 grid gap-3">
              {ticketTypes.map((item) => {
                const active = selectedType.type === item.type;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item)}
                    disabled={!canCreateTicket}
                    className={`flex gap-3 rounded-[1.4rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
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
              <AlertTriangle
                size={22}
                className="shrink-0 text-amber-300"
              />

              <div>
                <h3 className="font-black text-amber-200">
                  Provide clear evidence
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-100/70">
                  Player reports and bugs should include clips,
                  screenshots, times, names or steps to reproduce where
                  possible.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <ResponseEstimate priority={form.priority} />

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
            {loadingPermission ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm text-white/50">
                  Checking ticket access...
                </p>
              </div>
            ) : !canCreateTicket ? (
              <div className="rounded-[1.5rem] border border-red-300/20 bg-red-400/10 p-5">
                <h2 className="text-2xl font-black text-red-300">
                  Ticket creation blocked
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-100/65">
                  {ticketPermission.reason ||
                    "Staff have disabled your ability to create support tickets."}
                </p>

                {ticketPermission.expiresAt && (
                  <div className="mt-4 rounded-[1rem] border border-red-300/15 bg-black/10 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-red-200/50">
                      Access restores
                    </p>

                    <p className="mt-1 text-sm font-black text-red-200">
                      {new Date(
                        ticketPermission.expiresAt
                      ).toLocaleString()}
                    </p>
                  </div>
                )}

                {ticketPermission.restriction?.type === "blacklist" && (
                  <p className="mt-4 text-xs leading-5 text-red-100/45">
                    This restriction does not have an automatic expiry.
                    Contact staff through an approved alternative method
                    if you need to appeal.
                  </p>
                )}
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
                    maxLength={150}
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
                    maxLength={8000}
                    placeholder="Explain what happened, who was involved, when it happened, and include evidence links if available..."
                    className="w-full resize-none rounded-[1.3rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25"
                  />

                  <span className="mt-2 block text-right text-xs text-white/25">
                    {form.description.length}/8000
                  </span>
                </label>

                <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-white/70">
                        Image / Video Evidence
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        PNG, JPG, WEBP, GIF, MP4, WEBM or MOV. Max
                        25MB.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/70 transition hover:bg-white/[0.08]">
                      <FileUp size={16} />
                      Choose File

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                        onChange={(event) =>
                          handleAttachment(
                            event.target.files?.[0] || null
                          )
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
                          {(
                            attachment.size /
                            1024 /
                            1024
                          ).toFixed(2)}
                          MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        aria-label="Remove attachment"
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
                  disabled={
                    submitting ||
                    !form.title.trim() ||
                    !form.description.trim()
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
            <h2 className="text-2xl font-black">
              My Recent Tickets
            </h2>

            {loadingTickets && (
              <p className="mt-4 text-sm text-white/45">
                Loading tickets...
              </p>
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
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                        {ticket.type.replaceAll("_", " ")} ·{" "}
                        {ticket.category}
                      </p>

                      <h3 className="mt-1 truncate font-black">
                        {ticket.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                        {ticket.description}
                      </p>

                      <p className="mt-3 text-xs text-white/30">
                        Submitted{" "}
                        {new Date(
                          ticket.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black capitalize text-white/55">
                        {ticket.priority || "normal"}
                      </span>

                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black capitalize text-emerald-300">
                        {ticket.status?.replaceAll("_", " ") ||
                          "open"}
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