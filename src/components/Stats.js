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

const Stats = () => {
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    interceptions: []
  });

  // Separate loading states for each category:
  const [loadingPassing, setLoadingPassing] = useState(true);
  const [loadingRushing, setLoadingRushing] = useState(true);
  const [loadingReceiving, setLoadingReceiving] = useState(true);
  const [loadingInterceptions, setLoadingInterceptions] = useState(true);

  const [error, setError] = useState(null);

  // Fetch Passing Stats
  useEffect(() => {
    const controller = new AbortController();
    const fetchPassingStats = async () => {
      try {
        setLoadingPassing(true);
        const passingData = await teamsService.getPlayerSeasonStats(
          2024,
          "passing",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw passing data:", passingData);
        const aggregatedPassing = aggregatePlayerStats(passingData, "YDS");
        setPlayerStats(prev => ({ ...prev, passing: aggregatedPassing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted)
          console.log("Passing stats fetch aborted");
        else {
          console.error("Error fetching passing stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoadingPassing(false);
      }
    };
    fetchPassingStats();
    return () => controller.abort();
  }, []);

  // Fetch Rushing Stats
  useEffect(() => {
    const controller = new AbortController();
    const fetchRushingStats = async () => {
      try {
        setLoadingRushing(true);
        const rushingData = await teamsService.getPlayerSeasonStats(
          2024,
          "rushing",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw rushing data:", rushingData);
        const aggregatedRushing = aggregatePlayerStats(rushingData, "YDS");
        setPlayerStats(prev => ({ ...prev, rushing: aggregatedRushing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted)
          console.log("Rushing stats fetch aborted");
        else {
          console.error("Error fetching rushing stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoadingRushing(false);
      }
    };
    fetchRushingStats();
    return () => controller.abort();
  }, []);

  // Fetch Receiving Stats
  useEffect(() => {
    const controller = new AbortController();
    const fetchReceivingStats = async () => {
      try {
        setLoadingReceiving(true);
        const receivingData = await teamsService.getPlayerSeasonStats(
          2024,
          "receiving",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw receiving data:", receivingData);
        const aggregatedReceiving = aggregatePlayerStats(receivingData, "YDS");
        setPlayerStats(prev => ({ ...prev, receiving: aggregatedReceiving.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted)
          console.log("Receiving stats fetch aborted");
        else {
          console.error("Error fetching receiving stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoadingReceiving(false);
      }
    };
    fetchReceivingStats();
    return () => controller.abort();
  }, []);

  // Fetch Interceptions Stats
  useEffect(() => {
    const controller = new AbortController();
    const fetchInterceptionsStats = async () => {
      try {
        setLoadingInterceptions(true);
        const interceptionsData = await teamsService.getPlayerSeasonStats(
          2024,
          "interceptions",
          "regular",
          100,
          controller.signal
        );
        console.log("Raw interceptions data:", interceptionsData);
        const aggregatedInterceptions = aggregatePlayerStats(interceptionsData, "INT");
        setPlayerStats(prev => ({ ...prev, interceptions: aggregatedInterceptions.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted)
          console.log("Interceptions stats fetch aborted");
        else {
          console.error("Error fetching interceptions stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoadingInterceptions(false);
      }
    };
    fetchInterceptionsStats();
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
      <h1>Top 10 Leaders (Yards) - 2024</h1>
      {error && <p>{error}</p>}
      <div id="table-container">
        <section>
          <h2>Passing Leaders</h2>
          {loadingPassing ? (
            <p>Loading passing stats...</p>
          ) : (
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
          )}
        </section>

        <section>
          <h2>Rushing Leaders</h2>
          {loadingRushing ? (
            <p>Loading rushing stats...</p>
          ) : (
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
          )}
        </section>

        <section>
          <h2>Receiving Leaders</h2>
          {loadingReceiving ? (
            <p>Loading receiving stats...</p>
          ) : (
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
          )}
        </section>

        <section>
          <h2>Interceptions Leaders</h2>
          {loadingInterceptions ? (
            <p>Loading interceptions stats...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Interceptions</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.interceptions.map((player, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{player.playerName}</td>
                    <td>{player.statValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default Stats;