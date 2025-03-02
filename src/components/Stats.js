import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  console.log(`aggregatePlayerStats - raw data for ${desiredStatType}:`, rawData);

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

  aggregated.sort((a, b) => b.statValue - a.statValue);

  console.log(`aggregatePlayerStats - aggregated for ${desiredStatType}:`, aggregated);
  return aggregated;
};

const SacksStats = () => {
  const [sacks, setSacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSacksStats = async () => {
      try {
        setLoading(true);
        const sacksData = await teamsService.getPlayerSeasonStats(
          2024,
          "sacks", // Passing "sacks" so teamsService converts it to "defensive"
          "regular",
          100,
          controller.signal
        );
        console.log("Raw sacks data:", sacksData);
        const aggregatedSacks = aggregatePlayerStats(sacksData, "SACKS");
        setSacks(aggregatedSacks.slice(0, 10));
      } catch (error) {
        if (controller.signal.aborted)
          console.log("Sacks stats fetch aborted");
        else {
          console.error("Error fetching sacks stats:", error);
          setError("Failed to load sacks stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSacksStats();
    return () => controller.abort();
  }, []);

  return (
    <div className="stats-container">
      {/* Updated Modern CSS */}
      <style>{`
        :root {
          --background-color: #ffffff;
          --text-color: #000000;
          --navbar-bg: #d4001c;
          --card-background: #f9f9f9;
          --border-color: #ddd;
          --shadow-color: rgba(0, 0, 0, 0.08);
        }
        .stats-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 2rem;
          background: var(--background-color);
          color: var(--text-color);
        }
        h1, h2 {
          text-align: center;
          margin: 1rem 0;
        }
        #table-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          gap: 2rem;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: var(--card-background);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px var(--shadow-color);
        }
        th, td {
          padding: 0.75rem 1rem;
          text-align: left;
        }
        thead {
          background: var(--navbar-bg);
          color: var(--background-color);
        }
        tbody tr {
          border-bottom: 1px solid var(--border-color);
        }
        tbody tr:last-child {
          border-bottom: none;
        }
      `}</style>
      <h1>Top 10 Sacks Leaders - 2024</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div id="table-container">
          <section>
            <h2>Sacks Leaders</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Sacks</th>
                </tr>
              </thead>
              <tbody>
                {sacks.length ? (
                  sacks.map((player, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{player.playerName}</td>
                      <td>{player.statValue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
};

export default SacksStats;