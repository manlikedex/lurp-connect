import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.DISCORD_SUPPORT_WEBHOOK_URL;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lurp-connect.vercel.app";

  if (!webhookUrl) {
    console.error("DISCORD_SUPPORT_WEBHOOK_URL is missing.");

    return NextResponse.json(
      { error: "Discord webhook URL missing." },
      { status: 500 }
    );
  }

  const ticket = await req.json();

  const ticketUrl = `${siteUrl}/staff/tickets/${ticket.id}`;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "LURP Connect",
      avatar_url: `${siteUrl}/logo.png`,
      embeds: [
        {
          title: "🎫 New LURP Support Ticket",
          description:
            ticket.description?.slice(0, 3500) || "No description provided.",
          color: 10181046,
          fields: [
            {
              name: "Title",
              value: ticket.title || "No title",
              inline: false,
            },
            {
              name: "Type",
              value: ticket.type || "Unknown",
              inline: true,
            },
            {
              name: "Category",
              value: ticket.category || "Unknown",
              inline: true,
            },
            {
              name: "Priority",
              value: ticket.priority || "normal",
              inline: true,
            },
            {
              name: "Status",
              value: ticket.status || "open",
              inline: true,
            },
            {
              name: "Review Ticket",
              value: `[Open in LURP Connect](${ticketUrl})`,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("Discord webhook failed:", {
      status: response.status,
      body: responseText,
    });

    return NextResponse.json(
      {
        error: "Failed to send Discord webhook.",
        status: response.status,
        body: responseText,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    discordStatus: response.status,
  });
}