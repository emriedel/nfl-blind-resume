/**
 * GET /api/standings
 * Returns QB seasons ranked by ELO with optional filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const team = searchParams.get("team");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build where clause
    const where: any = {};
    if (year) {
      where.year = parseInt(year);
    }
    if (team) {
      where.team = team;
    }

    // Fetch ALL QB seasons with ELO ratings and sort them first
    const allSeasons = await prisma.qBSeason.findMany({
      where,
      include: {
        eloRating: true,
      },
    });

    // Sort by ELO rating (descending) across ALL records
    const sortedSeasons = allSeasons
      .filter((s) => s.eloRating !== null)
      .sort((a, b) => {
        const eloA = parseFloat(a.eloRating!.eloScore.toString());
        const eloB = parseFloat(b.eloRating!.eloScore.toString());
        return eloB - eloA;
      });

    // Get total count
    const total = sortedSeasons.length;

    // Apply pagination AFTER sorting
    const paginatedSeasons = sortedSeasons.slice(
      offset ? parseInt(offset) : 0,
      (offset ? parseInt(offset) : 0) + (limit ? parseInt(limit) : 100)
    );

    // Add rank based on global position
    const rankedSeasons = paginatedSeasons.map((season, index) => ({
      rank: (offset ? parseInt(offset) : 0) + index + 1,
      id: season.id,
      playerName: season.playerName,
      headshotUrl: season.headshotUrl,
      year: season.year,
      team: season.team,
      eloScore: parseInt(season.eloRating!.eloScore.toString()),
      voteCount: season.eloRating!.voteCount,
      stats: {
        gamesPlayed: season.gamesPlayed,
        completions: season.completions,
        attempts: season.passAttempts,
        completionPct: (
          (season.completions / season.passAttempts) *
          100
        ).toFixed(1),
        passingYards: season.passingYards,
        passYPA: (season.passingYards / season.passAttempts).toFixed(1),
        touchdowns: season.touchdowns,
        interceptions: season.interceptions,
        passerRating: parseFloat(season.passerRating.toString()).toFixed(1),
        sacks: season.sacks || 0,
        fumbles: season.fumbles || 0,
        rushYards: season.rushYards || 0,
        rushTouchdowns: season.rushTouchdowns || 0,
      },
      record:
        season.wins !== null && season.losses !== null
          ? `${season.wins}-${season.losses}`
          : null,
    }));

    // Get unique years and teams for filters
    const filterOptions = await prisma.qBSeason.findMany({
      select: {
        year: true,
        team: true,
      },
      distinct: ["year", "team"],
      orderBy: [{ year: "desc" }, { team: "asc" }],
    });

    const years = [...new Set(filterOptions.map((s) => s.year))].sort(
      (a, b) => b - a
    );
    const teams = [...new Set(filterOptions.map((s) => s.team))].sort();

    return NextResponse.json({
      standings: rankedSeasons,
      total,
      filters: {
        years,
        teams,
      },
    });
  } catch (error) {
    console.error("Error getting standings:", error);
    return NextResponse.json(
      { error: "Failed to get standings" },
      { status: 500 }
    );
  }
}
