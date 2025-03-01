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
  // We'll store stats for passing, rushing, receiving, tackles, and interceptions
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    tackles: [],
    interceptions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch passing stats
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
        setPlayerStats(prev => ({ ...prev, passing: aggregatedPassing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) console.log("Passing stats fetch aborted");
        else {
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

  // Fetch rushing stats
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
        setPlayerStats(prev => ({ ...prev, rushing: aggregatedRushing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) console.log("Rushing stats fetch aborted");
        else {
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

  // Fetch receiving stats
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
        setPlayerStats(prev => ({ ...prev, receiving: aggregatedReceiving.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) console.log("Receiving stats fetch aborted");
        else {
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

  // Fetch tackles stats
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
        const aggregatedTackles = aggregatePlayerStats(tacklesData, "TACKLES");
        setPlayerStats(prev => ({ ...prev, tackles: aggregatedTackles.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) console.log("Tackles stats fetch aborted");
        else {
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

  // Fetch interceptions stats
  useEffect(() => {
    const controller = new AbortController();
    const fetchInterceptionsStats = async () => {
      try {
        setLoading(true);
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
        if (controller.signal.aborted) console.log("Interceptions stats fetch aborted");
        else {
          console.error("Error fetching interceptions stats:", error);
          setError("Failed to load player season stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInterceptionsStats();
    return () => controller.abort();
  }, []);

  return (
    <div className="stats-container">
      {/* Inline CSS for a glassy, modern look */}
      <style>{`
        .stats-container {
          font-family: "Helvetica Neue", Arial, sans-serif;
          margin: 2rem;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 1rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 30px rgba(0,0,0,0.1);
        }
        h1, h2 {
          text-align: center;
          margin: 0.5rem 0;
        }
        #table-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 2rem;
        }
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        th {
          background: rgba(255, 255, 255, 0.3);
          font-weight: 600;
        }
        tr:nth-child(even) {
          background: rgba(255, 255, 255, 0.1);
        }
        .leader-row {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stats-player-logo {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 0.75rem;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
        .leader-name {
          flex: 1;
        }
        .leader-stat {
          font-weight: bold;
          margin-left: 0.5rem;
        }
        .view-all-btn {
          display: block;
          width: 100%;
          padding: 0.75rem;
          margin-top: 1rem;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .view-all-btn:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          max-width: 800px;
          width: 90%;
          color: #fff;
        }
        .modal-content h2 {
          margin-top: 0;
          text-align: center;
        }
        .modal-content table {
          width: 100%;
          margin-top: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>

      <h1>Top 10 Leaders (Yards) - 2024</h1>
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading...</p>
      ) : error ? (
        <p style={{ textAlign: "center" }}>{error}</p>
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
                  <td>
                    {player.playerPhoto && (
                      <img
                        src={player.playerPhoto}
                        alt={player.playerName}
                        className="stats-player-logo"
                      />
                    )}
                    {player.playerName}
                  </td>
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
                  <td>
                    {player.playerPhoto && (
                      <img
                        src={player.playerPhoto}
                        alt={player.playerName}
                        className="stats-player-logo"
                      />
                    )}
                    {player.playerName}
                  </td>
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
                  <td>
                    {player.playerPhoto && (
                      <img
                        src={player.playerPhoto}
                        alt={player.playerName}
                        className="stats-player-logo"
                      />
                    )}
                    {player.playerName}
                  </td>
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
                  <td>
                    {player.playerPhoto && (
                      <img
                        src={player.playerPhoto}
                        alt={player.playerName}
                        className="stats-player-logo"
                      />
                    )}
                    {player.playerName}
                  </td>
                  <td>{player.statValue}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Interceptions Leaders</h2>
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
                  <td>
                    {player.playerPhoto && (
                      <img
                        src={player.playerPhoto}
                        alt={player.playerName}
                        className="stats-player-logo"
                      />
                    )}
                    {player.playerName}
                  </td>
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