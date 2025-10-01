"use client";

import { useState, useEffect } from "react";

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

interface Standing {
  rank: number;
  id: number;
  playerName: string;
  year: number;
  team: string;
  eloScore: number;
  voteCount: number;
  stats: Stats;
  record: string | null;
}

interface StandingsData {
  standings: Standing[];
  total: number;
  filters: {
    years: number[];
    teams: string[];
  };
}

type View = "vote" | "leaderboard";

export default function Home() {
  const [view, setView] = useState<View>("vote");
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  // Leaderboard state
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    fetchMatchup();
  }, []);

  useEffect(() => {
    if (view === "leaderboard") {
      fetchStandings();
    }
  }, [view, selectedYear, selectedTeam, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedTeam]);

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

  const fetchStandings = async () => {
    setStandingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedTeam) params.append("team", selectedTeam);
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const response = await fetch(`/api/standings?${params.toString()}`);
      const result = await response.json();
      setStandingsData(result);
    } catch (error) {
      console.error("Failed to fetch standings:", error);
    } finally {
      setStandingsLoading(false);
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
      <div className={view === "vote" ? "max-w-4xl mx-auto" : "max-w-7xl mx-auto"}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Quarterback Blind Resume
          </h1>
          <p className="text-gray-400 mb-4">
            {view === "vote"
              ? "Which quarterback season was better? Vote based on stats alone."
              : "All QB seasons ranked by ELO rating based on crowd-sourced votes"}
          </p>

          {/* Toggle between Voting and Leaderboard */}
          <div className="flex justify-center gap-2 bg-gray-800 p-1 rounded-lg inline-flex border border-gray-700">
            <button
              onClick={() => setView("vote")}
              className={`font-semibold px-6 py-2 rounded-md transition-colors ${
                view === "vote"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Vote
            </button>
            <button
              onClick={() => setView("leaderboard")}
              className={`font-semibold px-6 py-2 rounded-md transition-colors ${
                view === "leaderboard"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Vote View */}
        {view === "vote" && (
          <>
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
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th
                          className={`px-6 py-4 text-right text-sm font-semibold text-gray-200 ${
                            !voteResult ? 'cursor-pointer hover:bg-blue-600 hover:shadow-lg transition-all' : ''
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
                        <th className="px-4 py-4 text-center text-sm font-semibold text-gray-200 w-32">

                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold text-gray-200 ${
                            !voteResult ? 'cursor-pointer hover:bg-blue-600 hover:shadow-lg transition-all' : ''
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

                {/* Winner Badge */}
                {voteResult && (
                  <div className="text-center mb-6">
                    <div className="inline-block bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg">
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
              </>
            )}
          </>
        )}

        {/* Leaderboard View */}
        {view === "leaderboard" && (
          <>
            {standingsLoading && !standingsData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-xl text-gray-400">Loading standings...</div>
              </div>
            ) : standingsData ? (
              <>
                {/* Filters */}
                <div className="bg-gray-800 rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 border border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Filter by Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="border border-gray-600 bg-gray-700 text-white rounded-lg px-4 py-2"
                    >
                      <option value="">All Years</option>
                      {standingsData.filters.years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Filter by Team
                    </label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="border border-gray-600 bg-gray-700 text-white rounded-lg px-4 py-2"
                    >
                      <option value="">All Teams</option>
                      {standingsData.filters.teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(selectedYear || selectedTeam) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSelectedYear("");
                          setSelectedTeam("");
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Results Count and Pagination Info */}
                <div className="mb-4 flex justify-between items-center">
                  <div className="text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, standingsData.total)} of {standingsData.total}{" "}
                    seasons
                  </div>
                  <div className="text-gray-400">
                    Page {currentPage} of {Math.ceil(standingsData.total / itemsPerPage)}
                  </div>
                </div>

                {/* Standings Table */}
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Player
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Team
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            ELO
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            G
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Cmp%
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Yds
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            YPA
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            TD
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            INT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Rating
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Sacks
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Fum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Rush Yds
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Rush TD
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {standingsData.standings.map((standing, index) => (
                          <tr
                            key={standing.id}
                            className={index < 3 ? "bg-gray-750 hover:bg-gray-700" : "hover:bg-gray-750"}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span
                                  className={`text-lg font-bold ${
                                    index === 0
                                      ? "text-yellow-400"
                                      : index === 1
                                      ? "text-gray-300"
                                      : index === 2
                                      ? "text-orange-400"
                                      : "text-gray-100"
                                  }`}
                                >
                                  {standing.rank}
                                  {index === 0 && " 🥇"}
                                  {index === 1 && " 🥈"}
                                  {index === 2 && " 🥉"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-100">
                                {standing.playerName}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.year}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.team}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-blue-400">
                                {standing.eloScore}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.gamesPlayed}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.completionPct}%
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.passingYards.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.passYPA}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.touchdowns}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.interceptions}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.passerRating}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.sacks}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.fumbles}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.rushYards}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {standing.stats.rushTouchdowns}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {standingsData.total > itemsPerPage && (
                  <div className="mt-6 flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === 1
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                      }`}
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Show first page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 rounded-lg font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                          >
                            1
                          </button>
                          {currentPage > 4 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                        </>
                      )}

                      {/* Show pages around current page */}
                      {Array.from(
                        { length: Math.ceil(standingsData.total / itemsPerPage) },
                        (_, i) => i + 1
                      )
                        .filter(
                          (page) =>
                            page === currentPage ||
                            page === currentPage - 1 ||
                            page === currentPage + 1 ||
                            page === currentPage - 2 ||
                            page === currentPage + 2
                        )
                        .filter(
                          (page) =>
                            page > 0 && page <= Math.ceil(standingsData.total / itemsPerPage)
                        )
                        .map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg font-medium ${
                              page === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                      {/* Show last page */}
                      {currentPage < Math.ceil(standingsData.total / itemsPerPage) - 2 && (
                        <>
                          {currentPage < Math.ceil(standingsData.total / itemsPerPage) - 3 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() =>
                              setCurrentPage(Math.ceil(standingsData.total / itemsPerPage))
                            }
                            className="px-3 py-2 rounded-lg font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                          >
                            {Math.ceil(standingsData.total / itemsPerPage)}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(Math.ceil(standingsData.total / itemsPerPage), prev + 1)
                        )
                      }
                      disabled={currentPage === Math.ceil(standingsData.total / itemsPerPage)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === Math.ceil(standingsData.total / itemsPerPage)
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : null}
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
  // Calculate if there's a significant difference (>15%)
  let highlightA = false;
  let highlightB = false;

  if (numA !== undefined && numB !== undefined && numA !== 0 && numB !== 0) {
    const percentDiff = Math.abs((numA - numB) / Math.max(numA, numB));

    if (percentDiff > 0.15) {
      if (lowerIsBetter) {
        highlightA = numA < numB;
        highlightB = numB < numA;
      } else {
        highlightA = numA > numB;
        highlightB = numB > numA;
      }
    }
  }

  return (
    <tr className="hover:bg-gray-750">
      <td className={`px-6 py-3 text-right font-semibold ${
        highlightA ? "text-green-400" : "text-gray-100"
      }`}>
        {valueA}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-400 bg-gray-700">
        {label}
      </td>
      <td className={`px-6 py-3 text-left font-semibold ${
        highlightB ? "text-green-400" : "text-gray-100"
      }`}>
        {valueB}
      </td>
    </tr>
  );
}
