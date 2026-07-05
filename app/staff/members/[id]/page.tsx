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

export default function StaffMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [moderation, setModeration] = useState<Moderation | null>(null);
  const [serverLink, setServerLink] = useState<ServerLink | null>(null);

  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");
  const [timeoutReason, setTimeoutReason] = useState("");
  const [timeoutDays, setTimeoutDays] = useState("1");
  const [notes, setNotes] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadMember() {
    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, discord_id, created_at")
      .eq("id", id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile load error:", profileError);
      setLoading(false);
      return;
    }

    const { data: moderationData } = await supabase
      .from("member_moderation")
      .select("*")
      .eq("profile_id", id)
      .maybeSingle();

    const { data: serverLinkData } = await supabase
      .from("profile_server_links")
      .select(
        "id, cfx_identifier, license_identifier, discord_identifier, linked_at, relink_required"
      )
      .eq("profile_id", id)
      .maybeSingle();

    setProfile((profileData as Profile) || null);
    setModeration((moderationData as Moderation) || null);
    setServerLink((serverLinkData as ServerLink) || null);
    setNotes((moderationData as Moderation)?.notes || "");
    setLoading(false);
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
    const bannedUntil = banDays
      ? new Date(Date.now() + Number(banDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await saveModeration({
      banned: true,
      ban_reason: banReason || "Banned by staff.",
      banned_until: bannedUntil,
    });

    await createNotification({
      profileId: id,
      title: "Account restricted",
      message: banReason || "Your LURP Connect account has been banned by staff.",
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

    if (!days || days < 1) {
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
      message: `You are timed out until ${new Date(timeoutUntil).toLocaleString()}.`,
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

  async function forceRelink() {
    if (!serverLink) {
      alert("This member does not have a FiveM link yet.");
      return;
    }

    const { error } = await supabase
      .from("profile_server_links")
      .update({ relink_required: true })
      .eq("profile_id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await createNotification({
      profileId: id,
      title: "FiveM re-authentication required",
      message: "Staff require you to relink your FiveM account.",
    });

    await loadMember();
  }

  async function removeServerLink() {
    const confirmed = confirm("Remove this member's FiveM server link?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("profile_server_links")
      .delete()
      .eq("profile_id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await createNotification({
      profileId: id,
      title: "FiveM link removed",
      message: "Your FiveM account link has been removed by staff.",
    });

    await loadMember();
  }

  async function sendMemberNotification() {
    if (!notificationTitle.trim()) {
      alert("Enter a notification title.");
      return;
    }

    await createNotification({
      profileId: id,
      title: notificationTitle,
      message: notificationMessage || null,
    });

    setNotificationTitle("");
    setNotificationMessage("");
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
    moderation?.timeout_until &&
    new Date(moderation.timeout_until).getTime() > Date.now();

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
                    {profile.display_name || profile.username || "Unknown Member"}
                  </h1>
                  <p className="mt-2 truncate text-sm text-white/40">
                    {profile.id}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {banned && <StatusBadge variant="danger">Banned</StatusBadge>}
                {timedOut && <StatusBadge variant="warning">Timed Out</StatusBadge>}
                {!banned && !timedOut && (
                  <StatusBadge variant="success">Active</StatusBadge>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <InfoBox label="Username" value={profile.username || "Unknown"} />
              <InfoBox label="Discord ID" value={profile.discord_id || "Not saved"} />
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

            <div className="grid gap-3 md:grid-cols-2">
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
              <PremiumButton onClick={forceRelink} variant="secondary">
                Force Re-authentication
              </PremiumButton>

              <PremiumButton onClick={removeServerLink} variant="danger">
                Remove FiveM Link
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={ShieldCheck} title="Portal Permissions" />

            <div className="grid gap-3 md:grid-cols-2">
              <PermissionToggle
                label="Can Post"
                enabled={moderation?.can_post !== false}
                onClick={() =>
                  saveModeration({ can_post: moderation?.can_post === false })
                }
              />

              <PermissionToggle
                label="Can Comment"
                enabled={moderation?.can_comment !== false}
                onClick={() =>
                  saveModeration({
                    can_comment: moderation?.can_comment === false,
                  })
                }
              />

              <PermissionToggle
                label="Can Create Tickets"
                enabled={moderation?.can_create_tickets !== false}
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
            <SectionTitle icon={Ban} title="Ban Controls" />

            {banned && (
              <div className="mt-4 rounded-[1.3rem] border border-red-300/20 bg-red-400/10 p-4">
                <p className="text-sm font-black text-red-300">Currently banned</p>
                <p className="mt-2 text-sm text-red-100/70">
                  {moderation?.ban_reason || "No reason provided."}
                </p>
                {moderation?.banned_until && (
                  <p className="mt-2 text-xs text-red-100/50">
                    Until {new Date(moderation.banned_until).toLocaleString()}
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
              placeholder="Optional ban length in days"
            />

            <div className="mt-4 grid gap-2">
              <PremiumButton onClick={banMember} disabled={saving} variant="danger">
                <Ban size={16} />
                Ban Member
              </PremiumButton>

              <PremiumButton onClick={unbanMember} disabled={saving} variant="secondary">
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
                <p className="mt-2 text-xs text-amber-100/50">
                  Until {new Date(moderation!.timeout_until!).toLocaleString()}
                </p>
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
              placeholder="Timeout length in days"
            />

            <div className="mt-4 grid gap-2">
              <PremiumButton onClick={timeoutMember} disabled={saving} variant="secondary">
                Apply Timeout
              </PremiumButton>

              <PremiumButton onClick={removeTimeout} disabled={saving} variant="secondary">
                Remove Timeout
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionTitle icon={Bell} title="Send Notification" />

            <input
              value={notificationTitle}
              onChange={(event) => setNotificationTitle(event.target.value)}
              className="input-premium mt-4"
              placeholder="Notification title"
            />

            <textarea
              rows={4}
              value={notificationMessage}
              onChange={(event) => setNotificationMessage(event.target.value)}
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
            <SectionTitle icon={ShieldAlert} title="Moderation Summary" />

            <div className="mt-4 space-y-3 text-sm text-white/55">
              <p>Posting: {moderation?.can_post === false ? "Blocked" : "Allowed"}</p>
              <p>
                Commenting:{" "}
                {moderation?.can_comment === false ? "Blocked" : "Allowed"}
              </p>
              <p>
                Tickets:{" "}
                {moderation?.can_create_tickets === false
                  ? "Blocked"
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-white/75">{value}</p>
    </div>
  );
}

function PermissionToggle({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-[1.3rem] border p-4 text-left transition ${
        enabled
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-red-300/20 bg-red-400/10"
      }`}
    >
      <span className="text-sm font-black text-white/75">{label}</span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          enabled ? "bg-emerald-300 text-[#101017]" : "bg-red-300 text-[#101017]"
        }`}
      >
        {enabled ? "Allowed" : "Blocked"}
      </span>
    </button>
  );
}