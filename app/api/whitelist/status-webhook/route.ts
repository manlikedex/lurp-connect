import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.DISCORD_WHITELIST_STATUS_WEBHOOK_URL;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lurp-connect.vercel.app";

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Whitelist status webhook URL missing." },
      { status: 500 }
    );
  }

  const body = await req.json();

  const mention = body.discordId ? `<@${body.discordId}>` : "Applicant";
  const status = body.status?.replaceAll("_", " ") || "updated";
  const applicationUrl = `${siteUrl}/whitelist`;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `${mention}`,
      embeds: [
        {
          title: "📋 Whitelist Application Update",
          description: `${mention}, your whitelist application status has been updated.`,
          color:
            body.status === "approved"
              ? 5763719
              : body.status === "denied"
                ? 15548997
                : body.status === "blacklisted"
                  ? 10038562
                  : 16776960,
          fields: [
            {
              name: "Status",
              value: status,
              inline: true,
            },
            {
              name: "Reference",
              value: body.reference || "Unknown",
              inline: true,
            },
            {
              name: "Message",
              value: body.message || "Please check LURP Connect for details.",
              inline: false,
            },
            {
              name: "View Status",
              value: `[Open LURP Connect](${applicationUrl})`,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to send status webhook.", body: text },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}