import { supabase } from "@/lib/supabase";

export async function isCurrentUserStaff() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("staff_members")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Staff check error:", error);
    return false;
  }

  return Boolean(data);
}