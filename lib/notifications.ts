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

  await supabase.from("notifications").insert({
    profile_id: profileId,
    title,
    message,
    read: false,
  });

  try {
    await fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profileId,
        title,
        body: message,
        url: "/notifications",
      }),
    });
  } catch (error) {
    console.error(error);
  }
}