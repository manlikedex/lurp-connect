"use client";

import { supabase } from "@/lib/supabase";

export default function DiscordLogin() {
  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={login}
      className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118]"
    >
      Login with Discord
    </button>
  );
}