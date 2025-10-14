/**
 * Database seeding script
 * Fetches QB stats from NFLverse and populates the database
 */

import { prisma } from "../db";
import { fetchMultipleSeasons } from "../nflverse";
import {
  filterQBSeasons,
  getAllQBSeasons,
  calculateInitialELO,
  calculateSeasonRanks,
} from "../qb-utils";

const START_YEAR = 1999; // First year with comprehensive data
const END_YEAR = 2024; // Current season

async function seed() {
  console.log("🏈 Starting QB data seeding...\n");

  try {
    // Step 1: Fetch data from NFLverse
    console.log(
      `📥 Fetching NFL player stats from ${START_YEAR} to ${END_YEAR}...`
    );
    const allStats = await fetchMultipleSeasons(START_YEAR, END_YEAR, "reg");
    console.log(`✅ Fetched ${allStats.length} player season records\n`);

    // Step 2: Get all QB seasons (for ranking purposes)
    console.log("🎯 Processing all QB seasons...");
    const allQBSeasons = getAllQBSeasons(allStats);
    console.log(`✅ Found ${allQBSeasons.length} total QB seasons\n`);

    // Step 3: Filter to QB seasons meeting our criteria
    console.log("🎯 Filtering QB seasons (12+ games, 300+ attempts)...");
    let qbSeasons = filterQBSeasons(allStats, 12, 300);
    console.log(`✅ Found ${qbSeasons.length} qualifying QB seasons\n`);

    // Step 4: Calculate season ranks (rank qualifying QBs against ALL QBs)
    console.log(
      "📊 Calculating season rankings (comparing against all QBs)..."
    );
    qbSeasons = calculateSeasonRanks(qbSeasons, allQBSeasons);
    console.log(`✅ Rankings calculated\n`);

    // Step 3: Clear existing data
    console.log("🗑️  Clearing existing data...");
    await prisma.eloRating.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.matchupHistory.deleteMany();
    await prisma.qBSeason.deleteMany();
    console.log("✅ Database cleared\n");

    // Step 4: Insert QB seasons and ELO ratings
    console.log("💾 Inserting QB seasons into database...");
    let inserted = 0;

    for (const qb of qbSeasons) {
      try {
        // Create QB season
        const season = await prisma.qBSeason.create({
          data: {
            playerName: qb.playerName,
            year: qb.year,
            team: qb.team,
            gamesPlayed: qb.gamesPlayed,
            passAttempts: qb.passAttempts,
            completions: qb.completions,
            passingYards: qb.passingYards,
            touchdowns: qb.touchdowns,
            interceptions: qb.interceptions,
            passerRating: qb.passerRating.toString(),
            rushAttempts: qb.rushAttempts,
            rushYards: qb.rushYards,
            rushTouchdowns: qb.rushTouchdowns,
            sacks: qb.sacks,
            fumbles: qb.fumbles,
            headshotUrl: qb.headshotUrl || null,
            wins: qb.wins || null,
            losses: qb.losses || null,
            // Add calculated ranks
            passingYardsRank: qb.passingYardsRank || null,
            touchdownsRank: qb.touchdownsRank || null,
            passerRatingRank: qb.passerRatingRank || null,
            completionPctRank: qb.completionPctRank || null,
            interceptionsRank: qb.interceptionsRank || null,
            rushYardsRank: qb.rushYardsRank || null,
            rushTouchdownsRank: qb.rushTouchdownsRank || null,
          },
        });

        // Create initial ELO rating
        const initialELO = calculateInitialELO(qb);
        await prisma.eloRating.create({
          data: {
            seasonId: season.id,
            eloScore: initialELO.toString(),
            voteCount: 0,
          },
        });

        inserted++;

        // Progress update every 100 seasons
        if (inserted % 100 === 0) {
          console.log(`  ... inserted ${inserted}/${qbSeasons.length}`);
        }
      } catch (error) {
        console.error(
          `Failed to insert ${qb.playerName} ${qb.year}:`,
          error
        );
      }
    }

    console.log(`✅ Inserted ${inserted} QB seasons with ELO ratings\n`);

    // Step 5: Display summary
    const stats = await prisma.qBSeason.groupBy({
      by: ["year"],
      _count: true,
    });

    console.log("📊 Summary by year:");
    stats
      .sort((a, b) => a.year - b.year)
      .forEach((stat) => {
        console.log(`  ${stat.year}: ${stat._count} QB seasons`);
      });

    console.log("\n✨ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
