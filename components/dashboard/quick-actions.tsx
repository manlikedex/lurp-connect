import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Camera,
  MessageSquarePlus,
  UserRound,
  Users,
} from "lucide-react";

const actions = [
  { title: "Create Character", href: "/characters/create", icon: UserRound },
  { title: "Create Business", href: "/businesses/create", icon: Building2 },
  { title: "Create Post", href: "/community/create", icon: MessageSquarePlus },
  { title: "Gallery", href: "/gallery", icon: Camera },
  { title: "Events", href: "/events", icon: CalendarDays },
  { title: "Community", href: "/community", icon: Users },
];

export function QuickActions() {
  return (
    <section className="premium-panel rounded-[2rem] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/60">
            Shortcuts
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">
            Quick Actions
          </h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="premium-card premium-card-hover group rounded-[1.5rem] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                <action.icon size={21} />
              </div>

              <ArrowUpRight
                size={16}
                className="text-white/25 transition group-hover:text-purple-200"
              />
            </div>

            <h3 className="mt-5 font-black tracking-[-0.02em]">
              {action.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}