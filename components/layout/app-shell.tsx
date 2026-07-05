"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Menu,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { navItems } from "@/data/app-data";
import { supabase } from "@/lib/supabase";
import { isCurrentUserStaff } from "@/lib/staff";
import { DevelopmentBanner } from "./development-banner";
import { LatestUpdatesPopup } from "./latest-updates-popup";
import { ServerReleaseBanner } from "./server-release-banner";
import { NotificationPermissionPopup } from "./notification-permission-popup";
import DiscordLogin from "@/components/auth/discord-login";

type Notification = {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
};


const navGroups = [
  {
    title: "Community",
    items: ["Home", "Community","Whitelist", "Rules", "Events", "Gallery"],
  },
  {
    title: "Gameplay",
    items: ["Businesses", "Characters", "Achievements", "Rewards"],
  },
  {
    title: "Account",
    items: ["Profile", "Server Link" , "Settings", "Support"],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const staffNavItem = {
    label: "Staff",
    href: "/staff",
    icon: ShieldCheck,
  };

  const visibleNavItems = isStaff ? [...navItems, staffNavItem] : navItems;

  const currentPage =
    visibleNavItems
      .filter((item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
      )
      .sort((a, b) => b.href.length - a.href.length)[0] || visibleNavItems[0];

  const groupedNav = useMemo(() => {
    return navGroups.map((group) => ({
      ...group,
      items: group.items
        .map((label) => visibleNavItems.find((item) => item.label === label))
        .filter(Boolean) as typeof visibleNavItems,
    }));
  }, [visibleNavItems]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(Boolean(user));
      setAuthChecked(true);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkStaff() {
      if (!isLoggedIn) {
        setIsStaff(false);
        return;
      }

      const result = await isCurrentUserStaff();
      setIsStaff(result);
    }

    checkStaff();
  }, [isLoggedIn]);

  async function loadNotifications() {
    if (!isLoggedIn) return;

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

  useEffect(() => {
    loadNotifications();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let channel: ReturnType<typeof supabase.channel>;

    async function subscribeNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `profile_id=eq.${user.id}`,
          },
          () => loadNotifications()
        )
        .subscribe();
    }

    subscribeNotifications();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    async function refreshPresence() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from("online_members").upsert({
        profile_id: user.id,
        last_seen: new Date().toISOString(),
      });
    }

    refreshPresence();

    const heartbeat = setInterval(refreshPresence, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshPresence();
    };

    window.addEventListener("focus", refreshPresence);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("focus", refreshPresence);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn]);

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

    if (nextState) await markAllAsRead();
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07070b] text-white">
        <div className="premium-panel rounded-[2rem] p-8 text-center">
          <p className="text-white/55">Checking login...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07070b] px-4 text-white">
        <section className="premium-panel w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <Image
              src="/logo.png"
              alt="LURP Connect"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-200">
            LURP Connect
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Sign in required
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/55">
            Please sign in with Discord to access the LURP Connect community
            platform.
          </p>

          <div className="mt-6">
            <DiscordLogin />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_34rem),radial-gradient(circle_at_100%_20%,rgba(236,72,153,0.08),transparent_30rem)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1920px] grid-cols-1 lg:grid-cols-[304px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-[#0b0b12]/88 p-4 backdrop-blur-2xl lg:flex">
          <div className="mb-6 rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-3">
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

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/60">
                  LURP
                </p>
                <h1 className="truncate text-lg font-black tracking-[-0.03em]">
                  Connect
                </h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
            {groupedNav.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                          isActive
                            ? "bg-white text-[#101017] shadow-lg shadow-white/5"
                            : "text-white/48 hover:bg-white/[0.055] hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            isActive
                              ? "bg-black/5"
                              : "bg-white/[0.035] text-purple-200/80 group-hover:bg-white/[0.06]"
                          }`}
                        >
                          <item.icon size={17} />
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {isStaff && (
              <div>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-red-200/45">
                  Staff
                </p>

                <Link
                  href="/staff"
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                    pathname.startsWith("/staff")
                      ? "bg-white text-[#101017] shadow-lg shadow-white/5"
                      : "text-white/48 hover:bg-white/[0.055] hover:text-white"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-300/10 text-red-200 ring-1 ring-red-300/10">
                    <ShieldCheck size={17} />
                  </span>
                  Staff Portal
                </Link>
              </div>
            )}
          </nav>

          <div className="mt-6 space-y-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                  <User size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black">LURP Member</p>
                  <p className="truncate text-xs text-white/35">
                    Community Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                Developed By
              </p>
              <h3 className="mt-1 text-sm font-black text-purple-200">
                Dex
              </h3>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 pb-28 pt-4 sm:px-6 lg:px-8 xl:px-10 lg:pb-8">
          <header className="sticky top-4 z-40 mb-5 rounded-[1.7rem] border border-white/10 bg-[#0f0f17]/82 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-2xl">
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
                  <div className="flex items-center gap-1 text-xs font-bold text-white/35">
                    <span>LURP Connect</span>
                    <ChevronRight size={13} />
                    <span className="text-purple-200/70">
                      {currentPage?.label || "Dashboard"}
                    </span>
                  </div>
                  <h2 className="truncate text-lg font-black tracking-[-0.03em] sm:text-xl">
                    {currentPage?.label || "Dashboard"}
                  </h2>
                </div>
              </div>

              <div className="hidden min-w-[280px] max-w-md flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/35 xl:flex">
                <Search size={17} />
                <span>Search LURP Connect...</span>
              </div>

              <div className="relative flex items-center gap-2">
                <div className="hidden sm:block">
                  <DiscordLogin />
                </div>

                <button
                  onClick={handleBellClick}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70 transition hover:bg-white/[0.08]"
                >
                  <Bell size={18} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-300 px-1.5 text-[10px] font-black text-[#111018]">
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

          <div className="space-y-5">{children}</div>
        </section>

        <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#111018]/92 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {visibleNavItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex min-w-[82px] flex-col items-center gap-1 rounded-[1.2rem] px-3 py-2 text-[11px] font-bold transition ${
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