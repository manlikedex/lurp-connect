import {
  CalendarDays,
  Camera,
  Clock,
  Crown,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OnlineMembers } from "@/components/community/online-members";


const stats = [
  { label: "Players Online", value: "247", icon: Radio },
  { label: "Community Posts", value: "128", icon: MessageCircle },
  { label: "Events Hosted", value: "73", icon: CalendarDays },
  { label: "Businesses", value: "41", icon: Store },
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
        <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#111118] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.18),transparent_32%)]" />
          <div className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70">
              <Crown size={14} className="text-purple-300" />
              Official LURP Community Platform
            </div>

            <h1 className="text-balance text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
              London Underworld Roleplay.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/58">
              A premium community hub for events, announcements, media,
              businesses, character showcases, rewards and everything happening
              inside LURP.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75 transition hover:bg-white/[0.08]">
                Connect to Server
              </button>
            </div>
          </div>
        </div>

        <OnlineMembers />

        
      </section>

      <div className="mt-5">
  <QuickActions />
</div>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-[1.7rem] border border-white/10 bg-[#111118] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
              <item.icon size={20} />
            </div>
            <p className="text-sm font-bold text-white/40">{item.label}</p>
            <h3 className="mt-2 text-3xl font-black">{item.value}</h3>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">Community Feed</h2>
            <button className="text-sm font-black text-purple-200">
              View all
            </button>
          </div>

          <div className="grid gap-3">
            {feed.map((item) => (
              <article
                key={item.title}
                className="group flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.055]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
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
        </div>


        <aside className="grid gap-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm text-white/40">Server Status</p>
                
                <h2 className="text-xl font-black text-emerald-300">Online</h2>
              </div>
            </div>
        
            <p className="text-sm text-white/55">
              247 / 300 players currently connected.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
              <Trophy size={20} />
            </div>
            <p className="text-sm text-white/40">Top Community Member</p>
            <h2 className="mt-2 text-2xl font-black">Dex</h2>
            <p className="mt-1 text-sm text-white/55">12,450 Community XP</p>
          </div>

          
        </aside>
      </section>

    

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">Featured Media</h2>
          <button className="text-sm font-black text-purple-200">
            Open gallery
          </button>
        </div>

        

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {gallery.map((item, index) => (
            <div
              key={item}
              className="group relative h-44 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.28),transparent_42%)] transition group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  0{index + 1}
                </p>
                <h3 className="font-black">{item}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      
    </AppShell>
  );
}