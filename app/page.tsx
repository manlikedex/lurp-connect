import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  Crown,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OnlineMembers } from "@/components/community/online-members";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { StatusBadge } from "@/components/ui/status-badge";

const stats = [
  { label: "Players Online", value: "247", detail: "300 slots", icon: Radio },
  { label: "Community Posts", value: "128", detail: "Live feed", icon: MessageCircle },
  { label: "Events Hosted", value: "73", detail: "Community led", icon: CalendarDays },
  { label: "Businesses", value: "41", detail: "Player owned", icon: Store },
];

const feed = [
  {
    tag: "Announcement",
    title: "LURP Connect is now live",
    text: "The official community platform for London Underworld Roleplay.",
    icon: Sparkles,
  },
  {
    tag: "Event",
    title: "Underground Car Meet",
    text: "Tonight at 8PM. Bring your best build and represent your crew.",
    icon: CalendarDays,
  },
  {
    tag: "Community",
    title: "Screenshot Competition",
    text: "Submit your best RP moment for a chance to be featured.",
    icon: Camera,
  },
];

const gallery = ["Street Scene", "Car Meet", "City Lights", "Underworld"];

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="premium-panel relative overflow-hidden rounded-[2.2rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgba(168,85,247,0.22),transparent_36%)]" />
          <div className="absolute -bottom-40 -right-28 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <StatusBadge variant="purple">Official Platform</StatusBadge>
              <StatusBadge variant="success">Live</StatusBadge>
            </div>

            <div className="flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                  <Crown size={26} />
                </div>

                <h1 className="text-balance text-5xl font-black tracking-[-0.065em] text-white sm:text-6xl xl:text-7xl">
                  Welcome to LURP Connect.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-8 text-white/56">
                  Your premium community hub for London Underworld Roleplay —
                  events, media, support, rewards, staff updates and everything
                  happening across the city.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <PremiumButton href="/community">
                  Open Community
                  <ArrowUpRight size={16} />
                </PremiumButton>

                <PremiumButton href="/rules" variant="secondary">
                  View Rules
                </PremiumButton>
              </div>
            </div>
          </div>
        </div>

        <OnlineMembers />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <PremiumCard key={item.label} hover>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                <item.icon size={21} />
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] font-black text-white/35">
                {item.detail}
              </span>
            </div>

            <p className="mt-6 text-sm font-bold text-white/38">
              {item.label}
            </p>
            <h3 className="mt-2 text-4xl font-black tracking-[-0.04em]">
              {item.value}
            </h3>
          </PremiumCard>
        ))}
      </section>

      <QuickActions />

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <PremiumCard>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/60">
                Latest Activity
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">
                Community Feed
              </h2>
            </div>

            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-sm font-black text-purple-200"
            >
              View all
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="grid gap-3">
            {feed.map((item) => (
              <article
                key={item.title}
                className="premium-card premium-card-hover flex gap-4 rounded-[1.5rem] p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.045] text-purple-200 ring-1 ring-white/10">
                  <item.icon size={19} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                    {item.tag}
                  </p>
                  <h3 className="mt-1 font-black">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </PremiumCard>

        <aside className="grid gap-5">
          <PremiumCard hover>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-sm text-white/40">Server Status</p>
                <h2 className="text-2xl font-black text-emerald-300">
                  Online
                </h2>
              </div>
            </div>

            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-white/55">
                247 / 300 players currently connected.
              </p>
            </div>
          </PremiumCard>

          <PremiumCard hover>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/15">
              <Trophy size={22} />
            </div>
            <p className="text-sm text-white/40">Top Community Member</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Dex
            </h2>
            <p className="mt-1 text-sm text-white/55">12,450 Community XP</p>
          </PremiumCard>
        </aside>
      </section>

      <PremiumCard>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/60">
              Media
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">
              Featured Media
            </h2>
          </div>

          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm font-black text-purple-200"
          >
            Open gallery
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {gallery.map((item, index) => (
            <div
              key={item}
              className="group relative h-48 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.3),transparent_44%)] transition duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  0{index + 1}
                </p>
                <h3 className="font-black">{item}</h3>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </AppShell>
  );
}