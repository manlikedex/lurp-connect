import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { webpush } from "@/lib/push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const {
    profileId,
    title,
    body,
    url,
  } = await req.json();

  const { data } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("profile_id", profileId);

  for (const sub of data || []) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title,
          body,
          url,
        })
      );
    } catch (error) {
      console.error(error);
    }
  }

  return NextResponse.json({
    success: true,
  });
}