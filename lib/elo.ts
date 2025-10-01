/**
 * ELO rating system implementation
 * Based on chess-style ELO with K-factor of 32
 */

const K_FACTOR = 32;

/**
 * Calculate expected score for player A
 * @param ratingA - Current ELO rating of player A
 * @param ratingB - Current ELO rating of player B
 * @returns Expected score (0 to 1)
 */
export function calculateExpectedScore(
  ratingA: number,
  ratingB: number
): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a matchup
 * @param winnerRating - Current ELO rating of the winner
 * @param loserRating - Current ELO rating of the loser
 * @param kFactor - K-factor for rating adjustment (default: 32)
 * @returns Object with new ratings for winner and loser
 */
export function calculateNewRatings(
  winnerRating: number,
  loserRating: number,
  kFactor: number = K_FACTOR
): { newWinnerRating: number; newLoserRating: number } {
  // Calculate expected scores
  const expectedWinner = calculateExpectedScore(winnerRating, loserRating);
  const expectedLoser = calculateExpectedScore(loserRating, winnerRating);

  // Actual scores (1 for winner, 0 for loser)
  const actualWinner = 1;
  const actualLoser = 0;

  // Calculate rating changes
  const winnerChange = kFactor * (actualWinner - expectedWinner);
  const loserChange = kFactor * (actualLoser - expectedLoser);

  // Calculate new ratings
  const newWinnerRating = Math.round(winnerRating + winnerChange);
  const newLoserRating = Math.round(loserRating + loserChange);

  return {
    newWinnerRating,
    newLoserRating,
  };
}

/**
 * Update ELO ratings in the database after a vote
 */
import { prisma } from "./db";

export async function updateEloRatings(
  winnerSeasonId: number,
  loserSeasonId: number
): Promise<{
  winner: { id: number; oldRating: number; newRating: number };
  loser: { id: number; oldRating: number; newRating: number };
}> {
  // Fetch current ratings
  const [winnerElo, loserElo] = await Promise.all([
    prisma.eloRating.findUnique({
      where: { seasonId: winnerSeasonId },
    }),
    prisma.eloRating.findUnique({
      where: { seasonId: loserSeasonId },
    }),
  ]);

  if (!winnerElo || !loserElo) {
    throw new Error("ELO ratings not found for one or both seasons");
  }

  const winnerRating = parseFloat(winnerElo.eloScore.toString());
  const loserRating = parseFloat(loserElo.eloScore.toString());

  // Calculate new ratings
  const { newWinnerRating, newLoserRating } = calculateNewRatings(
    winnerRating,
    loserRating
  );

  // Update ratings in database
  await Promise.all([
    prisma.eloRating.update({
      where: { seasonId: winnerSeasonId },
      data: {
        eloScore: newWinnerRating.toString(),
        voteCount: { increment: 1 },
      },
    }),
    prisma.eloRating.update({
      where: { seasonId: loserSeasonId },
      data: {
        eloScore: newLoserRating.toString(),
        voteCount: { increment: 1 },
      },
    }),
  ]);

  return {
    winner: {
      id: winnerSeasonId,
      oldRating: winnerRating,
      newRating: newWinnerRating,
    },
    loser: {
      id: loserSeasonId,
      oldRating: loserRating,
      newRating: newLoserRating,
    },
  };
}
