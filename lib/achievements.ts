import { supabase } from "@/lib/supabase";
import { awardXp } from "@/lib/xp";

export async function unlockAchievement(
  profileId: string,
  achievementTitle: string
) {
  const { data: achievement } = await supabase
    .from("achievements")
    .select("*")
    .eq("title", achievementTitle)
    .single();

  if (!achievement) return;

  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("profile_id", profileId)
    .eq("achievement_id", achievement.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("user_achievements").insert({
    profile_id: profileId,
    achievement_id: achievement.id,
  });

  await supabase.from("notifications").insert({
    profile_id: profileId,
    title: "Achievement Unlocked",
    message: `🏆 ${achievement.title}`,
    read: false,
  });

  if (achievement.xp_reward > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, level")
      .eq("id", profileId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          xp: (profile.xp || 0) + achievement.xp_reward,
        })
        .eq("id", profileId);
    }
  }
}