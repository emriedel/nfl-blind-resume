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
  rushAttempts: number;
  rushYards: number;
  rushTouchdowns: number;
  rushYardsPerAttempt: string;
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

  const seasonA = voteResult
    ? voteResult.winner.id === matchup.seasonA.id
      ? voteResult.winner
      : voteResult.loser
    : matchup.seasonA;

  const seasonB = voteResult
    ? voteResult.winner.id === matchup.seasonB.id
      ? voteResult.winner
      : voteResult.loser
    : matchup.seasonB;

  const isWinnerA = voteResult?.winner.id === matchup.seasonA.id;
  const isWinnerB = voteResult?.winner.id === matchup.seasonB.id;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
          <p className="text-gray-600 mb-4">
            Which quarterback season was better? Vote based on stats alone.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  {voteResult && seasonA.playerName ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-gray-900 animate-fade-in">
                        {seasonA.playerName}
                      </div>
                      {seasonA.eloChange !== undefined && (
                        <div className="text-xs">
                          <span className="text-gray-600">ELO: {seasonA.newElo}</span>{" "}
                          <span
                            className={`font-semibold ${
                              seasonA.eloChange > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ({seasonA.eloChange > 0 ? "+" : ""}
                            {seasonA.eloChange})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">Player A</div>
                  )}
                  <div className="text-sm font-normal text-gray-600 mt-1">
                    {seasonA.year} • {seasonA.team}
                    {seasonA.record && ` • ${seasonA.record}`}
                  </div>
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 w-48">
                  Stat
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  {voteResult && seasonB.playerName ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-gray-900 animate-fade-in">
                        {seasonB.playerName}
                      </div>
                      {seasonB.eloChange !== undefined && (
                        <div className="text-xs">
                          <span className="text-gray-600">ELO: {seasonB.newElo}</span>{" "}
                          <span
                            className={`font-semibold ${
                              seasonB.eloChange > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ({seasonB.eloChange > 0 ? "+" : ""}
                            {seasonB.eloChange})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">Player B</div>
                  )}
                  <div className="text-sm font-normal text-gray-600 mt-1">
                    {seasonB.year} • {seasonB.team}
                    {seasonB.record && ` • ${seasonB.record}`}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <StatRow
                label="Games"
                valueA={seasonA.stats.gamesPlayed}
                valueB={seasonB.stats.gamesPlayed}
              />
              <StatRow
                label="Comp/Att"
                valueA={`${seasonA.stats.completions}/${seasonA.stats.attempts}`}
                valueB={`${seasonB.stats.completions}/${seasonB.stats.attempts}`}
              />
              <StatRow
                label="Comp %"
                valueA={`${seasonA.stats.completionPct}%`}
                valueB={`${seasonB.stats.completionPct}%`}
              />
              <StatRow
                label="Pass Yds"
                valueA={seasonA.stats.passingYards.toLocaleString()}
                valueB={seasonB.stats.passingYards.toLocaleString()}
              />
              <StatRow
                label="Pass YPA"
                valueA={(seasonA.stats.passingYards / seasonA.stats.attempts).toFixed(1)}
                valueB={(seasonB.stats.passingYards / seasonB.stats.attempts).toFixed(1)}
              />
              <StatRow
                label="Pass TD"
                valueA={seasonA.stats.touchdowns}
                valueB={seasonB.stats.touchdowns}
              />
              <StatRow
                label="Int"
                valueA={seasonA.stats.interceptions}
                valueB={seasonB.stats.interceptions}
              />
              <StatRow
                label="Rating"
                valueA={seasonA.stats.passerRating}
                valueB={seasonB.stats.passerRating}
              />
              <StatRow
                label="Rush Att"
                valueA={seasonA.stats.rushAttempts}
                valueB={seasonB.stats.rushAttempts}
              />
              <StatRow
                label="Rush Yds"
                valueA={seasonA.stats.rushYards}
                valueB={seasonB.stats.rushYards}
              />
              <StatRow
                label="Rush YPA"
                valueA={seasonA.stats.rushYardsPerAttempt}
                valueB={seasonB.stats.rushYardsPerAttempt}
              />
              <StatRow
                label="Rush TD"
                valueA={seasonA.stats.rushTouchdowns}
                valueB={seasonB.stats.rushTouchdowns}
              />
            </tbody>
          </table>
        </div>

        {/* Vote Buttons */}
        {!voteResult && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleVote(matchup.seasonA.id, matchup.seasonB.id)}
              disabled={voting}
              className={`py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                voting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {voting ? "Voting..." : "Vote for Player A"}
            </button>
            <button
              onClick={() => handleVote(matchup.seasonB.id, matchup.seasonA.id)}
              disabled={voting}
              className={`py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                voting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {voting ? "Voting..." : "Vote for Player B"}
            </button>
          </div>
        )}

        {/* Winner Badge */}
        {voteResult && (
          <div className="text-center mb-6">
            <div className="inline-block bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg">
              ✓ You picked {isWinnerA ? seasonA.playerName : seasonB.playerName}!
            </div>
          </div>
        )}

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

// Stat Row Component
function StatRow({
  label,
  valueA,
  valueB,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-3 text-right font-semibold text-gray-900">{valueA}</td>
      <td className="px-4 py-3 text-center text-sm text-gray-600 bg-gray-50">{label}</td>
      <td className="px-6 py-3 text-left font-semibold text-gray-900">{valueB}</td>
    </tr>
  );
}
