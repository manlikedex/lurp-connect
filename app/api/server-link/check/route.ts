import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const secret = req.headers.get("x-lurp-secret");

  if (secret !== process.env.LURP_RESOURCE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { licenseIdentifier, cfxIdentifier } = await req.json();

  if (!licenseIdentifier && !cfxIdentifier) {
    return NextResponse.json({ linked: false });
  }

  const { data } = await supabaseAdmin
    .from("profile_server_links")
    .select("profile_id, relink_required")
    .or(
      `license_identifier.eq.${licenseIdentifier || "none"},cfx_identifier.eq.${cfxIdentifier || "none"}`
    )
    .maybeSingle();

  if (!data || data.relink_required) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    profileId: data.profile_id,
  });
}