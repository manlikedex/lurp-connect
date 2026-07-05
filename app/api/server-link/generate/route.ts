import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const { profileId } = await req.json();

  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("server_link_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .is("used_at", null);

  const { data, error } = await supabaseAdmin
    .from("server_link_codes")
    .insert({
      profile_id: profileId,
      code,
      expires_at: expiresAt,
    })
    .select("code, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}