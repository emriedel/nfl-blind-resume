import type { NFLVersePlayerStats } from "./nflverse";

export interface QBSeasonData {
  playerName: string;
  year: number;
  team: string;
  gamesPlayed: number;
  passAttempts: number;
  completions: number;
  passingYards: number;
  touchdowns: number;
  interceptions: number;
  passerRating: number;
  rushAttempts: number;
  rushYards: number;
  rushTouchdowns: number;
  sacks: number;
  fumbles: number;
  wins?: number;
  losses?: number;
}

/**
 * Calculate NFL passer rating
 * Formula: https://en.wikipedia.org/wiki/Passer_rating
 */
export function calculatePasserRating(
  completions: number,
  attempts: number,
  yards: number,
  touchdowns: number,
  interceptions: number
): number {
  if (attempts === 0) return 0;

  // Component calculations
  const a = Math.max(0, Math.min(2.375, (completions / attempts - 0.3) * 5));
  const b = Math.max(0, Math.min(2.375, (yards / attempts - 3) * 0.25));
  const c = Math.max(0, Math.min(2.375, (touchdowns / attempts) * 20));
  const d = Math.max(0, Math.min(2.375, 2.375 - (interceptions / attempts) * 25));

  const rating = ((a + b + c + d) / 6) * 100;

  return Math.round(rating * 100) / 100; // Round to 2 decimal places
}

/**
 * Filter and transform NFLverse data to QB seasons
 * Applies minimum thresholds:
 * - Position must be QB
 * - Games played >= 8
 * - Pass attempts >= 200
 */
export function filterQBSeasons(
  stats: NFLVersePlayerStats[],
  minGames: number = 8,
  minAttempts: number = 200
): QBSeasonData[] {
  return stats
    .filter((stat) => {
      return (
        stat.position === "QB" &&
        stat.games >= minGames &&
        stat.attempts >= minAttempts
      );
    })
    .map((stat) => {
      const passerRating = calculatePasserRating(
        stat.completions,
        stat.attempts,
        stat.passing_yards,
        stat.passing_tds,
        stat.passing_interceptions
      );

      return {
        playerName: stat.player_display_name || stat.player_name,
        year: stat.season,
        team: stat.recent_team,
        gamesPlayed: stat.games,
        passAttempts: stat.attempts,
        completions: stat.completions,
        passingYards: stat.passing_yards,
        touchdowns: stat.passing_tds,
        interceptions: stat.passing_interceptions,
        passerRating,
        rushAttempts: stat.carries || 0,
        rushYards: stat.rushing_yards || 0,
        rushTouchdowns: stat.rushing_tds || 0,
        sacks: stat.sacks_suffered || 0,
        fumbles: stat.rushing_fumbles_lost || 0,
        // Note: Win/loss data not in this dataset, will be null
        wins: undefined,
        losses: undefined,
      };
    });
}

/**
 * Calculate initial ELO rating based on passer rating
 * Formula: 1000 + (passerRating * 5)
 * This gives a range of roughly 1000-1600 for typical QB ratings
 */
export function calculateInitialELO(passerRating: number): number {
  return Math.round(1000 + passerRating * 5);
}
