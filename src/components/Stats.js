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
  // We'll store stats for passing, rushing, receiving, and tackles
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    tackles: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch player season stats for passing with cancellation support
  useEffect(() => {
    const controller = new AbortController();
    const fetchPassingStats = async () => {
      try {
        setLoading(true);
        const passingData = await teamsService.getPlayerSeasonStats(
          2024,
          "passing",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw passing data:", passingData);
        const aggregatedPassing = aggregatePlayerStats(passingData, "YDS");
        console.log("Aggregated passing stats:", aggregatedPassing);
        setPlayerStats(prev => ({ ...prev, passing: aggregatedPassing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Passing stats fetch aborted");
        } else {
          console.error("Error fetching passing stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPassingStats();
    return () => controller.abort();
  }, []);

  // Fetch player season stats for rushing with cancellation support
  useEffect(() => {
    const controller = new AbortController();
    const fetchRushingStats = async () => {
      try {
        setLoading(true);
        const rushingData = await teamsService.getPlayerSeasonStats(
          2024,
          "rushing",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw rushing data:", rushingData);
        const aggregatedRushing = aggregatePlayerStats(rushingData, "YDS");
        console.log("Aggregated rushing stats:", aggregatedRushing);
        setPlayerStats(prev => ({ ...prev, rushing: aggregatedRushing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Rushing stats fetch aborted");
        } else {
          console.error("Error fetching rushing stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRushingStats();
    return () => controller.abort();
  }, []);

  // Fetch player season stats for receiving with cancellation support
  useEffect(() => {
    const controller = new AbortController();
    const fetchReceivingStats = async () => {
      try {
        setLoading(true);
        const receivingData = await teamsService.getPlayerSeasonStats(
          2024,
          "receiving",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw receiving data:", receivingData);
        const aggregatedReceiving = aggregatePlayerStats(receivingData, "YDS");
        console.log("Aggregated receiving stats:", aggregatedReceiving);
        setPlayerStats(prev => ({ ...prev, receiving: aggregatedReceiving.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Receiving stats fetch aborted");
        } else {
          console.error("Error fetching receiving stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReceivingStats();
    return () => controller.abort();
  }, []);

  // Fetch player season stats for defensive tackles with cancellation support
  useEffect(() => {
    const controller = new AbortController();
    const fetchTacklesStats = async () => {
      try {
        setLoading(true);
        const tacklesData = await teamsService.getPlayerSeasonStats(
          2024,
          "tackles",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw tackles data:", tacklesData);
        // Assuming the API returns the stat type for tackles as "TACKLES"
        const aggregatedTackles = aggregatePlayerStats(tacklesData, "TACKLES");
        console.log("Aggregated tackles stats:", aggregatedTackles);
        setPlayerStats(prev => ({ ...prev, tackles: aggregatedTackles.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Tackles stats fetch aborted");
        } else {
          console.error("Error fetching tackles stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTacklesStats();
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
        h1, h2 {
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

      <h1>Top 10 Leaders (Yards) - 2024</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div id="table-container">
          <h2>Passing Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Passing Yards</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.passing.map((player, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{player.playerName}</td>
                  <td>{player.statValue}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Rushing Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Rushing Yards</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.rushing.map((player, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{player.playerName}</td>
                  <td>{player.statValue}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Receiving Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Receiving Yards</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.receiving.map((player, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{player.playerName}</td>
                  <td>{player.statValue}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Defensive Tackles Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Tackles</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.tackles.map((player, index) => (
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