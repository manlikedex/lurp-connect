"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { Bell, Menu, User } from "lucide-react";
import { navItems } from "@/data/app-data";
import { supabase } from "@/lib/supabase";
import { DevelopmentBanner } from "./development-banner";
import { LatestUpdatesPopup } from "./latest-updates-popup";
import { ServerReleaseBanner } from "./server-release-banner";
import { NotificationPermissionPopup } from "./notification-permission-popup";

type Notification = {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { scrollY } = useScroll();

  const glowOne = useTransform(scrollY, [0, 700], [0, 120]);
  const glowTwo = useTransform(scrollY, [0, 700], [0, -90]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    async function loadNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Notification load error:", error);
        return;
      }

      setNotifications(data || []);
    }

    loadNotifications();
  }, []);

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((item) => !item.read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Mark notifications read error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );
  }

  async function handleBellClick() {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);

    if (nextState) {
      await markAllAsRead();
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080d] text-white">
      <motion.div
        style={{ y: glowOne }}
        className="pointer-events-none fixed -left-52 -top-52 h-[34rem] w-[34rem] rounded-full bg-purple-700/14 blur-[150px]"
      />

      <motion.div
        style={{ y: glowTwo }}
        className="pointer-events-none fixed -right-48 top-80 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/8 blur-[140px]"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1800px] grid-cols-1 lg:grid-cols-[290px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-[#0d0d14]/85 p-5 backdrop-blur-xl lg:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <Image
                  src="/logo.png"
                  alt="LURP Connect"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                  LURP
                </p>
                <h1 className="font-black">Connect</h1>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-white text-[#111018] shadow-lg shadow-white/5"
                        : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-8">
            <div className="mb-4 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                  <User size={19} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black">LURP Member</p>
                  <p className="truncate text-xs text-white/40">
                    Community Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                Developed By
              </p>

              <h3 className="mt-1 font-black text-purple-200">
                Dex Development
              </h3>

              <p className="mt-1 text-xs text-white/40">
                LURP Connect Platform
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 pb-28 pt-4 sm:px-6 lg:px-8 xl:px-10 lg:pb-8">
          <header className="sticky top-4 z-40 mb-5 rounded-3xl border border-white/10 bg-[#111018]/80 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] lg:hidden">
                  <Image
                    src="/logo.png"
                    alt="LURP Connect"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase tracking-[0.22em] text-white/35">
                    London Underworld Roleplay
                  </p>
                  <h2 className="truncate text-lg font-black sm:text-xl">
                    LURP Connect
                  </h2>
                </div>
              </div>

              <div className="relative flex items-center gap-2">
                <button
                  onClick={handleBellClick}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70 transition hover:bg-white/[0.08]"
                >
                  <Bell size={18} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-300 px-1.5 text-[10px] font-black text-[#111118]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-12 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111118] shadow-2xl shadow-black/50">
                    <div className="border-b border-white/10 p-4">
                      <p className="text-sm font-black">Notifications</p>
                      <p className="mt-1 text-xs text-white/40">
                        Latest updates from LURP Connect
                      </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 && (
                        <div className="p-5 text-sm text-white/50">
                          No notifications yet.
                        </div>
                      )}

                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="border-b border-white/5 p-4 last:border-b-0"
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                item.read ? "bg-white/20" : "bg-purple-300"
                              }`}
                            />

                            <div>
                              <p className="text-sm font-black">
                                {item.title}
                              </p>

                              {item.message && (
                                <p className="mt-1 text-sm leading-5 text-white/50">
                                  {item.message}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-white/30">
                                {new Date(item.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70 transition hover:bg-white/[0.08] lg:hidden">
                  <Menu size={18} />
                </button>
              </div>
            </div>
          </header>

          <ServerReleaseBanner />
<DevelopmentBanner />

          {children}
        </section>

        <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-[520px] -translate-x-1/2 overflow-hidden rounded-full border border-white/10 bg-[#111018]/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
  <div className="flex gap-1 overflow-x-auto scrollbar-hide">
    {navItems.map((item) => {
      const isActive =
        item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);

      return (
        <Link
          key={item.label}
          href={item.href}
          className={`flex min-w-[78px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] font-bold transition ${
            isActive
              ? "bg-white text-[#111018]"
              : "text-white/45 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          <item.icon size={16} />
          {item.label}
        </Link>
      );
    })}
  </div>
</nav>
      </div>
      <LatestUpdatesPopup />
      <NotificationPermissionPopup />
    </main>
  );
}