import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

// Modified aggregator to include the player's team property
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
      team: item.team, // include team name for logo lookup
      statValue: parseFloat(item.stat),
      playerPhoto: item.playerPhoto || null,
    }));

  // Sort in descending order
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

  // We'll fetch and store teams for logo lookup
  const [teams, setTeams] = useState([]);

  // Separate loading states for each category:
  const [loadingPassing, setLoadingPassing] = useState(true);
  const [loadingRushing, setLoadingRushing] = useState(true);
  const [loadingReceiving, setLoadingReceiving] = useState(true);
  const [loadingInterceptions, setLoadingInterceptions] = useState(true);

  // Single error state for demonstration (you could split per category if needed)
  const [error, setError] = useState(null);

  // Fetch the FBS teams to enable logo lookups
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams(); // Ensure this fetches only FBS teams or filter them
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // Helper to get a team's logo
  const getTeamLogo = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    // If not found or no logos, fall back to a default
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

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
        const aggregatedPassing = aggregatePlayerStats(passingData, "YDS");
        setPlayerStats(prev => ({ ...prev, passing: aggregatedPassing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Passing stats fetch aborted");
        } else {
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
        const aggregatedRushing = aggregatePlayerStats(rushingData, "YDS");
        setPlayerStats(prev => ({ ...prev, rushing: aggregatedRushing.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Rushing stats fetch aborted");
        } else {
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
        const aggregatedReceiving = aggregatePlayerStats(receivingData, "YDS");
        setPlayerStats(prev => ({ ...prev, receiving: aggregatedReceiving.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Receiving stats fetch aborted");
        } else {
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
        const aggregatedInterceptions = aggregatePlayerStats(interceptionsData, "INT");
        setPlayerStats(prev => ({ ...prev, interceptions: aggregatedInterceptions.slice(0, 10) }));
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Interceptions stats fetch aborted");
        } else {
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
      {/* Inline CSS or your main CSS file */}
      <style>{`
        :root {
          --background-color: #ffffff;
          --text-color: #000000;
          --navbar-bg: #d4001c;
          --card-background: #f9f9f9;
          --border-color: #ddd;
          --shadow-color: rgba(0, 0, 0, 0.08);
          --primary-font: 'Roboto', sans-serif;
        }
        .stats-container {
          font-family: var(--primary-font);
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
          color: #ffffff;
        }
        tbody tr {
          border-bottom: 1px solid var(--border-color);
          transition: background 0.3s ease;
        }
        tbody tr:hover {
          background: #f1f1f1;
        }
        .logo-img {
          width: 30px;
          height: 30px;
          object-fit: contain;
          margin-right: 8px;
          vertical-align: middle;
        }
      `}</style>

      <h1>Top 10 Leaders (Yards) - 2024</h1>
      {error && <p>{error}</p>}
      <div id="table-container">

        {/* Passing Leaders */}
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
                    <td>
                      {/* If you later store the player's team in aggregator, you can show the logo here */}
                      {player.playerName}
                    </td>
                    <td>{player.statValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Rushing Leaders */}
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

        {/* Receiving Leaders */}
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

        {/* Interceptions Leaders */}
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