import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const { profileId, endpoint, subscription } = await req.json();

  const { error } = await supabase.from("push_subscriptions").upsert({
    profile_id: profileId,
    endpoint,
    subscription,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}