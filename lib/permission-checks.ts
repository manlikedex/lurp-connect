import {
  getCurrentUserModeration,
  isBanActive,
  isTimeoutActive,
} from "@/lib/member-moderation";

export async function canCurrentUserPost() {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) return false;

  return moderation?.can_post !== false;
}

export async function canCurrentUserComment() {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) return false;

  return moderation?.can_comment !== false;
}

export async function canCurrentUserCreateTickets() {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) return false;

  return moderation?.can_create_tickets !== false;
}

export async function canCurrentUserApplyWhitelist() {
  const moderation = await getCurrentUserModeration();

  if (isBanActive(moderation) || isTimeoutActive(moderation)) return false;

  return moderation?.can_apply_whitelist !== false;
}