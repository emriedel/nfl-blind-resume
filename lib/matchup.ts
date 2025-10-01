/**
 * Matchup selection algorithm
 * Selects two random QB seasons while avoiding recent repeats
 */

import { prisma } from "./db";
import type { Decimal } from "@prisma/client/runtime/library";

const RECENT_MATCHUP_LIMIT = 20; // Avoid repeating matchups from last 20 shown

export interface QBSeasonWithElo {
  id: number;
  playerName: string;
  year: number;
  team: string;
  gamesPlayed: number;
  passAttempts: number;
  completions: number;
  passingYards: number;
  touchdowns: number;
  interceptions: number;
  passerRating: string | Decimal;
  rushAttempts: number;
  rushYards: number;
  rushTouchdowns: number;
  sacks: number;
  fumbles: number;
  wins: number | null;
  losses: number | null;
  eloRating: {
    eloScore: string | Decimal;
    voteCount: number;
  } | null;
}

/**
 * Get a random matchup for a user session
 * Avoids showing the same matchup that was recently shown to this session
 */
export async function getRandomMatchup(
  sessionId: string
): Promise<{ seasonA: QBSeasonWithElo; seasonB: QBSeasonWithElo }> {
  // Get recent matchups for this session to avoid repeats
  const recentMatchups = await prisma.matchupHistory.findMany({
    where: { sessionId },
    orderBy: { shownAt: "desc" },
    take: RECENT_MATCHUP_LIMIT,
    select: {
      seasonAId: true,
      seasonBId: true,
    },
  });

  // Build a set of season IDs that have been shown recently
  const recentSeasonIds = new Set<number>();
  recentMatchups.forEach((m) => {
    recentSeasonIds.add(m.seasonAId);
    recentSeasonIds.add(m.seasonBId);
  });

  // Get all QB seasons with their ELO ratings
  const allSeasons = await prisma.qBSeason.findMany({
    include: {
      eloRating: {
        select: {
          eloScore: true,
          voteCount: true,
        },
      },
    },
  });

  if (allSeasons.length < 2) {
    throw new Error("Not enough QB seasons in database");
  }

  // Filter out recently shown seasons if we have enough alternatives
  let availableSeasons = allSeasons;
  if (allSeasons.length - recentSeasonIds.size >= 2) {
    availableSeasons = allSeasons.filter(
      (season) => !recentSeasonIds.has(season.id)
    );
  }

  // Select two random seasons
  const seasonA =
    availableSeasons[Math.floor(Math.random() * availableSeasons.length)];
  let seasonB =
    availableSeasons[Math.floor(Math.random() * availableSeasons.length)];

  // Ensure seasonB is different from seasonA
  let attempts = 0;
  while (seasonB.id === seasonA.id && attempts < 10) {
    seasonB =
      availableSeasons[Math.floor(Math.random() * availableSeasons.length)];
    attempts++;
  }

  if (seasonB.id === seasonA.id) {
    throw new Error("Could not find two different seasons for matchup");
  }

  // Record this matchup in history
  await prisma.matchupHistory.create({
    data: {
      sessionId,
      seasonAId: seasonA.id,
      seasonBId: seasonB.id,
    },
  });

  return {
    seasonA,
    seasonB,
  };
}

/**
 * Format QB season data for API response (hide player names)
 */
export function formatSeasonForMatchup(season: QBSeasonWithElo) {
  return {
    id: season.id,
    year: season.year,
    team: season.team,
    stats: {
      gamesPlayed: season.gamesPlayed,
      completions: season.completions,
      attempts: season.passAttempts,
      completionPct: (
        (season.completions / season.passAttempts) *
        100
      ).toFixed(1),
      passingYards: season.passingYards,
      touchdowns: season.touchdowns,
      interceptions: season.interceptions,
      passerRating: parseFloat(season.passerRating.toString()).toFixed(1),
      rushAttempts: season.rushAttempts,
      rushYards: season.rushYards,
      rushTouchdowns: season.rushTouchdowns,
      rushYardsPerAttempt: season.rushAttempts > 0 ? (season.rushYards / season.rushAttempts).toFixed(1) : "0.0",
      sacks: season.sacks,
      fumbles: season.fumbles,
    },
    record:
      season.wins !== null && season.losses !== null
        ? `${season.wins}-${season.losses}`
        : null,
  };
}

/**
 * Reveal player names after voting
 */
export function revealSeason(season: QBSeasonWithElo) {
  return {
    ...formatSeasonForMatchup(season),
    playerName: season.playerName,
    eloScore: season.eloRating
      ? parseInt(season.eloRating.eloScore.toString())
      : null,
  };
}
