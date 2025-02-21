import React, { useState, useEffect } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import teamsService from "../services/teamsService";
import "../styles/ArbitrageEV.css";

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

  // Fetch betting odds data (always get all lines, then filter locally by week)
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoading(true);

        // Use your original logic that WORKS: pass `null` for the second argument
        // so that your backend returns all the lines. 
        const response = await teamsService.getGameLines(2024, null, "regular");

        // Now filter those lines locally based on the selected `week`.
        // If your API does return a `week` field, we can match it here:
        const weekFiltered = response.filter((game) => game.week === week);

        // Filter for relevant sportsbooks
        const filteredLines = weekFiltered.map((game) => ({
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