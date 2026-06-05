import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getWebPush } from "@/lib/push";

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase server environment variables." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { profileId, title, body, url } = await req.json();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("profile_id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const sub of data || []) {
    try {
      await getWebPush().sendNotification(
        sub.subscription,
        JSON.stringify({
          title,
          body,
          url,
        })
      );
    } catch (error) {
      console.error("Push send error:", error);
    }
  }

  return NextResponse.json({ success: true });
}