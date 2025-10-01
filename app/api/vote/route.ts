/**
 * POST /api/vote
 * Records a user's vote and updates ELO ratings
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { updateEloRatings } from "@/lib/elo";
import { prisma } from "@/lib/db";
import { revealSeason } from "@/lib/matchup";

export async function POST(request: NextRequest) {
  try {
    // Get session
    const sessionId = await getOrCreateSession();

    // Parse request body
    const body = await request.json();
    const { winnerId, loserId } = body;

    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: "winnerId and loserId are required" },
        { status: 400 }
      );
    }

    if (winnerId === loserId) {
      return NextResponse.json(
        { error: "winnerId and loserId must be different" },
        { status: 400 }
      );
    }

    // Fetch the seasons with ELO data
    const [winnerSeason, loserSeason] = await Promise.all([
      prisma.qBSeason.findUnique({
        where: { id: winnerId },
        include: {
          eloRating: {
            select: {
              eloScore: true,
              voteCount: true,
            },
          },
        },
      }),
      prisma.qBSeason.findUnique({
        where: { id: loserId },
        include: {
          eloRating: {
            select: {
              eloScore: true,
              voteCount: true,
            },
          },
        },
      }),
    ]);

    if (!winnerSeason || !loserSeason) {
      return NextResponse.json(
        { error: "One or both seasons not found" },
        { status: 404 }
      );
    }

    // Record the vote
    await prisma.vote.create({
      data: {
        sessionId,
        winnerSeasonId: winnerId,
        loserSeasonId: loserId,
      },
    });

    // Update ELO ratings
    const eloUpdates = await updateEloRatings(winnerId, loserId);

    // Return revealed player info with new ELO scores
    return NextResponse.json({
      winner: {
        ...revealSeason(winnerSeason),
        eloChange: eloUpdates.winner.newRating - eloUpdates.winner.oldRating,
        newElo: eloUpdates.winner.newRating,
      },
      loser: {
        ...revealSeason(loserSeason),
        eloChange: eloUpdates.loser.newRating - eloUpdates.loser.oldRating,
        newElo: eloUpdates.loser.newRating,
      },
    });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
