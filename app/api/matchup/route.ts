/**
 * GET /api/matchup
 * Returns two random QB seasons for comparison
 */

import { NextResponse } from "next/server";
import { getOrCreateSession, setSessionCookie } from "@/lib/session";
import { getRandomMatchup, formatSeasonForMatchup } from "@/lib/matchup";

export async function GET() {
  try {
    // Get or create session
    const sessionId = await getOrCreateSession();
    await setSessionCookie(sessionId);

    // Get random matchup
    const { seasonA, seasonB } = await getRandomMatchup(sessionId);

    // Format response (hide player names)
    return NextResponse.json({
      seasonA: formatSeasonForMatchup(seasonA),
      seasonB: formatSeasonForMatchup(seasonB),
    });
  } catch (error) {
    console.error("Error getting matchup:", error);
    return NextResponse.json(
      { error: "Failed to get matchup" },
      { status: 500 }
    );
  }
}
