import { NextResponse } from "next/server";

export async function GET() {
  const ip = process.env.FIVEM_SERVER_IP;
  const port = process.env.FIVEM_SERVER_PORT || "30120";

  if (!ip) {
    return NextResponse.json({
      online: false,
      players: 0,
      maxPlayers: 0,
      error: "Missing FIVEM_SERVER_IP",
    });
  }

  try {
    const [dynamicResponse, playersResponse] = await Promise.all([
      fetch(`http://${ip}:${port}/dynamic.json`, { cache: "no-store" }),
      fetch(`http://${ip}:${port}/players.json`, { cache: "no-store" }),
    ]);

    if (!dynamicResponse.ok) {
      throw new Error("Server offline");
    }

    const dynamic = await dynamicResponse.json();
    const players = playersResponse.ok ? await playersResponse.json() : [];

    return NextResponse.json({
      online: true,
      players: players.length || Number(dynamic.clients || 0),
      maxPlayers: Number(dynamic.sv_maxclients || 0),
      hostname: dynamic.hostname || "LURP Server",
      gametype: dynamic.gametype || "Roleplay",
    });
  } catch {
    return NextResponse.json({
      online: false,
      players: 0,
      maxPlayers: 0,
      hostname: "LURP Server",
      gametype: "Roleplay",
    });
  }
}