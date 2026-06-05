"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const STORAGE_KEY = "lurp_notification_prompt_seen";

export function NotificationPermissionPopup() {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    setPermission(Notification.permission);

    if (!alreadySeen && Notification.permission === "default") {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);

    if (result === "granted") {
      new Notification("LURP Connect Notifications Enabled", {
        body: "You will now receive browser notification alerts when supported.",
      });
    }
  }

  function closePopup() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  if (!open || permission !== "default") return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#111118] p-5 shadow-2xl shadow-black/60">
        <button
          onClick={closePopup}
          className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/50 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
          <Bell size={26} />
        </div>

        <h2 className="mt-5 text-2xl font-black">Turn on notifications?</h2>

        <p className="mt-2 text-sm leading-6 text-white/55">
          Enable notifications so LURP Connect can alert you about XP, level
          ups, rewards, comments, likes and important community updates.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={enableNotifications}
            className="flex-1 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118]"
          >
            Enable Notifications
          </button>

          <button
            onClick={closePopup}
            className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/65"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}