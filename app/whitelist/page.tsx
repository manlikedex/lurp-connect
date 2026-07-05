"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ClipboardCheck,
  FileText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  reference_number: string | null;
  status: string | null;
  created_at: string;
  completion_time_seconds: number | null;
};

const initialForm = {
  age: "",
  date_of_birth: "",
  character_name: "",
  rules_read: "Yes",
  character_goals: "",
  character_backstory: "",
  vdm_answer: "",
  rdm_answer: "",
  failrp_answer: "",
  metagaming_answer: "",
  powergaming_answer: "",
  roleplay_aspirations: "",
  understands_no_guarantee: "Yes",
  understands_staff_rights: "Yes",
};

function formatCompletionTime(seconds: number | null) {
  if (!seconds) return "Unknown";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

export default function WhitelistPage() {
  const [form, setForm] = useState(initialForm);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [startedAt] = useState(Date.now());

  useEffect(() => {
    loadApplication();
  }, []);

  async function loadApplication() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("whitelist_applications")
      .select("id, reference_number, status, created_at, completion_time_seconds")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Whitelist application load error:", error);
    }

    setApplication((data as Application) || null);
    setLoading(false);
  }

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitApplication() {
    const missing = Object.entries(form).find(([, value]) => !value.trim());

    if (missing) {
      alert("Please complete every required question.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must sign in first.");
      setSubmitting(false);
      return;
    }

    const completionTimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

    const { data: createdApplication, error } = await supabase
      .from("whitelist_applications")
      .insert({
        profile_id: user.id,
        ...form,
        completion_time_seconds: completionTimeSeconds,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    if (createdApplication) {
      try {
        const webhookResponse = await fetch("/api/whitelist/discord-webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createdApplication),
        });

        if (!webhookResponse.ok) {
          const errorBody = await webhookResponse.json();
          console.error("Whitelist webhook failed:", errorBody);
        }
      } catch (webhookError) {
        console.error("Whitelist webhook error:", webhookError);
      }
    }

    setForm(initialForm);
    await loadApplication();
    setSubmitting(false);
    alert("Whitelist application submitted.");
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

  if (application) {
    return (
      <AppShell>
        <PageHeader
          badge="Whitelist Application"
          title="Your whitelist application."
          description="Track the status of your whitelist application here. Staff will update this once your application has been reviewed."
          icon={ClipboardCheck}
        />

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <PremiumCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/60">
                  Application Status
                </p>

                <h2 className="mt-2 text-3xl font-black capitalize tracking-[-0.04em]">
                  {application.status?.replaceAll("_", " ") || "pending"}
                </h2>

                <p className="mt-2 text-sm text-white/45">
                  Submitted {new Date(application.created_at).toLocaleString()}
                </p>
              </div>

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
                {application.status?.replaceAll("_", " ") || "pending"}
              </StatusBadge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                  Reference
                </p>
                <p className="mt-2 font-black text-purple-200">
                  {application.reference_number || application.id.slice(0, 8)}
                </p>
              </div>

              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                  Completion Time
                </p>
                <p className="mt-2 font-black text-white">
                  {formatCompletionTime(application.completion_time_seconds)}
                </p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">What happens next?</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Staff will review your answers. You may be approved, denied, or
              asked to make changes. Keep checking this page for updates.
            </p>
          </PremiumCard>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        badge="Whitelist Application"
        title="Apply for server whitelist."
        description="Complete this application carefully. Staff will review your answers before granting access."
        icon={ShieldCheck}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <PremiumCard>
            <SectionHeader
              icon={FileText}
              section="Section 1"
              title="Basic Information"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="How old are you?">
                <input
                  value={form.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  className="input-premium"
                  placeholder="Example: 18"
                />
              </Field>

              <Field label="What is your Date of Birth?">
                <input
                  value={form.date_of_birth}
                  onChange={(e) => updateField("date_of_birth", e.target.value)}
                  className="input-premium"
                  placeholder="DD/MM/YYYY"
                />
              </Field>
            </div>

            <Field label="What is your character's name?">
              <input
                value={form.character_name}
                onChange={(e) => updateField("character_name", e.target.value)}
                className="input-premium"
                placeholder="Full character name"
              />
            </Field>

            <Field label="Have you read our server rules?">
              <div className="select-wrap">
                <select
                  value={form.rules_read}
                  onChange={(e) => updateField("rules_read", e.target.value)}
                  className="select-premium"
                >
                  <option className="bg-[#111118]">Yes</option>
                  <option className="bg-[#111118]">No</option>
                </select>
              </div>
            </Field>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={BadgeCheck}
              section="Section 2"
              title="Character Development"
            />

            <Field label="What are your character's goals and how will you achieve them?">
              <textarea
                rows={5}
                value={form.character_goals}
                onChange={(e) => updateField("character_goals", e.target.value)}
                className="input-premium resize-none"
              />
            </Field>

            <Field label="Please describe your character's backstory.">
              <textarea
                rows={5}
                value={form.character_backstory}
                onChange={(e) =>
                  updateField("character_backstory", e.target.value)
                }
                className="input-premium resize-none"
              />
            </Field>

            <Field label="Describe your role-play aspirations. What direction do you want your character’s life to take?">
              <textarea
                rows={5}
                value={form.roleplay_aspirations}
                onChange={(e) =>
                  updateField("roleplay_aspirations", e.target.value)
                }
                className="input-premium resize-none"
              />
            </Field>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={ShieldCheck}
              section="Section 3"
              title="Rule Knowledge"
              amber
            />

            <Field label="Tell us what VDM is in your own words. Include an example.">
              <textarea
                rows={4}
                value={form.vdm_answer}
                onChange={(e) => updateField("vdm_answer", e.target.value)}
                className="input-premium resize-none"
              />
            </Field>

            <Field label="Tell us what RDM is in your own words. Include an example.">
              <textarea
                rows={4}
                value={form.rdm_answer}
                onChange={(e) => updateField("rdm_answer", e.target.value)}
                className="input-premium resize-none"
              />
            </Field>

            <Field label="What does FailRP mean? Give an example of a FailRP scenario.">
              <textarea
                rows={4}
                value={form.failrp_answer}
                onChange={(e) => updateField("failrp_answer", e.target.value)}
                className="input-premium resize-none"
              />
            </Field>

            <Field label="Define Metagaming in your own words.">
              <textarea
                rows={4}
                value={form.metagaming_answer}
                onChange={(e) =>
                  updateField("metagaming_answer", e.target.value)
                }
                className="input-premium resize-none"
              />
            </Field>

            <Field label="What is Powergaming? Provide an example.">
              <textarea
                rows={4}
                value={form.powergaming_answer}
                onChange={(e) =>
                  updateField("powergaming_answer", e.target.value)
                }
                className="input-premium resize-none"
              />
            </Field>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-2xl font-black tracking-[-0.035em]">
              Final Confirmation
            </h2>

            <div className="mt-5 grid gap-4">
              <Field label="Do you understand that completing this application does not guarantee that you will be whitelisted?">
                <div className="select-wrap">
                  <select
                    value={form.understands_no_guarantee}
                    onChange={(e) =>
                      updateField("understands_no_guarantee", e.target.value)
                    }
                    className="select-premium"
                  >
                    <option className="bg-[#111118]">Yes</option>
                    <option className="bg-[#111118]">No</option>
                  </select>
                </div>
              </Field>

              <Field label="Do you understand that server staff hold the right to revoke your access to the server and Discord if rules are broken?">
                <div className="select-wrap">
                  <select
                    value={form.understands_staff_rights}
                    onChange={(e) =>
                      updateField("understands_staff_rights", e.target.value)
                    }
                    className="select-premium"
                  >
                    <option className="bg-[#111118]">Yes</option>
                    <option className="bg-[#111118]">No</option>
                  </select>
                </div>
              </Field>
            </div>

            <PremiumButton
              onClick={submitApplication}
              disabled={submitting}
              className="mt-6 w-full"
            >
              <Send size={17} />
              {submitting ? "Submitting..." : "Submit Whitelist Application"}
            </PremiumButton>
          </PremiumCard>
        </div>

        <aside className="space-y-5">
          <PremiumCard>
            <h2 className="text-xl font-black">Before You Apply</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Take your time and answer properly. Short or low-effort answers may
              delay your application or lead to denial.
            </p>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">Application Statuses</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge variant="purple">Pending</StatusBadge>
              <StatusBadge variant="warning">Changes Requested</StatusBadge>
              <StatusBadge variant="success">Approved</StatusBadge>
              <StatusBadge variant="danger">Denied</StatusBadge>
            </div>
          </PremiumCard>
        </aside>
      </section>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-black text-white/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionHeader({
  icon: Icon,
  section,
  title,
  amber = false,
}: {
  icon: typeof FileText;
  section: string;
  title: string;
  amber?: boolean;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${
          amber
            ? "bg-amber-300/10 text-amber-200 ring-amber-300/15"
            : "bg-purple-300/10 text-purple-200 ring-purple-300/15"
        }`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-white/40">{section}</p>
        <h2 className="text-2xl font-black tracking-[-0.035em]">{title}</h2>
      </div>
    </div>
  );
}