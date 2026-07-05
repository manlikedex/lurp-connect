import { NextResponse } from "next/server";

function formatTime(seconds: number | null | undefined) {
  if (!seconds) return "Unknown";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

export async function POST(req: Request) {
  const webhookUrl = process.env.DISCORD_WHITELIST_WEBHOOK_URL;
  const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lurp-connect.vercel.app";

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Discord whitelist webhook URL missing." },
      { status: 500 }
    );
  }

  const application = await req.json();

  const reviewUrl = `${siteUrl}/staff/whitelist/${application.id}`;
  const reference =
    application.reference_number || application.id?.slice(0, 8) || "Unknown";

  const staffPing = staffRoleId ? `<@&${staffRoleId}>` : "";

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: staffPing
        ? `${staffPing} New whitelist application submitted.`
        : "New whitelist application submitted.",
      allowed_mentions: {
        roles: staffRoleId ? [staffRoleId] : [],
      },
      username: "LURP Connect",
      embeds: [
        {
          title: "📝 New Whitelist Application",
          color: 10181046,
          fields: [
            {
              name: "Reference",
              value: reference,
              inline: true,
            },
            {
              name: "Character Name",
              value: application.character_name || "Unknown",
              inline: true,
            },
            {
              name: "Applicant Age",
              value: application.age || "Unknown",
              inline: true,
            },
            {
              name: "Completion Time",
              value: formatTime(application.completion_time_seconds),
              inline: true,
            },
            {
              name: "Status",
              value: application.status || "pending",
              inline: true,
            },
            {
              name: "Review Application",
              value: `[Open in Staff Portal](${reviewUrl})`,
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
      {
        error: "Failed to send whitelist webhook.",
        status: response.status,
        body: text,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}