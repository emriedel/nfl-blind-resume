/**
 * Production database seeding script
 * Run this once to populate production database with QB data
 *
 * Usage: DATABASE_URL=<production-url> tsx lib/scripts/seed-production.ts
 */

import { PrismaClient } from "../generated/prisma";
import { fetchMultipleSeasons } from "../nflverse";
import { filterQBSeasons, calculateInitialELO } from "../qb-utils";

const START_YEAR = 1999;
const END_YEAR = 2024;

async function seedProduction() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("Connecting to database...");
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

  console.log("🏈 Starting production QB data seeding...\n");

  try {
    // Step 1: Fetch data from NFLverse
    console.log(
      `📥 Fetching NFL player stats from ${START_YEAR} to ${END_YEAR}...`
    );
    const allStats = await fetchMultipleSeasons(START_YEAR, END_YEAR, "reg");
    console.log(`✅ Fetched ${allStats.length} player season records\n`);

    // Step 2: Filter to QB seasons meeting our criteria
    console.log("🎯 Filtering QB seasons (12+ games, 300+ attempts)...");
    const qbSeasons = filterQBSeasons(allStats, 12, 300);
    console.log(`✅ Found ${qbSeasons.length} qualifying QB seasons\n`);

    // Step 3: Check if data already exists
    const existingCount = await prisma.qBSeason.count();
    if (existingCount > 0) {
      console.log(`⚠️  Database already contains ${existingCount} QB seasons`);
      console.log("Skipping seed to avoid duplicates.\n");
      console.log("To re-seed, first delete existing data manually.\n");
      return;
    }

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
            wins: qb.wins || null,
            losses: qb.losses || null,
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

    console.log("\n✨ Production seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedProduction().catch((error) => {
  console.error(error);
  process.exit(1);
});
