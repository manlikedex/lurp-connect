import {
  getCurrentUserModeration,
  isBanActive,
  isTimeoutActive,
} from "@/lib/member-moderation";
import { supabase } from "@/lib/supabase";

export type SupportRestriction = {
  id: string;
  type: "cooldown" | "blacklist";
  reason: string | null;
  expires_at: string | null;
};

export type TicketPermissionResult = {
  allowed: boolean;
  reason: string | null;
  expiresAt: string | null;
  restriction: SupportRestriction | null;
};

export async function canCurrentUserPost(): Promise<boolean> {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) {
    return false;
  }

  return moderation?.can_post !== false;
}

export async function canCurrentUserComment(): Promise<boolean> {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) {
    return false;
  }

  return moderation?.can_comment !== false;
}

export async function getCurrentSupportRestriction(): Promise<SupportRestriction | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("support_restrictions")
    .select("id, type, reason, expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Support restriction check error:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  if (!data) {
    return null;
  }

  const restriction = data as SupportRestriction;

  if (
    restriction.type === "cooldown" &&
    restriction.expires_at &&
    new Date(restriction.expires_at).getTime() <= Date.now()
  ) {
    const { error: deleteError } = await supabase
      .from("support_restrictions")
      .delete()
      .eq("id", restriction.id);

    if (deleteError) {
      console.error(
        "Expired support restriction cleanup error:",
        JSON.stringify(deleteError, null, 2)
      );
    }

    return null;
  }

  return restriction;
}

export async function getCurrentTicketPermission(): Promise<TicketPermissionResult> {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation)) {
    return {
      allowed: false,
      reason:
        moderation?.ban_reason ||
        "Your account is currently banned from LURP Connect.",
      expiresAt: moderation?.banned_until || null,
      restriction: null,
    };
  }

  if (isTimeoutActive(moderation)) {
    return {
      allowed: false,
      reason:
        moderation?.timeout_reason ||
        "Your account is currently under a portal timeout.",
      expiresAt: moderation?.timeout_until || null,
      restriction: null,
    };
  }

  if (moderation?.can_create_tickets === false) {
    return {
      allowed: false,
      reason: "Staff have disabled your ability to create support tickets.",
      expiresAt: null,
      restriction: null,
    };
  }

  const restriction = await getCurrentSupportRestriction();

  if (!restriction) {
    return {
      allowed: true,
      reason: null,
      expiresAt: null,
      restriction: null,
    };
  }

  if (restriction.type === "blacklist") {
    return {
      allowed: false,
      reason:
        restriction.reason ||
        "You have been blocked from creating support tickets.",
      expiresAt: null,
      restriction,
    };
  }

  return {
    allowed: false,
    reason:
      restriction.reason ||
      "You are currently on a support ticket cooldown.",
    expiresAt: restriction.expires_at,
    restriction,
  };
}

export async function canCurrentUserCreateTickets(): Promise<boolean> {
  const result = await getCurrentTicketPermission();
  return result.allowed;
}

export async function canCurrentUserApplyWhitelist(): Promise<boolean> {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) {
    return false;
  }

  return moderation?.can_apply_whitelist !== false;
}