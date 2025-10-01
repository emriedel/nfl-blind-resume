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

export default function StandingsPage() {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  useEffect(() => {
    fetchStandings();
  }, [selectedYear, selectedTeam]);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedTeam) params.append("team", selectedTeam);

      const response = await fetch(`/api/standings?${params.toString()}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch standings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading standings...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              QB Season Rankings
            </h1>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              ← Back to Voting
            </Link>
          </div>
          <p className="text-gray-600">
            All QB seasons ranked by ELO rating based on crowd-sourced votes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">All Years</option>
              {data.filters.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
            >
              <option value="">All Teams</option>
              {data.filters.teams.map((team) => (
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
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing {data.standings.length} of {data.total} seasons
        </div>

        {/* Standings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ELO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    INT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.standings.map((standing, index) => (
                  <tr
                    key={standing.id}
                    className={index < 3 ? "bg-yellow-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-lg font-bold ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                              ? "text-gray-400"
                              : index === 2
                              ? "text-orange-600"
                              : "text-gray-900"
                          }`}
                        >
                          {standing.rank}
                          {index === 0 && " 🥇"}
                          {index === 1 && " 🥈"}
                          {index === 2 && " 🥉"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {standing.playerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standing.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standing.team}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600">
                        {standing.eloScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.voteCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standing.stats.passingYards.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standing.stats.touchdowns}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standing.stats.interceptions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standing.stats.passerRating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
