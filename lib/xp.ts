import { supabase } from "@/lib/supabase";

const XP_REWARDS = {
  create_character: 100,
  create_post: 25,
  upload_media: 25,
  comment: 5,
  like_received: 1,

  character_approved: 50,
  event_attendance: 50,
  gallery_featured: 100,
  community_milestone: 500,
};

export type XpAction = keyof typeof XP_REWARDS;

type RewardCatalogueItem = {
  id: string;
  title: string;
  description: string | null;
  reward_type: string;
  required_level: number;
  item_name: string | null;
  vehicle_spawn_code: string | null;
  cash_amount: number | null;
};

function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 1000) + 1);
}

function createRewardCode() {
  return `LURP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function issueLevelRewards(profileId: string, oldLevel: number, newLevel: number) {
  const { data: rewards, error } = await supabase
    .from("reward_catalogue")
    .select(
      `
      id,
      title,
      description,
      reward_type,
      required_level,
      item_name,
      vehicle_spawn_code,
      cash_amount
    `
    )
    .eq("enabled", true)
    .gt("required_level", oldLevel)
    .lte("required_level", newLevel)
    .order("required_level", { ascending: true });

  if (error) {
    console.error("Reward catalogue error:", error);
    return;
  }

  const catalogueRewards = (rewards as RewardCatalogueItem[]) || [];

  for (const reward of catalogueRewards) {
    const rewardCode = createRewardCode();

    await supabase.from("reward_codes").insert({
      profile_id: profileId,
      code: rewardCode,
      reward_title: reward.title,
      reward_description:
        reward.description ||
        `Reward unlocked for reaching Level ${reward.required_level}.`,
      reward_type: reward.reward_type,
      xp_required: reward.required_level * 1000,
      status: "active",
    });

    await supabase.from("notifications").insert({
      profile_id: profileId,
      title: `${reward.title} unlocked!`,
      message: `You reached Level ${reward.required_level} and received reward code ${rewardCode}.`,
      read: false,
    });
  }
}

export async function awardXp(profileId: string, action: XpAction) {
  const xpAmount = XP_REWARDS[action];

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    console.error("XP profile error:", profileError);
    return;
  }

  const oldLevel = profile.level || 1;
  const newXp = (profile.xp || 0) + xpAmount;
  const newLevel = calculateLevel(newXp);

  await supabase.from("xp_logs").insert({
    profile_id: profileId,
    action,
    xp_amount: xpAmount,
  });

  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
    })
    .eq("id", profileId);

  if (newLevel > oldLevel) {
    await supabase.from("notifications").insert({
      profile_id: profileId,
      title: `Level ${newLevel} reached!`,
      message: `You levelled up from Level ${oldLevel} to Level ${newLevel}.`,
      read: false,
    });

    await issueLevelRewards(profileId, oldLevel, newLevel);
  }
}