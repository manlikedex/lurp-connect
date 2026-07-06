"use client";

import { useEffect, useState } from "react";
import { CalendarClock, FileText, Plus, Send } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/lib/supabase";
import { isCurrentUserStaff } from "@/lib/staff";

type DevelopmentLog = {
  id: string;
  title: string;
  content: string;
  tag: string | null;
  created_at: string;
};

export default function DevelopmentLogPage() {
  const [logs, setLogs] = useState<DevelopmentLog[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Update");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadLogs();
    checkStaff();

    const channel = supabase
      .channel("development-logs-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "development_logs",
        },
        () => loadLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function checkStaff() {
    const result = await isCurrentUserStaff();
    setIsStaff(result);
  }

  async function loadLogs() {
    const { data, error } = await supabase
      .from("development_logs")
      .select("id, title, content, tag, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Development logs load error:", error);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setLoading(false);
  }

  async function postLog() {
    if (!title.trim() || !content.trim()) {
      alert("Please add a title and update content.");
      return;
    }

    setPosting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("development_logs").insert({
      title,
      content,
      tag,
      created_by: user?.id || null,
    });

    if (error) {
      alert(error.message);
      setPosting(false);
      return;
    }

    setTitle("");
    setTag("Update");
    setContent("");
    await loadLogs();
    setPosting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Development Log"
        title="LURP Connect updates."
        description="View the latest updates, fixes and platform changes. Staff can post new development logs."
        icon={FileText}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {loading && (
            <PremiumCard>
              <p className="text-white/55">Loading development logs...</p>
            </PremiumCard>
          )}

          {!loading && logs.length === 0 && (
            <PremiumCard>
              <h2 className="text-2xl font-black">No updates yet.</h2>
              <p className="mt-2 text-sm text-white/45">
                Development logs will appear here once staff post them.
              </p>
            </PremiumCard>
          )}

          {logs.map((log) => (
            <PremiumCard key={log.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <StatusBadge variant="purple">
                    {log.tag || "Update"}
                  </StatusBadge>

                  <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                    {log.title}
                  </h2>

                  <p className="mt-2 flex items-center gap-2 text-sm text-white/35">
                    <CalendarClock size={15} />
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 whitespace-pre-wrap rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-white/65">
                {log.content}
              </div>
            </PremiumCard>
          ))}
        </div>

        <aside className="space-y-5">
          {isStaff && (
            <PremiumCard>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                <Plus size={22} />
              </div>

              <h2 className="text-xl font-black">Post Update</h2>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-premium mt-4"
                placeholder="Update title"
              />

              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="input-premium mt-3"
                placeholder="Tag"
              />

              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-premium mt-3 resize-none"
                placeholder="Write update notes..."
              />

              <PremiumButton
                onClick={postLog}
                disabled={posting}
                className="mt-4 w-full"
              >
                <Send size={16} />
                {posting ? "Posting..." : "Post Development Log"}
              </PremiumButton>
            </PremiumCard>
          )}

          <PremiumCard>
            <h2 className="text-xl font-black">About Development Logs</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Updates are timestamped automatically with the date and time they
              were posted. Everyone can read them, but only staff can post.
            </p>
          </PremiumCard>
        </aside>
      </section>
    </AppShell>
  );
}