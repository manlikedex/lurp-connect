"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Eye,
  Globe,
  Lock,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Settings,
  Share2,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const futureSettings = [
  {
    title: "Profile Visibility",
    description: "Choose whether your profile is public, friends only or hidden.",
    icon: Eye,
    status: "Coming Soon",
  },
  {
    title: "Profile Editing",
    description: "Update display name, bio, banner, socials and profile theme.",
    icon: Pencil,
    status: "Coming Soon",
  },
  {
    title: "Social Links",
    description: "Connect TikTok, YouTube, Twitch, Instagram and Discord links.",
    icon: Share2,
    status: "Coming Soon",
  },
  {
    title: "Posting Preferences",
    description: "Control who can tag you, comment on your posts or see activity.",
    icon: MessageCircle,
    status: "Coming Soon",
  },
  {
    title: "Privacy Controls",
    description: "Manage online status, activity visibility and profile discovery.",
    icon: Lock,
    status: "Coming Soon",
  },
  {
    title: "Community Discovery",
    description: "Choose whether your profile appears in online members and leaderboards.",
    icon: Globe,
    status: "Coming Soon",
  },
];

export default function SettingsPage() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  async function checkNotificationStatus() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();

    setSubscribed(Boolean(subscription));
    setLoading(false);
  }

  async function enableNotifications() {
    setSaving(true);

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Your browser does not support push notifications.");
      setSaving(false);
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      alert("Notification public key is missing.");
      setSaving(false);
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") {
      setSaving(false);
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login with Discord first.");
      setSaving(false);
      return;
    }

    const existingSubscription =
      await registration.pushManager.getSubscription();

    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profileId: user.id,
        endpoint: subscription.endpoint,
        subscription,
      }),
    });

    if (!response.ok) {
      alert("Failed to save notification settings.");
      setSaving(false);
      return;
    }

    localStorage.setItem("lurp_notification_prompt_seen", "true");
    setSubscribed(true);
    setSaving(false);

    new Notification("LURP Connect Notifications Enabled", {
      body: "You will now receive LURP Connect alerts.",
      icon: "/logo.png",
    });
  }

  async function disableNotifications() {
    setSaving(true);

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      await subscription.unsubscribe();
    }

    setSubscribed(false);
    setSaving(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Settings"
        title="Manage your LURP Connect settings."
        description="Control notifications, social options, posting preferences, privacy and account features."
        icon={Settings}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            {subscribed ? <Bell size={26} /> : <BellOff size={26} />}
          </div>

          <h2 className="text-2xl font-black">Push Notifications</h2>

          <p className="mt-2 text-sm leading-6 text-white/55">
            Turn push notifications on or off for XP, level ups, rewards,
            comments, likes and community updates.
          </p>

          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm font-bold text-white/40">Current Status</p>
            <h3 className="mt-1 text-xl font-black">
              {loading
                ? "Checking..."
                : subscribed
                  ? "Notifications Enabled"
                  : "Notifications Disabled"}
            </h3>

            {permission === "denied" && (
              <p className="mt-2 text-sm text-red-300">
                Notifications are blocked in your browser. Enable them in your
                browser site settings first.
              </p>
            )}
          </div>

          <button
            disabled={saving || loading || permission === "denied"}
            onClick={subscribed ? disableNotifications : enableNotifications}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
              subscribed
                ? "border border-white/10 bg-white/[0.04] text-white/70"
                : "bg-white text-[#111118]"
            }`}
          >
            {subscribed ? <BellOff size={17} /> : <Bell size={17} />}
            {saving
              ? "Saving..."
              : subscribed
                ? "Turn Notifications Off"
                : "Turn Notifications On"}
          </button>
        </aside>

        <section className="grid gap-5">
          

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <UserRound size={26} />
            </div>

            <h2 className="text-2xl font-black">Account & Social Settings</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              These settings are planned for the next account update and will
              allow members to control their profile, social links, visibility,
              posting behaviour and privacy.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {futureSettings.map((setting) => (
                <article
                  key={setting.title}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
                    <setting.icon size={20} />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{setting.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/50">
                        {setting.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/45">
                    {setting.status}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}