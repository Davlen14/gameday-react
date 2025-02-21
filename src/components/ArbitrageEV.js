import React, { useState, useEffect } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import teamsService from "../services/teamsService";
import "../styles/ArbitrageEV.css"; // Assume you'll place styling here

const ArbitrageEV = () => {
  const [activeTab, setActiveTab] = useState("arbitrage");
  const [oddsData, setOddsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for teams (used for logos)
  const [teams, setTeams] = useState([]);

  // State for week filter
  const [week, setWeek] = useState(1);

  // Fetch teams once to get logos
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // Helper function to get team logos
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team?.logos ? team.logos[0] : "/photos/default_team.png";
  };

  // Helper function to get sportsbook logos
  const getSportsbookLogo = (provider) => {
    const logos = {
      DraftKings: "/photos/draftkings.png",
      "ESPN Bet": "/photos/espnbet.png",
      Bovada: "/photos/bovada.jpg",
    };
    return logos[provider] || "/photos/default_sportsbook.png";
  };

  // Fetch betting odds data whenever `week` changes
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoading(true);

        // If your API supports fetching lines by week, pass `week`:
        // Example: const response = await teamsService.getGameLines(2024, week, "regular");
        // If it doesn't, you may need to filter locally after fetching.
        const response = await teamsService.getGameLines(2024, week, "regular");

        // Filter relevant sportsbooks
        const filteredLines = response.map((game) => ({
          id: game.id,
          week: game.week,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          lines: game.lines.filter((line) =>
            ["DraftKings", "ESPN Bet", "Bovada"].includes(line.provider)
          ),
        }));

        // Sort by week for better readability
        const sortedLines = filteredLines.sort((a, b) => a.week - b.week);

        setOddsData(sortedLines);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOdds();
  }, [week]);

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle week filter changes
  const handleWeekChange = (e) => {
    setWeek(Number(e.target.value));
  };

  return (
    <div className="ev-arbitrage-container">
      {/* Week Filter */}
      <div className="week-filter">
        <label htmlFor="week-select">Select Week: </label>
        <select id="week-select" value={week} onChange={handleWeekChange}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => handleTabClick("arbitrage")}
        >
          Arbitrage
        </button>
        <button
          className={activeTab === "ev" ? "active" : ""}
          onClick={() => handleTabClick("ev")}
        >
          Positive EV
        </button>
      </div>

      {/* Main Content */}
      <div className="tab-content">
        {isLoading ? (
          <p>Loading betting lines...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : activeTab === "arbitrage" ? (
          <Arbitrage
            oddsData={oddsData}
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        ) : (
          <EVBetting
            oddsData={oddsData}
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        )}
      </div>
    </div>
  );
};

export default ArbitrageEV;