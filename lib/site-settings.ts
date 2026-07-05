import { supabase } from "@/lib/supabase";

export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data?.value) {
    return fallback;
  }

  return data.value as T;
}

export async function saveSiteSetting<T>(key: string, value: T) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabase.from("site_settings").upsert(
    {
      key,
      value,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "key",
    }
  );
}