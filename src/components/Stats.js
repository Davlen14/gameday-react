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
  // We'll store stats for passing, rushing, receiving, and interceptions for players
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    interceptions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We'll also store team stats for passing, rushing, and receiving
  const [teamStats, setTeamStats] = useState({
    passing: [],
    rushing: [],
    receiving: []
  });
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState(null);

  // Fetch passing stats for players
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
        if (controller.signal.aborted)
          console.log("Passing stats fetch aborted");
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

  // Fetch rushing stats for players
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
        if (controller.signal.aborted)
          console.log("Rushing stats fetch aborted");
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

  // Fetch receiving stats for players
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
        if (controller.signal.aborted)
          console.log("Receiving stats fetch aborted");
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

  // Fetch interceptions stats for players (defensive)
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
        if (controller.signal.aborted)
          console.log("Interceptions stats fetch aborted");
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

  // Fetch team stats for passing, rushing, and receiving
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setTeamLoading(true);
        const teams = await teamsService.getTeams();
        // For each team, fetch its stats for the season.
        const statsPromises = teams.map(team => teamsService.getTeamStats(team.school, 2024));
        const allStats = await Promise.all(statsPromises);
        // Assume each team stat object has keys: team, passingYards, rushingYards, receivingYards
        const sortedPassing = [...allStats].sort((a, b) => b.passingYards - a.passingYards).slice(0, 10);
        const sortedRushing = [...allStats].sort((a, b) => b.rushingYards - a.rushingYards).slice(0, 10);
        const sortedReceiving = [...allStats].sort((a, b) => b.receivingYards - a.receivingYards).slice(0, 10);
        setTeamStats({
          passing: sortedPassing,
          rushing: sortedRushing,
          receiving: sortedReceiving
        });
      } catch (error) {
        console.error("Error fetching team stats:", error);
        setTeamError("Failed to load team stats.");
      } finally {
        setTeamLoading(false);
      }
    };
    fetchTeamStats();
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
        #table-container, #team-table-container {
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>
      <h1>Top 10 Player Leaders (Yards) - 2024</h1>
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
                  <td>{player.playerName}</td>
                  <td>{player.statValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h1>Team Leaders (Yards) - 2024</h1>
      {teamLoading ? (
        <p>Loading team stats...</p>
      ) : teamError ? (
        <p>{teamError}</p>
      ) : (
        <div id="team-table-container">
          <h2>Team Passing Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Passing Yards</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.passing.map((team, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{team.team}</td>
                  <td>{team.passingYards}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Team Rushing Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Rushing Yards</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.rushing.map((team, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{team.team}</td>
                  <td>{team.rushingYards}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Team Receiving Leaders</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Receiving Yards</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.receiving.map((team, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{team.team}</td>
                  <td>{team.receivingYards}</td>
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