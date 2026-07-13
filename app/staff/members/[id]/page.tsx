"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Bell,
  Clock,
  FileKey,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  created_at: string | null;
};

type Moderation = {
  id: string;
  profile_id: string;
  banned: boolean | null;
  ban_reason: string | null;
  banned_until: string | null;
  portal_timeout: boolean | null;
  timeout_reason: string | null;
  timeout_until: string | null;
  can_post: boolean | null;
  can_comment: boolean | null;
  can_create_tickets: boolean | null;
  can_apply_whitelist: boolean | null;
  notes: string | null;
};

type ServerLink = {
  id: string;
  cfx_identifier: string | null;
  license_identifier: string | null;
  discord_identifier: string | null;
  linked_at: string | null;
  relink_required: boolean | null;
};

type SupportRestriction = {
  id: string;
  type: "cooldown" | "blacklist";
  reason: string | null;
  expires_at: string | null;
};

export default function StaffMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [moderation, setModeration] = useState<Moderation | null>(null);
  const [serverLink, setServerLink] = useState<ServerLink | null>(null);
  const [ticketRestriction, setTicketRestriction] =
    useState<SupportRestriction | null>(null);

  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");
  const [timeoutReason, setTimeoutReason] = useState("");
  const [timeoutDays, setTimeoutDays] = useState("1");
  const [notes, setNotes] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [ticketCooldownDays, setTicketCooldownDays] = useState("7");
  const [ticketRestrictionReason, setTicketRestrictionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMember();

    const channel = supabase
      .channel(`staff-member-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "member_moderation",
          filter: `profile_id=eq.${id}`,
        },
        () => loadMember()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profile_server_links",
          filter: `profile_id=eq.${id}`,
        },
        () => loadMember()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_restrictions",
          filter: `profile_id=eq.${id}`,
        },
        () => loadTicketRestriction()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadMember() {
    setLoading(true);

    const [profileResult, moderationResult, serverLinkResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, username, display_name, avatar_url, discord_id, created_at"
          )
          .eq("id", id)
          .maybeSingle(),

        supabase
          .from("member_moderation")
          .select("*")
          .eq("profile_id", id)
          .maybeSingle(),

        supabase
          .from("profile_server_links")
          .select(
            "id, cfx_identifier, license_identifier, discord_identifier, linked_at, relink_required"
          )
          .eq("profile_id", id)
          .maybeSingle(),
      ]);

    if (profileResult.error) {
      console.error(
        "Profile load error:",
        JSON.stringify(profileResult.error, null, 2)
      );
    }

    if (moderationResult.error) {
      console.error(
        "Moderation load error:",
        JSON.stringify(moderationResult.error, null, 2)
      );
    }

    if (serverLinkResult.error) {
      console.error(
        "Server link load error:",
        JSON.stringify(serverLinkResult.error, null, 2)
      );
    }

    setProfile((profileResult.data as Profile) || null);
    setModeration((moderationResult.data as Moderation) || null);
    setServerLink((serverLinkResult.data as ServerLink) || null);
    setNotes((moderationResult.data as Moderation | null)?.notes || "");

    await loadTicketRestriction();
    setLoading(false);
  }

  async function loadTicketRestriction() {
    const { data, error } = await supabase
      .from("support_restrictions")
      .select("id, type, reason, expires_at")
      .eq("profile_id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "Ticket restriction load error:",
        JSON.stringify(error, null, 2)
      );
      setTicketRestriction(null);
      return;
    }

    if (
      data?.type === "cooldown" &&
      data.expires_at &&
      new Date(data.expires_at).getTime() <= Date.now()
    ) {
      setTicketRestriction(null);
      return;
    }

    setTicketRestriction((data as SupportRestriction) || null);
  }

  async function saveModeration(update: Partial<Moderation>) {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("member_moderation").upsert(
      {
        profile_id: id,
        banned: false,
        portal_timeout: false,
        can_post: true,
        can_comment: true,
        can_create_tickets: true,
        can_apply_whitelist: true,
        ...moderation,
        ...update,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await loadMember();
    setSaving(false);
  }

  async function banMember() {
    const days = Number(banDays);

    if (banDays && (!Number.isFinite(days) || days < 1)) {
      alert("Enter a valid ban length.");
      return;
    }

    const bannedUntil = banDays
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await saveModeration({
      banned: true,
      ban_reason: banReason || "Banned by staff.",
      banned_until: bannedUntil,
    });

    await createNotification({
      profileId: id,
      title: "Account restricted",
      message:
        banReason || "Your LURP Connect account has been banned by staff.",
    });

    setBanReason("");
    setBanDays("");
  }

  async function unbanMember() {
    await saveModeration({
      banned: false,
      ban_reason: null,
      banned_until: null,
    });

    await createNotification({
      profileId: id,
      title: "Account restriction removed",
      message: "Your LURP Connect account ban has been removed.",
    });
  }

  async function timeoutMember() {
    const days = Number(timeoutDays);

    if (!Number.isFinite(days) || days < 1) {
      alert("Enter a valid timeout length.");
      return;
    }

    const timeoutUntil = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toISOString();

    await saveModeration({
      portal_timeout: true,
      timeout_reason: timeoutReason || "Timed out by staff.",
      timeout_until: timeoutUntil,
    });

    await createNotification({
      profileId: id,
      title: "Portal timeout applied",
      message: `You are timed out until ${new Date(
        timeoutUntil
      ).toLocaleString()}.`,
    });

    setTimeoutReason("");
    setTimeoutDays("1");
  }

  async function removeTimeout() {
    await saveModeration({
      portal_timeout: false,
      timeout_reason: null,
      timeout_until: null,
    });

    await createNotification({
      profileId: id,
      title: "Portal timeout removed",
      message: "Your LURP Connect timeout has been removed.",
    });
  }

  async function applyTicketCooldown() {
    const days = Number(ticketCooldownDays);

    if (!Number.isFinite(days) || days < 1) {
      alert("Enter a valid cooldown length.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const expiresAt = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    );

    const { error } = await supabase.from("support_restrictions").upsert(
      {
        profile_id: id,
        type: "cooldown",
        reason:
          ticketRestrictionReason ||
          "Support ticket cooldown applied by staff.",
        expires_at: expiresAt.toISOString(),
        created_by: user?.id || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "profile_id",
      }
    );

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: id,
      title: "Support ticket cooldown applied",
      message: `You cannot create new support tickets until ${expiresAt.toLocaleString()}.`,
    });

    setTicketRestrictionReason("");
    await loadTicketRestriction();
    setSaving(false);
  }

  async function blacklistFromTickets() {
    const confirmed = confirm(
      "Permanently block this member from creating support tickets?"
    );

    if (!confirmed) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("support_restrictions").upsert(
      {
        profile_id: id,
        type: "blacklist",
        reason:
          ticketRestrictionReason ||
          "Blocked from creating support tickets.",
        expires_at: null,
        created_by: user?.id || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "profile_id",
      }
    );

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: id,
      title: "Support ticket access restricted",
      message: "You have been blocked from creating new support tickets.",
    });

    setTicketRestrictionReason("");
    await loadTicketRestriction();
    setSaving(false);
  }

  async function removeTicketRestriction() {
    if (!ticketRestriction) return;

    const confirmed = confirm("Remove this support ticket restriction?");
    if (!confirmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("support_restrictions")
      .delete()
      .eq("id", ticketRestriction.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: id,
      title: "Support restriction removed",
      message: "Staff have restored your ability to create support tickets.",
    });

    setTicketRestriction(null);
    setSaving(false);
  }

  async function forceRelink() {
    if (!serverLink) {
      alert("This member does not have a FiveM link yet.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profile_server_links")
      .update({ relink_required: true })
      .eq("profile_id", id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: id,
      title: "FiveM re-authentication required",
      message: "Staff require you to relink your FiveM account.",
    });

    await loadMember();
    setSaving(false);
  }

  async function removeServerLink() {
    const confirmed = confirm("Remove this member's FiveM server link?");
    if (!confirmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("profile_server_links")
      .delete()
      .eq("profile_id", id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: id,
      title: "FiveM link removed",
      message: "Your FiveM account link has been removed by staff.",
    });

    await loadMember();
    setSaving(false);
  }

  async function sendMemberNotification() {
    if (!notificationTitle.trim()) {
      alert("Enter a notification title.");
      return;
    }

    setSaving(true);

    await createNotification({
      profileId: id,
      title: notificationTitle.trim(),
      message: notificationMessage.trim(),
    });

    setNotificationTitle("");
    setNotificationMessage("");
    setSaving(false);
    alert("Notification sent.");
  }

  if (loading) {
    return (
      <AppShell>
        <PremiumCard>
          <p className="text-white/55">Loading member...</p>
        </PremiumCard>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <PremiumCard>
          <h1 className="text-3xl font-black">Member not found.</h1>
        </PremiumCard>
      </AppShell>
    );
  }

  const banned = Boolean(moderation?.banned);
  const timedOut =
    Boolean(moderation?.portal_timeout) &&
    Boolean(
      !moderation?.timeout_until ||
        new Date(moderation.timeout_until).getTime() > Date.now()
    );

  return (
    <AppShell>
      <Link
        href="/staff/members"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Members
      </Link>

      <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="space-y-5">
          <PremiumCard>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || "Member"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={28} />
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-4xl font-black tracking-[-0.055em]">
                    {profile.display_name ||
                      profile.username ||
                      "Unknown Member"}
                  </h1>
                  <p className="mt-2 truncate text-sm text-white/40">
                    {profile.id}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {banned && <StatusBadge variant="danger">Banned</StatusBadge>}
                {timedOut && (
                  <StatusBadge variant="warning">Timed Out</StatusBadge>
                )}
                {!banned && !timedOut && (
                  <StatusBadge variant="success">Active</StatusBadge>
                )}
                {ticketRestriction?.type === "cooldown" && (
                  <StatusBadge variant="warning">
                    Ticket Cooldown
                  </StatusBadge>
                )}
                {ticketRestriction?.type === "blacklist" && (
                  <StatusBadge variant="danger">
                    Ticket Blacklist
                  </StatusBadge>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <InfoBox label="Username" value={profile.username || "Unknown"} />
              <InfoBox
                label="Discord ID"
                value={profile.discord_id || "Not saved"}
              />
              <InfoBox
                label="Joined Portal"
                value={
                  profile.created_at
                    ? new Date(profile.created_at).toLocaleString()
                    : "Unknown"
                }
              />
              <InfoBox
                label="FiveM Link"
                value={serverLink ? "Connected" : "Not connected"}
              />
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={FileKey} title="FiveM Server Link" />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoBox
                label="CFX Identifier"
                value={serverLink?.cfx_identifier || "Not linked"}
              />
              <InfoBox
                label="License"
                value={serverLink?.license_identifier || "Not linked"}
              />
              <InfoBox
                label="Discord Identifier"
                value={serverLink?.discord_identifier || "Not linked"}
              />
              <InfoBox
                label="Linked At"
                value={
                  serverLink?.linked_at
                    ? new Date(serverLink.linked_at).toLocaleString()
                    : "Not linked"
                }
              />
              <InfoBox
                label="Relink Required"
                value={serverLink?.relink_required ? "Yes" : "No"}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <PremiumButton
                onClick={forceRelink}
                disabled={saving}
                variant="secondary"
              >
                Force Re-authentication
              </PremiumButton>

              <PremiumButton
                onClick={removeServerLink}
                disabled={saving}
                variant="danger"
              >
                Remove FiveM Link
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={ShieldCheck} title="Portal Permissions" />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <PermissionToggle
                label="Can Post"
                enabled={moderation?.can_post !== false}
                disabled={saving}
                onClick={() =>
                  saveModeration({
                    can_post: moderation?.can_post === false,
                  })
                }
              />

              <PermissionToggle
                label="Can Comment"
                enabled={moderation?.can_comment !== false}
                disabled={saving}
                onClick={() =>
                  saveModeration({
                    can_comment: moderation?.can_comment === false,
                  })
                }
              />

              <PermissionToggle
                label="Can Create Tickets"
                enabled={moderation?.can_create_tickets !== false}
                disabled={saving}
                onClick={() =>
                  saveModeration({
                    can_create_tickets:
                      moderation?.can_create_tickets === false,
                  })
                }
              />

              <PermissionToggle
                label="Can Apply Whitelist"
                enabled={moderation?.can_apply_whitelist !== false}
                disabled={saving}
                onClick={() =>
                  saveModeration({
                    can_apply_whitelist:
                      moderation?.can_apply_whitelist === false,
                  })
                }
              />
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={MessageCircle} title="Staff Notes" />

            <textarea
              rows={7}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="input-premium mt-4 resize-none"
              placeholder="Private staff notes about this member..."
            />

            <PremiumButton
              onClick={() => saveModeration({ notes })}
              disabled={saving}
              className="mt-4"
            >
              Save Notes
            </PremiumButton>
          </PremiumCard>
        </div>

        <aside className="space-y-5">
          <PremiumCard>
            <SectionTitle icon={Ticket} title="Ticket Restrictions" />

            {ticketRestriction ? (
              <div
                className={`mt-4 rounded-[1.3rem] border p-4 ${
                  ticketRestriction.type === "blacklist"
                    ? "border-red-300/20 bg-red-400/10"
                    : "border-amber-300/20 bg-amber-400/10"
                }`}
              >
                <p
                  className={`text-sm font-black capitalize ${
                    ticketRestriction.type === "blacklist"
                      ? "text-red-300"
                      : "text-amber-300"
                  }`}
                >
                  {ticketRestriction.type}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/65">
                  {ticketRestriction.reason || "No reason provided."}
                </p>

                {ticketRestriction.expires_at && (
                  <p className="mt-2 text-xs text-white/45">
                    Expires{" "}
                    {new Date(
                      ticketRestriction.expires_at
                    ).toLocaleString()}
                  </p>
                )}

                <PremiumButton
                  onClick={removeTicketRestriction}
                  disabled={saving}
                  variant="secondary"
                  className="mt-4 w-full"
                >
                  Remove Ticket Restriction
                </PremiumButton>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/45">
                No active ticket restriction.
              </p>
            )}

            <textarea
              rows={3}
              value={ticketRestrictionReason}
              onChange={(event) =>
                setTicketRestrictionReason(event.target.value)
              }
              className="input-premium mt-4 resize-none"
              placeholder="Ticket restriction reason..."
            />

            <div className="mt-3 grid gap-2">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  value={ticketCooldownDays}
                  onChange={(event) =>
                    setTicketCooldownDays(event.target.value)
                  }
                  className="input-premium"
                  inputMode="numeric"
                  placeholder="Days"
                />

                <PremiumButton
                  onClick={applyTicketCooldown}
                  disabled={saving}
                  variant="secondary"
                >
                  <Clock size={16} />
                  Cooldown
                </PremiumButton>
              </div>

              <PremiumButton
                onClick={blacklistFromTickets}
                disabled={saving}
                variant="danger"
                className="w-full"
              >
                <Ban size={16} />
                Blacklist From Tickets
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={Ban} title="Ban Controls" />

            {banned && (
              <div className="mt-4 rounded-[1.3rem] border border-red-300/20 bg-red-400/10 p-4">
                <p className="text-sm font-black text-red-300">
                  Currently banned
                </p>
                <p className="mt-2 text-sm text-red-100/70">
                  {moderation?.ban_reason || "No reason provided."}
                </p>
                {moderation?.banned_until && (
                  <p className="mt-2 text-xs text-red-100/50">
                    Until{" "}
                    {new Date(
                      moderation.banned_until
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <textarea
              rows={3}
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
              className="input-premium mt-4 resize-none"
              placeholder="Ban reason..."
            />

            <input
              value={banDays}
              onChange={(event) => setBanDays(event.target.value)}
              className="input-premium mt-3"
              inputMode="numeric"
              placeholder="Optional ban length in days"
            />

            <div className="mt-4 grid gap-2">
              <PremiumButton
                onClick={banMember}
                disabled={saving}
                variant="danger"
              >
                <Ban size={16} />
                Ban Member
              </PremiumButton>

              <PremiumButton
                onClick={unbanMember}
                disabled={saving}
                variant="secondary"
              >
                <XCircle size={16} />
                Unban Member
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={Clock} title="Timeout Controls" />

            {timedOut && (
              <div className="mt-4 rounded-[1.3rem] border border-amber-300/20 bg-amber-400/10 p-4">
                <p className="text-sm font-black text-amber-300">
                  Timeout active
                </p>
                <p className="mt-2 text-sm text-amber-100/70">
                  {moderation?.timeout_reason || "No reason provided."}
                </p>
                {moderation?.timeout_until && (
                  <p className="mt-2 text-xs text-amber-100/50">
                    Until{" "}
                    {new Date(
                      moderation.timeout_until
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <textarea
              rows={3}
              value={timeoutReason}
              onChange={(event) => setTimeoutReason(event.target.value)}
              className="input-premium mt-4 resize-none"
              placeholder="Timeout reason..."
            />

            <input
              value={timeoutDays}
              onChange={(event) => setTimeoutDays(event.target.value)}
              className="input-premium mt-3"
              inputMode="numeric"
              placeholder="Timeout length in days"
            />

            <div className="mt-4 grid gap-2">
              <PremiumButton
                onClick={timeoutMember}
                disabled={saving}
                variant="secondary"
              >
                Apply Timeout
              </PremiumButton>

              <PremiumButton
                onClick={removeTimeout}
                disabled={saving}
                variant="secondary"
              >
                Remove Timeout
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={Bell} title="Send Notification" />

            <input
              value={notificationTitle}
              onChange={(event) =>
                setNotificationTitle(event.target.value)
              }
              className="input-premium mt-4"
              placeholder="Notification title"
            />

            <textarea
              rows={4}
              value={notificationMessage}
              onChange={(event) =>
                setNotificationMessage(event.target.value)
              }
              className="input-premium mt-3 resize-none"
              placeholder="Notification message"
            />

            <PremiumButton
              onClick={sendMemberNotification}
              disabled={saving}
              className="mt-4 w-full"
            >
              Send Notification
            </PremiumButton>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle
              icon={ShieldAlert}
              title="Moderation Summary"
            />

            <div className="mt-4 space-y-3 text-sm text-white/55">
              <p>
                Posting:{" "}
                {moderation?.can_post === false ? "Blocked" : "Allowed"}
              </p>
              <p>
                Commenting:{" "}
                {moderation?.can_comment === false
                  ? "Blocked"
                  : "Allowed"}
              </p>
              <p>
                Tickets:{" "}
                {moderation?.can_create_tickets === false
                  ? "Blocked"
                  : ticketRestriction
                    ? ticketRestriction.type === "blacklist"
                      ? "Blacklisted"
                      : "Cooldown"
                    : "Allowed"}
              </p>
              <p>
                Whitelist:{" "}
                {moderation?.can_apply_whitelist === false
                  ? "Blocked"
                  : "Allowed"}
              </p>
            </div>
          </PremiumCard>
        </aside>
      </section>
    </AppShell>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof ShieldCheck;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-white/75">
        {value}
      </p>
    </div>
  );
}

function PermissionToggle({
  label,
  enabled,
  disabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between rounded-[1.3rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-red-300/20 bg-red-400/10"
      }`}
    >
      <span className="text-sm font-black text-white/75">{label}</span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          enabled
            ? "bg-emerald-300 text-[#101017]"
            : "bg-red-300 text-[#101017]"
        }`}
      >
        {enabled ? "Allowed" : "Blocked"}
      </span>
    </button>
  );
}
