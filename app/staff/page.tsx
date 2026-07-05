"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  ShieldCheck,
  Ticket,
  Users,
  Gift,
  Megaphone,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { isCurrentUserStaff } from "@/lib/staff";

const staffTools = [
  {
  title: "Member Management",
  description: "Monitor members, ban accounts, apply timeouts and control posting permissions.",
  href: "/staff/members",
  icon: Users,
},
  {
    title: "Support Tickets",
    description: "Review, reply, update and archive support tickets.",
    href: "/staff/tickets",
    icon: Ticket,
  },
  {
  title: "Whitelist Applications",
  description: "Review, approve, deny, cooldown and blacklist whitelist applicants.",
  href: "/staff/whitelist",
  icon: ClipboardCheck,
},
{
  title: "Site CMS",
  description: "Edit homepage text, banners, links and public site content.",
  href: "/staff/cms",
  icon: Settings,
},
  {
    title: "Reward Checker",
    description: "Verify reward codes before issuing in-game rewards.",
    href: "/staff/reward-checker",
    icon: ClipboardCheck,
  },
  {
    title: "Player Moderation",
    description: "Review player reports and moderation actions.",
    href: "/staff/moderation",
    icon: AlertTriangle,
    soon: true,
  },
  {
    title: "User Management",
    description: "View profiles, roles, XP, warnings and staff notes.",
    href: "/staff/users",
    icon: Users,
    soon: true,
  },
  {
    title: "Rewards Management",
    description: "Manage reward catalogue, items, vehicles and claim rules.",
    href: "/staff/rewards",
    icon: Gift,
    soon: true,
  },
  {
    title: "Announcements",
    description: "Create staff announcements and push community updates.",
    href: "/staff/announcements",
    icon: Megaphone,
    soon: true,
  },
];

export default function StaffDashboardPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStaff() {
      const result = await isCurrentUserStaff();
      setAllowed(result);
    }

    checkStaff();
  }, []);

  if (allowed === null) {
    return (
      <AppShell>
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Checking staff access...</p>
        </section>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell>
        <section className="rounded-[2rem] border border-red-300/20 bg-red-400/10 p-8">
          <h1 className="text-3xl font-black text-red-200">Access denied</h1>
          <p className="mt-2 text-sm text-red-100/70">
            This area is only available to authorised LURP staff.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        badge="Staff Portal"
        title="LURP staff dashboard."
        description="Access support, moderation, reward tools and staff-only management features."
        icon={ShieldCheck}
      />

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staffTools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.soon ? "#" : tool.href}
            className={`rounded-[2rem] border border-white/10 bg-[#111118] p-5 transition ${
              tool.soon
                ? "cursor-not-allowed opacity-60"
                : "hover:-translate-y-1 hover:bg-white/[0.04]"
            }`}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <tool.icon size={22} />
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{tool.title}</h2>
              {tool.soon && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-white/45">
                  Soon
                </span>
              )}
            </div>

            <p className="mt-2 text-sm leading-6 text-white/50">
              {tool.description}
            </p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}