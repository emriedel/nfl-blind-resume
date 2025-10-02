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

export default function LeaderboardPage() {
  const router = useRouter();
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    fetchStandings();
  }, [selectedYear, selectedTeam, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedTeam]);

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

  return (
    <main className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Quarterback Blind Resume
          </h1>
          <p className="text-gray-400 mb-4">
            All QB seasons ranked by ELO rating based on crowd-sourced votes
          </p>

          {/* Toggle between Voting and Leaderboard */}
          <div className="flex justify-center gap-2 bg-gray-800 p-1 rounded-lg inline-flex border border-gray-700">
            <button
              onClick={() => router.push("/")}
              className="font-semibold px-6 py-2 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              Vote
            </button>
            <button
              className="font-semibold px-6 py-2 rounded-md bg-blue-600 text-white"
            >
              Leaderboard
            </button>
          </div>
        </div>

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
      </div>
    </main>
  );
}
