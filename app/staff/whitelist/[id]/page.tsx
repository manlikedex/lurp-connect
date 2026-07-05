"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

type ProfileSummary = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  discord_id: string | null;
};

type WhitelistApplication = {
  id: string;
  reference_number: string | null;
  application_number: number | null;
  profile_id: string;
  age: string | null;
  date_of_birth: string | null;
  character_name: string | null;
  rules_read: string | null;
  character_goals: string | null;
  character_backstory: string | null;
  vdm_answer: string | null;
  rdm_answer: string | null;
  failrp_answer: string | null;
  metagaming_answer: string | null;
  powergaming_answer: string | null;
  roleplay_aspirations: string | null;
  understands_no_guarantee: string | null;
  understands_staff_rights: string | null;
  completion_time_seconds: number | null;
  status: string | null;
  staff_notes: string | null;
  decision_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

type Restriction = {
  id: string;
  type: string;
  reason: string | null;
  expires_at: string | null;
};

const statusOptions = ["pending", "changes_requested", "approved", "denied"];

function singleProfile(profile: ProfileSummary | ProfileSummary[] | null) {
  return Array.isArray(profile) ? profile[0] || null : profile;
}

function formatTime(seconds: number | null) {
  if (!seconds) return "Unknown";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function statusVariant(status: string | null) {
  if (status === "approved") return "success";
  if (status === "denied") return "danger";
  if (status === "changes_requested") return "warning";
  return "purple";
}

export default function StaffWhitelistReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [application, setApplication] =
    useState<WhitelistApplication | null>(null);
  const [restriction, setRestriction] = useState<Restriction | null>(null);
  const [staffNotes, setStaffNotes] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [cooldownDays, setCooldownDays] = useState("7");
  const [restrictionReason, setRestrictionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApplication();

    const channel = supabase
      .channel(`staff-whitelist-review-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whitelist_applications",
          filter: `id=eq.${id}`,
        },
        () => loadApplication()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whitelist_restrictions",
        },
        () => loadRestriction()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadApplication() {
    const { data, error } = await supabase
      .from("whitelist_applications")
      .select(
        `
        id,
        reference_number,
        application_number,
        profile_id,
        age,
        date_of_birth,
        character_name,
        rules_read,
        character_goals,
        character_backstory,
        vdm_answer,
        rdm_answer,
        failrp_answer,
        metagaming_answer,
        powergaming_answer,
        roleplay_aspirations,
        understands_no_guarantee,
        understands_staff_rights,
        completion_time_seconds,
        status,
        staff_notes,
        decision_reason,
        reviewed_at,
        created_at,
        profiles:profile_id (
          username,
          display_name,
          avatar_url,
          discord_id
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Whitelist review load error:", error);
      setLoading(false);
      return;
    }

    const loaded = (data as WhitelistApplication) || null;
    setApplication(loaded);
    setStaffNotes(loaded?.staff_notes || "");
    setDecisionReason(loaded?.decision_reason || "");
    setLoading(false);

    if (loaded?.profile_id) {
      await loadRestrictionForProfile(loaded.profile_id);
    }
  }

  async function loadRestriction() {
    if (!application?.profile_id) return;
    await loadRestrictionForProfile(application.profile_id);
  }

  async function loadRestrictionForProfile(profileId: string) {
    const { data, error } = await supabase
      .from("whitelist_restrictions")
      .select("id, type, reason, expires_at")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      console.error("Restriction load error:", error);
      setRestriction(null);
      return;
    }

    setRestriction((data as Restriction) || null);
  }

  async function sendWhitelistStatusWebhook({
    status,
    message,
  }: {
    status: string;
    message: string;
  }) {
    if (!application) return;

    const profile = singleProfile(application.profiles);

    try {
      await fetch("/api/whitelist/status-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          message,
          reference:
            application.reference_number ||
            `#${application.application_number}` ||
            application.id.slice(0, 8),
          discordId: profile?.discord_id || null,
        }),
      });
    } catch (error) {
      console.error("Whitelist status webhook error:", error);
    }
  }

  async function updateApplicationStatus(status: string) {
    if (!application) return;

    if (
      (status === "denied" || status === "changes_requested") &&
      !decisionReason.trim()
    ) {
      alert("Please add a decision reason for the applicant.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const readableStatus = status.replaceAll("_", " ");

    const { error } = await supabase
      .from("whitelist_applications")
      .update({
        status,
        staff_notes: staffNotes,
        decision_reason: decisionReason || null,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: application.profile_id,
      title: "Whitelist application updated",
      message:
        decisionReason.trim() ||
        `Your whitelist application is now ${readableStatus}.`,
    });

    await sendWhitelistStatusWebhook({
      status,
      message:
        decisionReason.trim() ||
        `Your whitelist application is now ${readableStatus}.`,
    });

    await loadApplication();
    setSaving(false);
  }

  async function applyCooldown() {
    if (!application) return;

    const days = Number(cooldownDays);
    if (!days || days < 1) {
      alert("Enter a valid cooldown length.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const reason =
      restrictionReason ||
      decisionReason ||
      "Whitelist cooldown applied by staff.";

    const { error } = await supabase.from("whitelist_restrictions").upsert({
      profile_id: application.profile_id,
      type: "cooldown",
      reason,
      expires_at: expiresAt.toISOString(),
      created_by: user?.id || null,
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: application.profile_id,
      title: "Whitelist cooldown applied",
      message: `You cannot reapply until ${expiresAt.toLocaleString()}. Reason: ${reason}`,
    });

    await sendWhitelistStatusWebhook({
      status: "cooldown",
      message: `You have been placed on a whitelist cooldown until ${expiresAt.toLocaleString()}. Reason: ${reason}`,
    });

    setRestrictionReason("");
    await loadRestrictionForProfile(application.profile_id);
    setSaving(false);
  }

  async function denyWithCooldown(days: number) {
    setCooldownDays(String(days));
    await updateApplicationStatus("denied");
    setTimeout(() => {
      applyCooldown();
    }, 300);
  }

  async function applyBlacklist() {
    if (!application) return;

    const confirmed = confirm(
      "Blacklist this user from whitelist applications?"
    );

    if (!confirmed) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const reason =
      restrictionReason ||
      decisionReason ||
      "Blacklisted from whitelist applications.";

    const { error } = await supabase.from("whitelist_restrictions").upsert({
      profile_id: application.profile_id,
      type: "blacklist",
      reason,
      expires_at: null,
      created_by: user?.id || null,
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: application.profile_id,
      title: "Whitelist access restricted",
      message: reason,
    });

    await sendWhitelistStatusWebhook({
      status: "blacklisted",
      message: reason,
    });

    setRestrictionReason("");
    await loadRestrictionForProfile(application.profile_id);
    setSaving(false);
  }

  async function removeRestriction() {
    if (!restriction || !application) return;

    const confirmed = confirm("Remove this whitelist restriction?");
    if (!confirmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("whitelist_restrictions")
      .delete()
      .eq("id", restriction.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await createNotification({
      profileId: application.profile_id,
      title: "Whitelist restriction removed",
      message: "Staff have removed your whitelist application restriction.",
    });

    await sendWhitelistStatusWebhook({
      status: "restriction_removed",
      message:
        "Your whitelist application restriction has been removed by staff.",
    });

    setRestriction(null);
    setSaving(false);
  }

  if (loading) {
    return (
      <AppShell>
        <PremiumCard>
          <p className="text-white/55">Loading whitelist application...</p>
        </PremiumCard>
      </AppShell>
    );
  }

  if (!application) {
    return (
      <AppShell>
        <PremiumCard>
          <h1 className="text-3xl font-black">Application not found.</h1>
        </PremiumCard>
      </AppShell>
    );
  }

  const owner = singleProfile(application.profiles);

  return (
    <AppShell>
      <Link
        href="/staff/whitelist"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Whitelist
      </Link>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <PremiumCard>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                  {application.reference_number ||
                    `#${application.application_number}` ||
                    application.id.slice(0, 8)}
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">
                  {application.character_name || "Unnamed Character"}
                </h1>

                <p className="mt-3 flex items-center gap-2 text-sm text-white/40">
                  <Clock size={15} />
                  Submitted {new Date(application.created_at).toLocaleString()}
                </p>
              </div>

              <StatusBadge variant={statusVariant(application.status)}>
                {application.status?.replaceAll("_", " ") || "pending"}
              </StatusBadge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoBox label="Age" value={application.age || "Unknown"} />
              <InfoBox
                label="DOB"
                value={application.date_of_birth || "Unknown"}
              />
              <InfoBox
                label="Completion"
                value={formatTime(application.completion_time_seconds)}
              />
            </div>
          </PremiumCard>

          <AnswerSection
            title="Basic Information"
            answers={[
              ["Rules Read", application.rules_read],
              ["No Guarantee", application.understands_no_guarantee],
              ["Staff Rights", application.understands_staff_rights],
            ]}
          />

          <AnswerSection
            title="Character Development"
            answers={[
              ["Character Goals", application.character_goals],
              ["Character Backstory", application.character_backstory],
              ["Roleplay Aspirations", application.roleplay_aspirations],
            ]}
          />

          <AnswerSection
            title="Rule Knowledge"
            answers={[
              ["VDM", application.vdm_answer],
              ["RDM", application.rdm_answer],
              ["FailRP", application.failrp_answer],
              ["Metagaming", application.metagaming_answer],
              ["Powergaming", application.powergaming_answer],
            ]}
          />
        </div>

        <aside className="space-y-5">
          <PremiumCard>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
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

              <div>
                <h2 className="font-black">
                  {owner?.display_name || owner?.username || "Unknown Member"}
                </h2>
                <p className="text-xs text-white/35">Applicant</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-white/50">
              <p>Profile ID: {application.profile_id}</p>
              <p>Discord ID: {owner?.discord_id || "Not saved"}</p>
              <p>Reference: {application.reference_number}</p>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <ShieldCheck size={22} />
            </div>

            <h2 className="text-xl font-black">Review Decision</h2>

            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={5}
              placeholder="Reason shown to applicant..."
              className="input-premium mt-4 resize-none"
            />

            <textarea
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              rows={4}
              placeholder="Internal staff notes..."
              className="input-premium mt-3 resize-none"
            />

            <div className="mt-4 grid gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => updateApplicationStatus(status)}
                  disabled={saving}
                  className={`rounded-full px-4 py-3 text-sm font-black capitalize transition disabled:opacity-50 ${
                    application.status === status
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
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300 ring-1 ring-red-300/15">
              <ShieldAlert size={22} />
            </div>

            <h2 className="text-xl font-black">Restrictions</h2>

            {restriction ? (
              <div className="mt-4 rounded-[1.3rem] border border-red-300/20 bg-red-400/10 p-4">
                <p className="text-sm font-black capitalize text-red-300">
                  {restriction.type}
                </p>
                <p className="mt-2 text-sm leading-6 text-red-100/70">
                  {restriction.reason || "No reason provided."}
                </p>
                {restriction.expires_at && (
                  <p className="mt-2 text-xs text-red-100/55">
                    Expires {new Date(restriction.expires_at).toLocaleString()}
                  </p>
                )}

                <PremiumButton
                  onClick={removeRestriction}
                  disabled={saving}
                  variant="secondary"
                  className="mt-4 w-full"
                >
                  Remove Restriction
                </PremiumButton>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/45">
                No active whitelist restriction.
              </p>
            )}

            <textarea
              value={restrictionReason}
              onChange={(e) => setRestrictionReason(e.target.value)}
              rows={3}
              placeholder="Restriction reason..."
              className="input-premium mt-4 resize-none"
            />

            <div className="mt-3 grid gap-2">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  value={cooldownDays}
                  onChange={(e) => setCooldownDays(e.target.value)}
                  className="input-premium"
                  placeholder="Days"
                />

                <PremiumButton
                  onClick={applyCooldown}
                  disabled={saving}
                  variant="secondary"
                >
                  <Clock size={16} />
                  Cooldown
                </PremiumButton>
              </div>

              <PremiumButton
                onClick={applyBlacklist}
                disabled={saving}
                variant="danger"
                className="w-full"
              >
                <Ban size={16} />
                Blacklist Applicant
              </PremiumButton>
            </div>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">Quick Actions</h2>

            <div className="mt-4 grid gap-2">
              <PremiumButton
                onClick={() => updateApplicationStatus("approved")}
                disabled={saving}
                className="w-full"
              >
                <CheckCircle2 size={16} />
                Approve
              </PremiumButton>

              <PremiumButton
                onClick={() => updateApplicationStatus("denied")}
                disabled={saving}
                variant="danger"
                className="w-full"
              >
                <XCircle size={16} />
                Deny
              </PremiumButton>

              <PremiumButton
                onClick={() => denyWithCooldown(3)}
                disabled={saving}
                variant="danger"
                className="w-full"
              >
                Deny + 3 Day Cooldown
              </PremiumButton>

              <PremiumButton
                onClick={() => denyWithCooldown(7)}
                disabled={saving}
                variant="danger"
                className="w-full"
              >
                Deny + 7 Day Cooldown
              </PremiumButton>
            </div>
          </PremiumCard>
        </aside>
      </section>
    </AppShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}

function AnswerSection({
  title,
  answers,
}: {
  title: string;
  answers: [string, string | null][];
}) {
  return (
    <PremiumCard>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
          <FileText size={20} />
        </div>
        <h2 className="text-2xl font-black tracking-[-0.035em]">{title}</h2>
      </div>

      <div className="space-y-4">
        {answers.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/60">
              {label}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/65">
              {value || "No answer provided."}
            </p>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}