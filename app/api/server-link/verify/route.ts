import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const secret = req.headers.get("x-lurp-secret");

  if (secret !== process.env.LURP_RESOURCE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    code,
    cfxIdentifier,
    licenseIdentifier,
    discordIdentifier,
  } = await req.json();

  if (!code || !licenseIdentifier) {
    return NextResponse.json(
      { success: false, error: "Missing code or license identifier" },
      { status: 400 }
    );
  }

  const { data: codeRow, error: codeError } = await supabaseAdmin
    .from("server_link_codes")
    .select("id, profile_id, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();

  if (codeError || !codeRow) {
    return NextResponse.json({ success: false, error: "Invalid code" });
  }

  if (codeRow.used_at) {
    return NextResponse.json({ success: false, error: "Code already used" });
  }

  if (new Date(codeRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: "Code expired" });
  }

  const { error: linkError } = await supabaseAdmin
    .from("profile_server_links")
    .upsert({
      profile_id: codeRow.profile_id,
      cfx_identifier: cfxIdentifier || null,
      license_identifier: licenseIdentifier,
      discord_identifier: discordIdentifier || null,
      linked_at: new Date().toISOString(),
      relink_required: false,
    });

  if (linkError) {
    return NextResponse.json({ success: false, error: linkError.message });
  }

  await supabaseAdmin
    .from("server_link_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", codeRow.id);

  return NextResponse.json({
    success: true,
    profileId: codeRow.profile_id,
  });
}