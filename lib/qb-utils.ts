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
 * - Games played >= 12
 * - Pass attempts >= 300
 */
export function filterQBSeasons(
  stats: NFLVersePlayerStats[],
  minGames: number = 12,
  minAttempts: number = 300
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
 * Calculate initial ELO rating using a composite scoring system
 *
 * This algorithm considers multiple dimensions of QB performance:
 * - Efficiency (40%): Completion %, YPA, TD rate, INT rate
 * - Volume (20%): Yards/game, TDs/game
 * - Dual-threat (15%): Rushing production
 * - Ball security (15%): Turnovers and sack rate
 * - Passer rating (10%): Official NFL rating as validation
 *
 * Expected range: ~1300-1900 for qualifying QB seasons
 */
export function calculateInitialELO(qb: QBSeasonData): number {
  const BASE_ELO = 1200;

  // 1. Efficiency Score (40% weight) - per-play efficiency
  const completionPct = (qb.completions / qb.passAttempts) * 100;
  const yardsPerAttempt = qb.passingYards / qb.passAttempts;
  const tdRate = (qb.touchdowns / qb.passAttempts) * 100;
  const intRate = (qb.interceptions / qb.passAttempts) * 100;

  const efficiencyScore =
    completionPct * 2 + // 60-70% = 120-140 points
    yardsPerAttempt * 30 + // 7-8 YPA = 210-240 points
    tdRate * 100 + // 4-5% = 400-500 points
    (2.5 - intRate) * 100; // 1-2% INT = 150-250 points

  // 2. Volume Score (20% weight) - sustained production
  const yardsPerGame = qb.passingYards / qb.gamesPlayed;
  const tdsPerGame = qb.touchdowns / qb.gamesPlayed;

  const volumeScore = yardsPerGame * 0.8 + tdsPerGame * 50;

  // 3. Dual-Threat Score (15% weight) - rushing production
  const rushYardsPerGame = qb.rushYards / qb.gamesPlayed;
  const rushTdValue = qb.rushTouchdowns * 30;

  const dualThreatScore = rushYardsPerGame * 2 + rushTdValue;

  // 4. Ball Security Score (15% weight) - penalize turnovers
  const turnoversPerGame = (qb.interceptions + qb.fumbles) / qb.gamesPlayed;
  const sackRate = qb.sacks / qb.passAttempts;

  const ballSecurityScore =
    (1.0 - turnoversPerGame) * 100 + (0.05 - sackRate) * 500;

  // 5. Passer Rating Adjustment (10% weight) - validation layer
  const passerRatingScore = qb.passerRating * 2;

  // Weighted combination
  const compositeScore =
    efficiencyScore * 0.4 +
    volumeScore * 0.2 +
    dualThreatScore * 0.15 +
    ballSecurityScore * 0.15 +
    passerRatingScore * 0.1;

  // Final ELO (scale composite score to reasonable range)
  const finalElo = BASE_ELO + compositeScore * 0.5;

  return Math.round(finalElo);
}
