"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  gamesPlayed: number;
  completions: number;
  attempts: number;
  completionPct: string;
  passingYards: number;
  passYPA?: string;
  touchdowns: number;
  interceptions: number;
  passerRating: string;
  rushAttempts: number;
  rushYards: number;
  rushTouchdowns: number;
  rushYardsPerAttempt: string;
  sacks: number;
  fumbles: number;
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
  const router = useRouter();
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

  const seasonA = matchup && voteResult
    ? voteResult.winner.id === matchup.seasonA.id
      ? voteResult.winner
      : voteResult.loser
    : matchup?.seasonA;

  const seasonB = matchup && voteResult
    ? voteResult.winner.id === matchup.seasonB.id
      ? voteResult.winner
      : voteResult.loser
    : matchup?.seasonB;

  const isWinnerA = voteResult && matchup && voteResult.winner.id === matchup.seasonA.id;
  const isWinnerB = voteResult && matchup && voteResult.winner.id === matchup.seasonB.id;

  return (
    <main className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Quarterback Blind Resume
          </h1>
          <p className="text-gray-400 mb-4">
            Which quarterback season was better? Vote based on stats alone.
          </p>

          {/* Toggle between Voting and Leaderboard */}
          <div className="flex justify-center gap-2 bg-gray-800 p-1 rounded-lg inline-flex border border-gray-700">
            <button
              className="font-semibold px-6 py-2 rounded-md bg-blue-600 text-white"
            >
              Vote
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="font-semibold px-6 py-2 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Vote View */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-gray-400">Loading matchup...</div>
          </div>
        ) : !matchup || !seasonA || !seasonB ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-red-400">Failed to load matchup</div>
          </div>
        ) : (
          <>
            {/* Next Matchup Button (Top) */}
            {voteResult && (
              <div className="text-center mb-6">
                <button
                  onClick={handleNextMatchup}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Next Matchup →
                </button>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-700 max-w-3xl mx-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      className={`px-6 py-4 text-right text-sm font-semibold w-[40%] ${
                        !voteResult ? 'cursor-pointer hover:bg-blue-600 hover:shadow-lg transition-all text-gray-200' : ''
                      } ${
                        voteResult && isWinnerA ? 'bg-green-900/50 text-white' : 'text-gray-200'
                      }`}
                      onClick={() => !voteResult && !voting && handleVote(matchup.seasonA.id, matchup.seasonB.id)}
                    >
                      {voteResult && seasonA.playerName ? (
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-white animate-fade-in">
                            {seasonA.playerName}
                          </div>
                          {seasonA.eloChange !== undefined && (
                            <div className="text-xs">
                              <span className="text-gray-400">ELO: {seasonA.newElo}</span>{" "}
                              <span
                                className={`font-semibold ${
                                  seasonA.eloChange > 0 ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                ({seasonA.eloChange > 0 ? "+" : ""}
                                {seasonA.eloChange})
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-white flex items-center justify-end gap-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          QB A
                        </div>
                      )}
                      <div className="text-sm font-normal text-gray-400 mt-1">
                        {seasonA.year}
                        {voteResult && ` • ${seasonA.team}`}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-200 w-[20%]">

                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold w-[40%] ${
                        !voteResult ? 'cursor-pointer hover:bg-blue-600 hover:shadow-lg transition-all text-gray-200' : ''
                      } ${
                        voteResult && isWinnerB ? 'bg-green-900/50 text-white' : 'text-gray-200'
                      }`}
                      onClick={() => !voteResult && !voting && handleVote(matchup.seasonB.id, matchup.seasonA.id)}
                    >
                      {voteResult && seasonB.playerName ? (
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-white animate-fade-in">
                            {seasonB.playerName}
                          </div>
                          {seasonB.eloChange !== undefined && (
                            <div className="text-xs">
                              <span className="text-gray-400">ELO: {seasonB.newElo}</span>{" "}
                              <span
                                className={`font-semibold ${
                                  seasonB.eloChange > 0 ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                ({seasonB.eloChange > 0 ? "+" : ""}
                                {seasonB.eloChange})
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-white flex items-center justify-start gap-2">
                          QB B
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm font-normal text-gray-400 mt-1">
                        {seasonB.year}
                        {voteResult && ` • ${seasonB.team}`}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <StatRow
                    label="Games"
                    valueA={seasonA.stats.gamesPlayed}
                    valueB={seasonB.stats.gamesPlayed}
                  />
                  <StatRow
                    label="Comp %"
                    valueA={`${seasonA.stats.completionPct}%`}
                    valueB={`${seasonB.stats.completionPct}%`}
                    numA={parseFloat(seasonA.stats.completionPct)}
                    numB={parseFloat(seasonB.stats.completionPct)}
                  />
                  <StatRow
                    label="Pass Yds"
                    valueA={seasonA.stats.passingYards.toLocaleString()}
                    valueB={seasonB.stats.passingYards.toLocaleString()}
                    numA={seasonA.stats.passingYards}
                    numB={seasonB.stats.passingYards}
                  />
                  <StatRow
                    label="Pass YPA"
                    valueA={(seasonA.stats.passingYards / seasonA.stats.attempts).toFixed(1)}
                    valueB={(seasonB.stats.passingYards / seasonB.stats.attempts).toFixed(1)}
                    numA={seasonA.stats.passingYards / seasonA.stats.attempts}
                    numB={seasonB.stats.passingYards / seasonB.stats.attempts}
                  />
                  <StatRow
                    label="Pass TD"
                    valueA={seasonA.stats.touchdowns}
                    valueB={seasonB.stats.touchdowns}
                    numA={seasonA.stats.touchdowns}
                    numB={seasonB.stats.touchdowns}
                  />
                  <StatRow
                    label="Int"
                    valueA={seasonA.stats.interceptions}
                    valueB={seasonB.stats.interceptions}
                    numA={seasonA.stats.interceptions}
                    numB={seasonB.stats.interceptions}
                    lowerIsBetter
                  />
                  <StatRow
                    label="Rating"
                    valueA={seasonA.stats.passerRating}
                    valueB={seasonB.stats.passerRating}
                    numA={parseFloat(seasonA.stats.passerRating)}
                    numB={parseFloat(seasonB.stats.passerRating)}
                  />
                  <StatRow
                    label="Sacks"
                    valueA={seasonA.stats.sacks}
                    valueB={seasonB.stats.sacks}
                    numA={seasonA.stats.sacks}
                    numB={seasonB.stats.sacks}
                    lowerIsBetter
                  />
                  <StatRow
                    label="Fumbles"
                    valueA={seasonA.stats.fumbles}
                    valueB={seasonB.stats.fumbles}
                    numA={seasonA.stats.fumbles}
                    numB={seasonB.stats.fumbles}
                    lowerIsBetter
                  />
                  <StatRow
                    label="Rush Yds"
                    valueA={seasonA.stats.rushYards}
                    valueB={seasonB.stats.rushYards}
                    numA={seasonA.stats.rushYards}
                    numB={seasonB.stats.rushYards}
                  />
                  <StatRow
                    label="Rush TD"
                    valueA={seasonA.stats.rushTouchdowns}
                    valueB={seasonB.stats.rushTouchdowns}
                    numA={seasonA.stats.rushTouchdowns}
                    numB={seasonB.stats.rushTouchdowns}
                  />
                </tbody>
              </table>
            </div>

            {/* Voting indicator */}
            {!voteResult && voting && (
              <div className="text-center mb-6 text-gray-400">
                Voting...
              </div>
            )}
          </>
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
  numA,
  numB,
  lowerIsBetter = false,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  numA?: number;
  numB?: number;
  lowerIsBetter?: boolean;
}) {
  // Stat-specific thresholds based on ~0.33 IQR from dataset analysis
  const THRESHOLDS: Record<string, number> = {
    'Comp %': 2.0,          // ~0.33 IQR (completion percentage points)
    'Pass Yds': 350,        // ~0.33 IQR (yards)
    'Pass YPA': 0.32,       // ~0.33 IQR (yards per attempt)
    'Pass TD': 3.6,         // ~0.33 IQR (touchdowns)
    'Int': 1.7,             // ~0.33 IQR (interceptions) - lower is better
    'Rating': 5.4,          // ~0.33 IQR (passer rating points)
    'Sacks': 4.3,           // ~0.33 IQR (sacks) - lower is better
    'Fumbles': 1,           // ~0.33 IQR (fumbles) - lower is better
    'Rush Yds': 66,         // ~0.33 IQR (rushing yards)
    'Rush TD': 1,           // ~0.33 IQR (rush touchdowns)
  };

  // Calculate if there's a significant difference
  let colorA = "text-gray-100";
  let colorB = "text-gray-100";

  if (numA !== undefined && numB !== undefined) {
    const diff = Math.abs(numA - numB);
    const threshold = THRESHOLDS[label];

    if (threshold !== undefined && diff >= threshold) {
      if (lowerIsBetter) {
        // For negative stats (Int, Sacks, Fumbles), highlight the HIGHER (worse) value in red
        colorA = numA > numB ? "text-red-400" : "text-gray-100";
        colorB = numB > numA ? "text-red-400" : "text-gray-100";
      } else {
        // For positive stats, highlight the HIGHER (better) value in green
        colorA = numA > numB ? "text-green-400" : "text-gray-100";
        colorB = numB > numA ? "text-green-400" : "text-gray-100";
      }
    }
  }

  return (
    <tr className="hover:bg-gray-750">
      <td className={`px-6 py-3 text-right font-semibold ${colorA}`}>
        {valueA}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-400 bg-gray-700">
        {label}
      </td>
      <td className={`px-6 py-3 text-left font-semibold ${colorB}`}>
        {valueB}
      </td>
    </tr>
  );
}
