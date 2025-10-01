"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  gamesPlayed: number;
  completions: number;
  attempts: number;
  completionPct: string;
  passingYards: number;
  touchdowns: number;
  interceptions: number;
  passerRating: string;
}

interface Season {
  id: number;
  year: number;
  team: string;
  stats: Stats;
  record: string | null;
  playerName?: string;
  eloScore?: number;
  eloChange?: number;
  newElo?: number;
}

interface Matchup {
  seasonA: Season;
  seasonB: Season;
}

type VoteResult = {
  winner: Season;
  loser: Season;
};

export default function Home() {
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  // Fetch initial matchup
  useEffect(() => {
    fetchMatchup();
  }, []);

  const fetchMatchup = async () => {
    setLoading(true);
    setVoteResult(null);
    try {
      const response = await fetch("/api/matchup");
      const data = await response.json();
      setMatchup(data);
    } catch (error) {
      console.error("Failed to fetch matchup:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winnerId: number, loserId: number) => {
    setVoting(true);
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, loserId }),
      });
      const result = await response.json();
      setVoteResult(result);
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setVoting(false);
    }
  };

  const handleNextMatchup = () => {
    fetchMatchup();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading matchup...</div>
      </main>
    );
  }

  if (!matchup) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">Failed to load matchup</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <Link
              href="/standings"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Rankings →
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            QB Blind Resume
          </h1>
          <p className="text-gray-600">
            Which quarterback season was better? Vote based on stats alone.
          </p>
        </div>

        {/* Matchup Display */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Season A */}
          <SeasonCard
            season={
              voteResult
                ? voteResult.winner.id === matchup.seasonA.id
                  ? voteResult.winner
                  : voteResult.loser
                : matchup.seasonA
            }
            onVote={() =>
              handleVote(matchup.seasonA.id, matchup.seasonB.id)
            }
            disabled={voting || voteResult !== null}
            revealed={voteResult !== null}
            isWinner={voteResult?.winner.id === matchup.seasonA.id}
          />

          {/* Season B */}
          <SeasonCard
            season={
              voteResult
                ? voteResult.winner.id === matchup.seasonB.id
                  ? voteResult.winner
                  : voteResult.loser
                : matchup.seasonB
            }
            onVote={() =>
              handleVote(matchup.seasonB.id, matchup.seasonA.id)
            }
            disabled={voting || voteResult !== null}
            revealed={voteResult !== null}
            isWinner={voteResult?.winner.id === matchup.seasonB.id}
          />
        </div>

        {/* Next Matchup Button */}
        {voteResult && (
          <div className="text-center">
            <button
              onClick={handleNextMatchup}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Next Matchup →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Season Card Component
function SeasonCard({
  season,
  onVote,
  disabled,
  revealed,
  isWinner,
}: {
  season: Season;
  onVote: () => void;
  disabled: boolean;
  revealed: boolean;
  isWinner?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 transition-all ${
        revealed && isWinner ? "ring-4 ring-green-500" : ""
      } ${revealed && !isWinner ? "opacity-75" : ""}`}
    >
      {/* Header */}
      <div className="mb-6">
        {revealed && season.playerName ? (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {season.playerName}
            </h2>
            {season.eloChange !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">
                  ELO: {season.newElo}
                </span>
                <span
                  className={`font-semibold ${
                    season.eloChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {season.eloChange > 0 ? "+" : ""}
                  {season.eloChange}
                </span>
              </div>
            )}
          </div>
        ) : (
          <h2 className="text-3xl font-bold text-gray-900">???</h2>
        )}
        <div className="text-gray-600 mt-2">
          {season.year} • {season.team}
          {season.record && ` • ${season.record}`}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem label="Games" value={season.stats.gamesPlayed} />
        <StatItem
          label="Comp %"
          value={`${season.stats.completionPct}%`}
        />
        <StatItem
          label="Yards"
          value={season.stats.passingYards.toLocaleString()}
        />
        <StatItem label="TDs" value={season.stats.touchdowns} />
        <StatItem label="INTs" value={season.stats.interceptions} />
        <StatItem label="Rating" value={season.stats.passerRating} />
      </div>

      {/* Detailed Stats */}
      <div className="text-sm text-gray-600 mb-6 space-y-1">
        <div>
          {season.stats.completions}/{season.stats.attempts} completions
        </div>
      </div>

      {/* Vote Button */}
      {!revealed && (
        <button
          onClick={onVote}
          disabled={disabled}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            disabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {disabled ? "Voting..." : "Vote for this season"}
        </button>
      )}

      {/* Winner Badge */}
      {revealed && isWinner && (
        <div className="text-center">
          <span className="inline-block bg-green-500 text-white font-bold py-2 px-6 rounded-lg">
            ✓ You picked this season
          </span>
        </div>
      )}
    </div>
  );
}

// Stat Item Component
function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
