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
    interceptions: [],
    sacks: [] // This will now hold Total Tackles data
  });

  // Separate loading states for each category:
  const [loadingPassing, setLoadingPassing] = useState(true);
  const [loadingRushing, setLoadingRushing] = useState(true);
  const [loadingReceiving, setLoadingReceiving] = useState(true);
  const [loadingInterceptions, setLoadingInterceptions] = useState(true);
  const [loadingSacks, setLoadingSacks] = useState(true);

  // Separate error states for each category:
  const [errorPassing, setErrorPassing] = useState(null);
  const [errorRushing, setErrorRushing] = useState(null);
  const [errorReceiving, setErrorReceiving] = useState(null);
  const [errorInterceptions, setErrorInterceptions] = useState(null);
  const [errorSacks, setErrorSacks] = useState(null);

  // Active tab: "playerOffense", "playerDefense", "teamOffense", or "teamDefense"
  const [activeTab, setActiveTab] = useState("playerOffense");

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
        if (!controller.signal.aborted) {
          console.error("Error fetching passing stats:", error);
          setErrorPassing("Failed to load passing stats.");
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
        if (!controller.signal.aborted) {
          console.error("Error fetching rushing stats:", error);
          setErrorRushing("Failed to load rushing stats.");
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
        if (!controller.signal.aborted) {
          console.error("Error fetching receiving stats:", error);
          setErrorReceiving("Failed to load receiving stats.");
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
        if (!controller.signal.aborted) {
          console.error("Error fetching interceptions stats:", error);
          setErrorInterceptions("Failed to load interceptions stats.");
        }
      } finally {
        setLoadingInterceptions(false);
      }
    };
    fetchInterceptionsStats();
    return () => controller.abort();
  }, []);

  // Fetch Total Tackles Stats (defensive) – using "defensive" as the category to get TOT values
  useEffect(() => {
    const controller = new AbortController();
    const fetchTotalTacklesStats = async () => {
      try {
        setLoadingSacks(true);
        const defensiveData = await teamsService.getPlayerSeasonStats(
          2024,
          "defensive", // Fetch defensive data
          "regular",
          100,
          controller.signal
        );
        console.log("Raw defensive data:", defensiveData);
        const aggregatedTotalTackles = aggregatePlayerStats(defensiveData, "TOT");
        setPlayerStats(prev => ({ ...prev, sacks: aggregatedTotalTackles.slice(0, 10) }));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching total tackles stats:", error);
          setErrorSacks("Failed to load total tackles stats.");
        }
      } finally {
        setLoadingSacks(false);
      }
    };
    fetchTotalTacklesStats();
    return () => controller.abort();
  }, []);

  const renderContent = () => {
    if (activeTab === "playerOffense") {
      return (
        <div>
          <section>
            <h2>Passing Leaders</h2>
            {loadingPassing ? (
              <div className="loader">Loading passing stats...</div>
            ) : errorPassing ? (
              <p>{errorPassing}</p>
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
              <div className="loader">Loading rushing stats...</div>
            ) : errorRushing ? (
              <p>{errorRushing}</p>
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
              <div className="loader">Loading receiving stats...</div>
            ) : errorReceiving ? (
              <p>{errorReceiving}</p>
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
        </div>
      );
    } else if (activeTab === "playerDefense") {
      return (
        <div>
          <section>
            <h2>Total Tackles Leaders</h2>
            {loadingSacks ? (
              <div className="loader">Loading total tackles stats...</div>
            ) : errorSacks ? (
              <p>{errorSacks}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Total Tackles</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.sacks.map((player, index) => (
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
              <div className="loader">Loading interceptions stats...</div>
            ) : errorInterceptions ? (
              <p>{errorInterceptions}</p>
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
      );
    } else if (activeTab === "teamOffense") {
      return <div className="placeholder">Team Offense data coming soon...</div>;
    } else if (activeTab === "teamDefense") {
      return <div className="placeholder">Team Defense data coming soon...</div>;
    }
  };

  return (
    <div className="stats-container">
      {/* Modernized CSS with tabs, hover effects, and a red ticker loader */}
      <style>{`
        :root {
          --background-color: #ffffff;
          --text-color: #333333;
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
        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          border-bottom: 2px solid var(--border-color);
        }
        .tab {
          padding: 0.75rem 1.5rem;
          margin: 0 0.5rem;
          cursor: pointer;
          background: none;
          border: none;
          font-size: 1.1rem;
          transition: color 0.3s ease, border-bottom 0.3s ease;
        }
        .tab:hover {
          color: var(--navbar-bg);
        }
        .active {
          border-bottom: 3px solid var(--navbar-bg);
          color: var(--navbar-bg);
          font-weight: bold;
        }
        #table-container {
          max-width: 1200px;
          margin: 0 auto;
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
        .loader {
          font-size: 1.2rem;
          color: var(--navbar-bg);
          animation: ticker 1s linear infinite;
          text-align: center;
          margin: 2rem 0;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          50% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        .placeholder {
          text-align: center;
          font-size: 1.3rem;
          padding: 2rem 0;
          color: var(--navbar-bg);
        }
      `}</style>
      <h1>Top 10 Leaders (Yards) - 2024</h1>
      <div className="tabs">
        <button
          className={`tab ${activeTab === "playerOffense" ? "active" : ""}`}
          onClick={() => setActiveTab("playerOffense")}
        >
          Player Offense
        </button>
        <button
          className={`tab ${activeTab === "playerDefense" ? "active" : ""}`}
          onClick={() => setActiveTab("playerDefense")}
        >
          Player Defense
        </button>
        <button
          className={`tab ${activeTab === "teamOffense" ? "active" : ""}`}
          onClick={() => setActiveTab("teamOffense")}
        >
          Team Offense
        </button>
        <button
          className={`tab ${activeTab === "teamDefense" ? "active" : ""}`}
          onClick={() => setActiveTab("teamDefense")}
        >
          Team Defense
        </button>
      </div>
      <div id="table-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default Stats;