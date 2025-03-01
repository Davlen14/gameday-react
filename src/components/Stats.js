import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  console.log(`aggregatePlayerStats - raw data for ${desiredStatType}:`, rawData);

  // Only include records where statType equals desiredStatType exactly (case-insensitive)
  const aggregated = rawData
    .filter(item =>
      item.statType &&
      item.statType.trim().toUpperCase() === desiredStatType.toUpperCase()
    )
    .map(item => ({
      playerName: item.player,
      statValue: parseFloat(item.stat),
      playerPhoto: item.playerPhoto || null,
    }));

  // Sort the aggregated data in descending order by statValue
  aggregated.sort((a, b) => b.statValue - a.statValue);

  console.log(`aggregatePlayerStats - aggregated for ${desiredStatType}:`, aggregated);
  return aggregated;
};

const Stats = () => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch player season stats for passing with cancellation support
  useEffect(() => {
    const controller = new AbortController();
    const fetchPlayerPassingStats = async () => {
      try {
        setLoading(true);
        const passingData = await teamsService.getPlayerSeasonStats(
          2024,
          "passing",
          "regular",
          100,
          controller.signal // Ensure teamsService supports this signal
        );
        console.log("Raw passing data:", passingData);
        const aggregated = aggregatePlayerStats(passingData, "YDS");
        console.log("Aggregated passing stats:", aggregated);
        // Only keep the top 10 records
        setPlayerStats(aggregated.slice(0, 10));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Player stats fetch aborted");
        } else {
          console.error("Error fetching player season passing stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPlayerPassingStats();
    return () => controller.abort();
  }, []);

  return (
    <div className="stats-container">
      {/* Inline CSS */}
      <style>{`
        .stats-container {
          font-family: Arial, sans-serif;
          margin: 2rem;
          background: #f5f5f5;
          color: #333;
        }
        h1 {
          text-align: center;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 1rem;
          background: #fff;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 0.75rem;
          text-align: left;
        }
        th {
          background: #e0e0e0;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        #table-container {
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>

      <h1>Top 10 Passing Leaders (Yards) - 2024</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div id="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Yards</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((player, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{player.playerName}</td>
                  <td>{player.statValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Stats;