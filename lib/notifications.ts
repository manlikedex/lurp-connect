import { supabase } from "@/lib/supabase";

export async function createNotification({
  profileId,
  title,
  message,
}: {
  profileId: string;
  title: string;
  message: string;
}) {
  if (!profileId) return;

  const { error } = await supabase.from("notifications").insert({
    profile_id: profileId,
    title,
    message,
    read: false,
  });

  if (error) {
    console.error("Notification error:", error);
  }
}