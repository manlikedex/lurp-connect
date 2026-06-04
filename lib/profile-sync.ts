import { supabase } from "./supabase";

export async function syncProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    username:
      user.user_metadata?.preferred_username ||
      user.user_metadata?.full_name ||
      "Member",
    avatar_url: user.user_metadata?.avatar_url,
    discord_id: user.user_metadata?.provider_id,
  });
}