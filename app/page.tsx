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
              className="font-semibold px-6 py-2 rounded-md bg-blue-700 text-white"
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
            {/* Comparison Table */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-700 max-w-3xl mx-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      className={`px-6 py-4 text-right text-sm font-semibold w-[40%] ${
                        !voteResult ? 'cursor-pointer hover:bg-blue-700 hover:shadow-lg transition-all text-gray-200' : ''
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
                        <div className="text-2xl font-bold text-white flex items-center justify-end gap-3">
                          <svg className="w-6 h-6" viewBox="0 0 504.012 504.012" fill="currentColor">
                            <path d="M492.288,303.196H364.076c-5.78-19.692-11.436-37.344-15.924-51.752c14.716-19.336,39.584-29.596,74.024-29.596
                              c1.18,0,2.288-0.748,3.044-1.652c0.748-0.916,1.052-2.22,0.816-3.372c-1.344-6.84-3.116-13.716-5.164-20.488
                              c4.868-3.056,6.944-9.288,4.584-14.712c-1.876-4.32-6.128-7.124-10.844-7.124c-0.52,0-1.028,0.084-1.544,0.152
                              c-33.816-79.756-111.124-131.108-198-131.108C96.476,43.544,0,140.016,0,258.612c0,62.448,27.104,121.732,74.356,162.644
                              c0.996,0.86,2.352,1.164,3.62,0.82c2.768-0.756,5.524-1.4,8.276-1.988c1.512-0.316,3.032-0.588,4.544-0.86
                              c1.084-0.196,2.172-0.384,3.248-0.56c2.04-0.308,4.084-0.596,6.132-0.816c0.332-0.036,0.664-0.068,0.992-0.1
                              c9.844-1.004,19.824-0.984,29.908,0.072c0.292,0.032,0.584,0.068,0.876,0.096c6.848,0.752,13.752,2.016,20.7,3.716
                              c1.204,0.3,2.404,0.584,3.604,0.908c1.724,0.46,3.448,0.956,5.176,1.476c1.78,0.54,3.572,1.116,5.352,1.72
                              c1.332,0.444,2.656,0.86,3.988,1.336c3.06,1.1,6.128,2.292,9.208,3.576c1.04,0.428,2.076,0.9,3.112,1.352
                              c2.408,1.044,4.82,2.136,7.236,3.288c1.016,0.484,2.028,0.968,3.044,1.468c3.316,1.648,6.64,3.36,9.964,5.208
                              c11.068,6.14,21.98,10.752,32.656,13.828c10.732,3.108,21.168,4.672,31.096,4.672c11.5,0,22.3-2.144,32.136-6.336
                              c0.288-0.124,0.576-0.248,0.86-0.376c1.924-0.848,3.808-1.772,5.648-2.78c0.452-0.248,0.92-0.472,1.376-0.732
                              c1.784-1.032,3.54-2.128,5.24-3.312c0.156-0.108,0.292-0.228,0.436-0.332c0.524-0.376,1.024-0.768,1.54-1.152
                              c1.508-1.14,2.96-2.324,4.356-3.564c0.356-0.312,0.716-0.616,1.06-0.94c1.512-1.408,2.916-2.9,4.276-4.424
                              c0.272-0.308,0.592-0.58,0.864-0.9c0.216-0.248,0.388-0.528,0.6-0.776c1.12-1.356,2.2-2.752,3.204-4.188
                              c0.484-0.692,0.924-1.408,1.38-2.116c0.656-1.012,1.272-2.04,1.868-3.084c0.4-0.708,0.812-1.408,1.188-2.12
                              c0.82-1.592,1.572-3.22,2.26-4.872c0.26-0.628,0.496-1.268,0.74-1.912c0.556-1.46,1.064-2.936,1.508-4.432
                              c0.132-0.44,0.28-0.872,0.404-1.308c0.532-1.916,0.952-3.864,1.304-5.832c0.084-0.476,0.16-0.956,0.24-1.436
                              c0.296-1.936,0.54-3.884,0.668-5.856c0.012-0.128,0.028-0.252,0.036-0.38c0.116-2.08,0.112-4.176,0.044-6.284
                              c-0.02-0.484-0.044-0.968-0.072-1.456c-0.124-2.104-0.316-3.4-0.64-5.52c-0.488-3.16-1.12-6.016-1.816-9.952h24.084
                              c0.716,0,1.404,4.376,2.056,6.356c16.464,50.188,54.744,68.468,76.456,68.468H492.3c6.512,0,11.712-7.084,11.712-13.6V313.264
                              C504,306.752,498.8,303.196,492.288,303.196z M331.464,303.86c0.36-7.016,1.18-13.588,2.416-19.716
                              c2.664,8.504,5.472,17.444,8.296,26.424L331.464,303.86z M333.98,350.452c-0.812-7.876-1.452-12.288-1.9-17.5l21.092,13.636
                              l1.1,3.864H333.98z M480.368,425.28h-39.984c-14.128,0-41.032-15.752-53.652-51.196h93.636V425.28z M480.368,350.452H379.08
                              c-2.38-7.876-4.924-15.752-7.548-23.628h108.836V350.452z"/>
                          </svg>
                          A
                        </div>
                      )}
                      <div className="text-sm font-normal text-gray-400 mt-1">
                        {seasonA.year}
                        {voteResult && ` • ${seasonA.team}`}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-200 w-[20%]">
                      {voteResult && (
                        <button
                          onClick={handleNextMatchup}
                          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm sm:px-6"
                        >
                          <span className="hidden sm:inline">Next →</span>
                          <span className="sm:hidden">→</span>
                        </button>
                      )}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold w-[40%] ${
                        !voteResult ? 'cursor-pointer hover:bg-blue-700 hover:shadow-lg transition-all text-gray-200' : ''
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
                        <div className="text-2xl font-bold text-white flex items-center justify-start gap-3">
                          B
                          <svg className="w-6 h-6 scale-x-[-1]" viewBox="0 0 504.012 504.012" fill="currentColor">
                            <path d="M492.288,303.196H364.076c-5.78-19.692-11.436-37.344-15.924-51.752c14.716-19.336,39.584-29.596,74.024-29.596
                              c1.18,0,2.288-0.748,3.044-1.652c0.748-0.916,1.052-2.22,0.816-3.372c-1.344-6.84-3.116-13.716-5.164-20.488
                              c4.868-3.056,6.944-9.288,4.584-14.712c-1.876-4.32-6.128-7.124-10.844-7.124c-0.52,0-1.028,0.084-1.544,0.152
                              c-33.816-79.756-111.124-131.108-198-131.108C96.476,43.544,0,140.016,0,258.612c0,62.448,27.104,121.732,74.356,162.644
                              c0.996,0.86,2.352,1.164,3.62,0.82c2.768-0.756,5.524-1.4,8.276-1.988c1.512-0.316,3.032-0.588,4.544-0.86
                              c1.084-0.196,2.172-0.384,3.248-0.56c2.04-0.308,4.084-0.596,6.132-0.816c0.332-0.036,0.664-0.068,0.992-0.1
                              c9.844-1.004,19.824-0.984,29.908,0.072c0.292,0.032,0.584,0.068,0.876,0.096c6.848,0.752,13.752,2.016,20.7,3.716
                              c1.204,0.3,2.404,0.584,3.604,0.908c1.724,0.46,3.448,0.956,5.176,1.476c1.78,0.54,3.572,1.116,5.352,1.72
                              c1.332,0.444,2.656,0.86,3.988,1.336c3.06,1.1,6.128,2.292,9.208,3.576c1.04,0.428,2.076,0.9,3.112,1.352
                              c2.408,1.044,4.82,2.136,7.236,3.288c1.016,0.484,2.028,0.968,3.044,1.468c3.316,1.648,6.64,3.36,9.964,5.208
                              c11.068,6.14,21.98,10.752,32.656,13.828c10.732,3.108,21.168,4.672,31.096,4.672c11.5,0,22.3-2.144,32.136-6.336
                              c0.288-0.124,0.576-0.248,0.86-0.376c1.924-0.848,3.808-1.772,5.648-2.78c0.452-0.248,0.92-0.472,1.376-0.732
                              c1.784-1.032,3.54-2.128,5.24-3.312c0.156-0.108,0.292-0.228,0.436-0.332c0.524-0.376,1.024-0.768,1.54-1.152
                              c1.508-1.14,2.96-2.324,4.356-3.564c0.356-0.312,0.716-0.616,1.06-0.94c1.512-1.408,2.916-2.9,4.276-4.424
                              c0.272-0.308,0.592-0.58,0.864-0.9c0.216-0.248,0.388-0.528,0.6-0.776c1.12-1.356,2.2-2.752,3.204-4.188
                              c0.484-0.692,0.924-1.408,1.38-2.116c0.656-1.012,1.272-2.04,1.868-3.084c0.4-0.708,0.812-1.408,1.188-2.12
                              c0.82-1.592,1.572-3.22,2.26-4.872c0.26-0.628,0.496-1.268,0.74-1.912c0.556-1.46,1.064-2.936,1.508-4.432
                              c0.132-0.44,0.28-0.872,0.404-1.308c0.532-1.916,0.952-3.864,1.304-5.832c0.084-0.476,0.16-0.956,0.24-1.436
                              c0.296-1.936,0.54-3.884,0.668-5.856c0.012-0.128,0.028-0.252,0.036-0.38c0.116-2.08,0.112-4.176,0.044-6.284
                              c-0.02-0.484-0.044-0.968-0.072-1.456c-0.124-2.104-0.316-3.4-0.64-5.52c-0.488-3.16-1.12-6.016-1.816-9.952h24.084
                              c0.716,0,1.404,4.376,2.056,6.356c16.464,50.188,54.744,68.468,76.456,68.468H492.3c6.512,0,11.712-7.084,11.712-13.6V313.264
                              C504,306.752,498.8,303.196,492.288,303.196z M331.464,303.86c0.36-7.016,1.18-13.588,2.416-19.716
                              c2.664,8.504,5.472,17.444,8.296,26.424L331.464,303.86z M333.98,350.452c-0.812-7.876-1.452-12.288-1.9-17.5l21.092,13.636
                              l1.1,3.864H333.98z M480.368,425.28h-39.984c-14.128,0-41.032-15.752-53.652-51.196h93.636V425.28z M480.368,350.452H379.08
                              c-2.38-7.876-4.924-15.752-7.548-23.628h108.836V350.452z"/>
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
