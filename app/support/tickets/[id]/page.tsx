"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileUp,
  MessageCircle,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";

type ProfileSummary = {
  id?: string;
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
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  profiles: ProfileSummary | null;
};

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

export default function UserTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const [typingChannel, setTypingChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);
    }

    getCurrentUser();
  }, []);

  useEffect(() => {
    loadTicket();
    loadMessages();

    const channel = supabase
      .channel(`ticket-room-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `id=eq.${id}`,
        },
        () => loadTicket()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${id}`,
        },
        () => loadMessages()
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const typingProfileId = payload.payload?.profileId;

        if (typingProfileId && typingProfileId !== currentUserId) {
          setSomeoneTyping(true);
          setTimeout(() => setSomeoneTyping(false), 2500);
        }
      })
      .subscribe();

    setTypingChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUserId]);

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

  async function loadTicket() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, reference_number, profile_id, type, category, priority, title, description, status, archived, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Ticket load error full:", JSON.stringify(error, null, 2));
      setTicket(null);
      setLoading(false);
      return;
    }

    setTicket((data as Ticket) || null);
    setLoading(false);
  }

  async function loadMessages() {
    const { data: messageData, error: messageError } = await supabase
      .from("support_messages")
      .select(
        "id, ticket_id, profile_id, message, is_staff_reply, created_at, attachment_url, attachment_type, attachment_name"
      )
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error(
        "Messages load error full:",
        JSON.stringify(messageError, null, 2)
      );
      setMessages([]);
      return;
    }

    const profileIds = [
      ...new Set((messageData || []).map((message) => message.profile_id)),
    ].filter(Boolean);

    let profilesById = new Map<string, ProfileSummary>();

    if (profileIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", profileIds);

      if (profilesError) {
        console.error(
          "Message profiles load error full:",
          JSON.stringify(profilesError, null, 2)
        );
      }

      profilesById = new Map(
        ((profilesData || []) as ProfileSummary[]).map((profile) => [
          profile.id || "",
          profile,
        ])
      );
    }

    const combinedMessages = (messageData || []).map((message) => ({
      ...message,
      profiles: profilesById.get(message.profile_id) || null,
    }));

    setMessages(combinedMessages as Message[]);
  }

  async function broadcastTyping() {
    if (!currentUserId || !typingChannel) return;

    await typingChannel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        profileId: currentUserId,
        ticketId: id,
      },
    });
  }

  async function sendReply() {
    if (!ticket || (!reply.trim() && !attachment)) return;

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required.");
      setSending(false);
      return;
    }

    let uploadedAttachment = null;

    try {
      uploadedAttachment = await uploadAttachment(user.id);
    } catch (error) {
      console.error("Attachment upload error:", error);
      alert("Attachment upload failed.");
      setSending(false);
      return;
    }

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      profile_id: user.id,
      message: reply || "",
      is_staff_reply: false,
      attachment_url: uploadedAttachment?.url || null,
      attachment_type: uploadedAttachment?.type || null,
      attachment_name: uploadedAttachment?.name || null,
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
    setAttachment(null);
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
            This ticket may not exist, may have been removed, or you may not
            have access to it.
          </p>

          <Link
            href="/support"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118]"
          >
            Open a New Ticket
          </Link>
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
                const author = message.profiles;

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

                    {message.message && (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">
                        {message.message}
                      </p>
                    )}

                    <AttachmentPreview message={message} />
                  </article>
                );
              })}
            </div>

            {someoneTyping && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-white/45">
                <span>Someone is typing</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300" />
                </span>
              </div>
            )}

            {!ticket.archived && ticket.status !== "closed" && (
              <div className="mt-6 space-y-3">
                <textarea
                  value={reply}
                  onChange={(event) => {
                    setReply(event.target.value);
                    broadcastTyping();
                  }}
                  rows={4}
                  placeholder="Continue the conversation..."
                  className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 text-sm text-white outline-none placeholder:text-white/25"
                />

                {attachment && (
                  <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-purple-300/20 bg-purple-400/10 p-3">
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08]">
                    <FileUp size={16} />
                    Add Image / Video
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      onChange={(event) =>
                        handleAttachment(event.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={sendReply}
                    disabled={sending || (!reply.trim() && !attachment)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] disabled:opacity-50"
                  >
                    <Send size={17} />
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
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
        </aside>
      </section>
    </AppShell>
  );
}

function AttachmentPreview({ message }: { message: Message }) {
  if (!message.attachment_url) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20">
      {message.attachment_type === "image" && (
        <img
          src={message.attachment_url}
          alt={message.attachment_name || "Ticket attachment"}
          className="max-h-[420px] w-full object-contain"
        />
      )}

      {message.attachment_type === "video" && (
        <video
          src={message.attachment_url}
          controls
          className="max-h-[420px] w-full"
        />
      )}

      <div className="border-t border-white/10 px-4 py-3 text-xs font-bold text-white/45">
        {message.attachment_name || "Attachment"}
      </div>
    </div>
  );
}