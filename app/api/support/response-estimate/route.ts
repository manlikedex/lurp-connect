import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

type StaffRecord = {
  profile_id: string;
  role: string;
  active: boolean | null;
};

function getLondonHour() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value;

  return Number(hour || 0);
}

function formatEstimate(minMinutes: number, maxMinutes: number) {
  if (maxMinutes < 60) {
    return `${minMinutes}–${maxMinutes} minutes`;
  }

  const minHours = Math.max(1, Math.round(minMinutes / 60));
  const maxHours = Math.max(minHours, Math.ceil(maxMinutes / 60));

  if (minHours === maxHours) {
    return `Around ${minHours} hour${minHours === 1 ? "" : "s"}`;
  }

  return `${minHours}–${maxHours} hours`;
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const priority = requestUrl.searchParams.get("priority") || "normal";

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const [
      staffResult,
      presenceResult,
      ticketsResult,
      recentRepliesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("staff_members")
        .select("profile_id, role, active"),

      supabaseAdmin
        .from("online_members")
        .select("profile_id, last_seen")
        .gte("last_seen", fiveMinutesAgo),

      supabaseAdmin
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("archived", false)
        .in("status", ["open", "reviewing"]),

      supabaseAdmin
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_staff_reply", true)
        .gte("created_at", twoHoursAgo),
    ]);

    if (staffResult.error) throw staffResult.error;
    if (presenceResult.error) throw presenceResult.error;
    if (ticketsResult.error) throw ticketsResult.error;
    if (recentRepliesResult.error) throw recentRepliesResult.error;

    const ticketStaff = ((staffResult.data || []) as StaffRecord[]).filter(
      (member) =>
        member.active !== false &&
        ["support", "staff", "moderator", "admin", "god", "owner"].includes(
          member.role
        )
    );

    const recentlyOnlineIds = new Set(
      (presenceResult.data || []).map((entry) => entry.profile_id)
    );

    const activeStaff = ticketStaff.filter((member) =>
      recentlyOnlineIds.has(member.profile_id)
    ).length;

    const openTickets = ticketsResult.count || 0;
    const recentStaffReplies = recentRepliesResult.count || 0;
    const londonHour = getLondonHour();

    const daytime = londonHour >= 8 && londonHour < 23;
    const overnight = londonHour >= 1 && londonHour < 8;

    let estimatedMinutes: number;

    if (activeStaff > 0) {
      const ticketsPerStaff = openTickets / activeStaff;

      estimatedMinutes = 10 + ticketsPerStaff * 14;

      // Active ticket replies indicate that staff are currently processing
      // the queue, so reduce the estimate slightly.
      if (recentStaffReplies >= activeStaff * 2) {
        estimatedMinutes *= 0.72;
      } else if (recentStaffReplies > 0) {
        estimatedMinutes *= 0.88;
      }
    } else {
      // No recently active ticket staff.
      estimatedMinutes = daytime ? 90 + openTickets * 8 : 180 + openTickets * 12;
    }

    if (!daytime) {
      estimatedMinutes *= overnight ? 1.8 : 1.35;
    }

    if (priority === "urgent") {
      estimatedMinutes *= 0.6;
    } else if (priority === "high") {
      estimatedMinutes *= 0.8;
    } else if (priority === "low") {
      estimatedMinutes *= 1.25;
    }

    estimatedMinutes = Math.max(10, Math.min(estimatedMinutes, 12 * 60));

    const minMinutes = Math.max(5, Math.round(estimatedMinutes * 0.75));
    const maxMinutes = Math.max(
      minMinutes + 5,
      Math.round(estimatedMinutes * 1.35)
    );

    let status: "fast" | "normal" | "busy" | "offline";

    if (activeStaff === 0) {
      status = "offline";
    } else if (maxMinutes <= 45) {
      status = "fast";
    } else if (maxMinutes <= 120) {
      status = "normal";
    } else {
      status = "busy";
    }

    return NextResponse.json(
      {
        estimate: formatEstimate(minMinutes, maxMinutes),
        minMinutes,
        maxMinutes,
        status,
        activeStaff,
        openTickets,
        recentStaffReplies,
        calculatedAt: new Date().toISOString(),
        message:
          activeStaff > 0
            ? `${activeStaff} ticket staff ${
                activeStaff === 1 ? "member is" : "members are"
              } currently active.`
            : "No ticket staff have been active in the last five minutes.",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Support estimate error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        estimate: "Response time unavailable",
        minMinutes: null,
        maxMinutes: null,
        status: "offline",
        activeStaff: 0,
        openTickets: 0,
        recentStaffReplies: 0,
        calculatedAt: new Date().toISOString(),
        message: "The live response estimate could not be calculated.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}