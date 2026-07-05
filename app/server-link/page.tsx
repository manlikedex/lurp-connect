"use client";

import { useEffect, useState } from "react";
import { KeyRound, LinkIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { supabase } from "@/lib/supabase";

type LinkCode = {
  code: string;
  expires_at: string;
};

export default function ServerLinkPage() {
  const [code, setCode] = useState<LinkCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    checkExistingLink();
  }, []);

  async function checkExistingLink() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profile_server_links")
      .select("id, relink_required")
      .eq("profile_id", user.id)
      .maybeSingle();

    setLinked(Boolean(data && !data.relink_required));
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
        description="Generate a one-time code, join the server, and enter the code before the character menu to link your CFX/FiveM account to LURP Connect."
        icon={LinkIcon}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <PremiumCard>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <KeyRound size={26} />
          </div>

          {linked ? (
            <>
              <h2 className="text-3xl font-black tracking-[-0.04em]">
                Your FiveM account is linked.
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                You should not need to enter a code again unless staff require
                you to relink your account.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black tracking-[-0.04em]">
                Generate your authentication code.
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                This code is temporary and can only be used once. Enter it in
                game when prompted before the character menu.
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
                </div>
              )}

              <PremiumButton
                onClick={generateCode}
                disabled={loading}
                className="mt-6"
              >
                <RefreshCw size={16} />
                {loading ? "Generating..." : "Generate Code"}
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
              <p>3. Enter the code when prompted.</p>
              <p>4. Your account will be linked automatically.</p>
            </div>
          </PremiumCard>
        </aside>
      </section>
    </AppShell>
  );
}