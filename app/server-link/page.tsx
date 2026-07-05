"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, LinkIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";

type LinkCode = {
  code: string;
  expires_at: string;
};

type ServerLink = {
  id: string;
  cfx_identifier: string | null;
  license_identifier: string | null;
  discord_identifier: string | null;
  linked_at: string | null;
  relink_required: boolean | null;
};

export default function ServerLinkPage() {
  const [code, setCode] = useState<LinkCode | null>(null);
  const [serverLink, setServerLink] = useState<ServerLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const linked = Boolean(serverLink && !serverLink.relink_required);

  useEffect(() => {
    checkExistingLink();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`server-link-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profile_server_links",
            filter: `profile_id=eq.${user.id}`,
          },
          () => {
            checkExistingLink();
            setCode(null);
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function checkExistingLink() {
    setChecking(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setChecking(false);
      return;
    }

    const { data, error } = await supabase
      .from("profile_server_links")
      .select(
        "id, cfx_identifier, license_identifier, discord_identifier, linked_at, relink_required"
      )
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Server link check error:", error);
      setChecking(false);
      return;
    }

    setServerLink((data as ServerLink) || null);
    setChecking(false);
  }

  async function generateCode() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/server-link/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profileId: user.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to generate code.");
      setLoading(false);
      return;
    }

    setCode(data);
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Server Link"
        title="Link your FiveM account."
        description="Generate a one-time code, join the server, and enter the code in-game to connect your FiveM account to LURP Connect."
        icon={LinkIcon}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <PremiumCard>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            {linked ? <CheckCircle2 size={26} /> : <KeyRound size={26} />}
          </div>

          {checking ? (
            <p className="text-white/55">Checking server link...</p>
          ) : linked ? (
            <>
              <div className="mb-4">
                <StatusBadge variant="success">Connected</StatusBadge>
              </div>

              <h2 className="text-3xl font-black tracking-[-0.04em]">
                Your FiveM account is linked.
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                You should not need to enter a code again unless staff require
                you to relink your account.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoBox
                  label="Linked"
                  value={
                    serverLink?.linked_at
                      ? new Date(serverLink.linked_at).toLocaleString()
                      : "Connected"
                  }
                />

                <InfoBox
                  label="Status"
                  value={serverLink?.relink_required ? "Relink Required" : "Active"}
                />

                <InfoBox
                  label="FiveM"
                  value={serverLink?.cfx_identifier || "Saved"}
                />

                <InfoBox
                  label="License"
                  value={serverLink?.license_identifier || "Saved"}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <StatusBadge variant="warning">Not Linked</StatusBadge>
              </div>

              <h2 className="text-3xl font-black tracking-[-0.04em]">
                Generate your authentication code.
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                This code is temporary and can only be used once. Enter it in
                game when prompted after loading into the server.
              </p>

              {code && (
                <div className="mt-6 rounded-[1.7rem] border border-purple-300/20 bg-purple-400/10 p-6 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                    Your Code
                  </p>

                  <h3 className="mt-3 text-6xl font-black tracking-[0.16em] text-white">
                    {code.code}
                  </h3>

                  <p className="mt-3 text-sm text-white/45">
                    Expires {new Date(code.expires_at).toLocaleString()}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-white/35">
                    This page will automatically update once the code is accepted
                    in-game.
                  </p>
                </div>
              )}

              <PremiumButton
                onClick={generateCode}
                disabled={loading}
                className="mt-6"
              >
                <RefreshCw size={16} />
                {loading ? "Generating..." : code ? "Generate New Code" : "Generate Code"}
              </PremiumButton>
            </>
          )}
        </PremiumCard>

        <aside className="space-y-5">
          <PremiumCard>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
              <ShieldCheck size={22} />
            </div>

            <h2 className="text-xl font-black">How it works</h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-white/55">
              <p>1. Generate your code in LURP Connect.</p>
              <p>2. Join the FiveM server.</p>
              <p>3. Enter the code when prompted in-game.</p>
              <p>4. Your account links automatically.</p>
            </div>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">One-time setup</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Once linked, you will not need to repeat this unless staff reset
              your server link.
            </p>
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
      <p className="mt-2 break-all text-sm font-black text-white/75">{value}</p>
    </div>
  );
}