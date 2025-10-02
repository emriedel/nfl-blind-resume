/**
 * Matchup selection algorithm
 * Selects two random QB seasons while avoiding recent repeats
 */

import { prisma } from "./db";
import type { Decimal } from "@prisma/client/runtime/library";

const RECENT_MATCHUP_LIMIT = 20; // Avoid repeating matchups from last 20 shown
const MAX_ELO_DIFFERENCE = 50; // Maximum ELO difference between matched seasons

/**
 * Weighted random selection that favors higher ELO players
 * Uses exponential weighting: higher ELO = higher probability
 */
function weightedRandomSelection(seasons: QBSeasonWithElo[]): QBSeasonWithElo {
  // Calculate weights based on ELO (exponential scale)
  const weights = seasons.map((season) => {
    const elo = season.eloRating
      ? parseFloat(season.eloRating.eloScore.toString())
      : 1500;
    // Scale ELO to 0-1 range (assuming range ~1300-1900), then square it for stronger weighting
    const normalized = (elo - 1200) / 800; // Maps 1200->0, 2000->1
    const weight = Math.pow(Math.max(0.1, normalized), 1.5); // Power of 1.5 for moderate bias
    return weight;
  });

  // Calculate total weight
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Pick a random value between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Find the selected season
  for (let i = 0; i < seasons.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return seasons[i];
    }
  }

  // Fallback (shouldn't reach here)
  return seasons[seasons.length - 1];
}

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
  headshotUrl: string | null;
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

  // Select first season using weighted random (favors higher ELO)
  const seasonA = weightedRandomSelection(availableSeasons);

  const seasonAElo = seasonA.eloRating
    ? parseFloat(seasonA.eloRating.eloScore.toString())
    : 1500;

  // Filter seasons that are within ELO range of seasonA
  const eloMatchedSeasons = availableSeasons.filter((season) => {
    if (season.id === seasonA.id) return false;

    const seasonElo = season.eloRating
      ? parseFloat(season.eloRating.eloScore.toString())
      : 1500;

    return Math.abs(seasonElo - seasonAElo) <= MAX_ELO_DIFFERENCE;
  });

  // If we have enough ELO-matched seasons, use those; otherwise fall back to any different season
  let seasonB: QBSeasonWithElo;
  if (eloMatchedSeasons.length > 0) {
    seasonB = weightedRandomSelection(eloMatchedSeasons);
  } else {
    // Fallback: select any different season
    const fallbackSeasons = availableSeasons.filter(s => s.id !== seasonA.id);
    if (fallbackSeasons.length === 0) {
      throw new Error("Could not find two different seasons for matchup");
    }
    seasonB = weightedRandomSelection(fallbackSeasons);
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
    headshotUrl: season.headshotUrl,
    eloScore: season.eloRating
      ? parseInt(season.eloRating.eloScore.toString())
      : null,
  };
}
