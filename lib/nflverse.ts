/**
 * Fetch NFL player stats from nflverse data repository
 */

const NFLVERSE_BASE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/player_stats";

export interface NFLVersePlayerStats {
  player_id: string;
  player_name: string;
  player_display_name: string;
  position: string;
  position_group: string;
  headshot_url: string;
  season: number;
  season_type: string;
  recent_team: string;
  games: number;
  completions: number;
  attempts: number;
  passing_yards: number;
  passing_tds: number;
  passing_interceptions: number;
  sacks_suffered: number;
  sack_yards_lost: number;
  passing_epa: number;
  carries: number;
  rushing_yards: number;
  rushing_tds: number;
  rushing_fumbles_lost: number;
}

/**
 * Fetch player stats for a specific season
 * @param year - NFL season year (e.g., 2023)
 * @param seasonType - "reg" (regular season) or "post" (postseason)
 */
export async function fetchPlayerStats(
  year: number,
  seasonType: "reg" | "post" = "reg"
): Promise<NFLVersePlayerStats[]> {
  const url = `${NFLVERSE_BASE_URL}/stats_player_${seasonType}_${year}.csv`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data for ${year}: ${response.statusText}`
      );
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching stats for ${year}:`, error);
    throw error;
  }
}

/**
 * Fetch stats for multiple seasons
 */
export async function fetchMultipleSeasons(
  startYear: number,
  endYear: number,
  seasonType: "reg" | "post" = "reg"
): Promise<NFLVersePlayerStats[]> {
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const allStats: NFLVersePlayerStats[] = [];

  for (const year of years) {
    console.log(`Fetching ${seasonType} season stats for ${year}...`);
    try {
      const stats = await fetchPlayerStats(year, seasonType);
      allStats.push(...stats);
    } catch (error) {
      console.error(`Failed to fetch ${year}, skipping...`);
    }
  }

  return allStats;
}

/**
 * Simple CSV parser
 */
function parseCSV(csvText: string): NFLVersePlayerStats[] {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      // Convert numeric fields
      if (
        [
          "season",
          "games",
          "completions",
          "attempts",
          "passing_yards",
          "passing_tds",
          "passing_interceptions",
          "sacks_suffered",
          "sack_yards_lost",
          "carries",
          "rushing_yards",
          "rushing_tds",
          "rushing_fumbles_lost",
        ].includes(header)
      ) {
        obj[header] = value ? parseInt(value, 10) : 0;
      } else if (["passing_epa"].includes(header)) {
        obj[header] = value ? parseFloat(value) : 0;
      } else {
        obj[header] = value || "";
      }
    });

    return obj as NFLVersePlayerStats;
  });
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
