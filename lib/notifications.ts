import { supabase } from "@/lib/supabase";

type CreateNotificationInput = {
  profileId: string;
  title: string;
  message?: string | null;
};

export async function createNotification({
  profileId,
  title,
  message = "",
}: CreateNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    profile_id: profileId,
    title,
    message: message || "",
    read: false,
  });

  if (error) {
    console.error("Create notification error:", error);
    return { error };
  }

  return { error: null };
}