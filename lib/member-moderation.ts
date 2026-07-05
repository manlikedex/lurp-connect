import { supabase } from "@/lib/supabase";

export type MemberModeration = {
  banned: boolean | null;
  ban_reason: string | null;
  banned_until: string | null;
  portal_timeout: boolean | null;
  timeout_reason: string | null;
  timeout_until: string | null;
  can_post: boolean | null;
  can_comment: boolean | null;
  can_create_tickets: boolean | null;
  can_apply_whitelist: boolean | null;
};

export async function getCurrentUserModeration() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("member_moderation")
    .select(
      "banned, ban_reason, banned_until, portal_timeout, timeout_reason, timeout_until, can_post, can_comment, can_create_tickets, can_apply_whitelist"
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Moderation check error:", error);
    return null;
  }

  return data as MemberModeration | null;
}

export function isBanActive(moderation: MemberModeration | null) {
  if (!moderation?.banned) return false;
  if (!moderation.banned_until) return true;
  return new Date(moderation.banned_until).getTime() > Date.now();
}

export function isTimeoutActive(moderation: MemberModeration | null) {
  if (!moderation?.portal_timeout) return false;
  if (!moderation.timeout_until) return true;
  return new Date(moderation.timeout_until).getTime() > Date.now();
}