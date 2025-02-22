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

  // Track selected game in each tab
  const [selectedArbGame, setSelectedArbGame] = useState(null);
  const [selectedEVGame, setSelectedEVGame] = useState(null);

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

        // Filter by week
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

        // Sort by week
        const sortedLines = filteredLines.sort((a, b) => a.week - b.week);

        setOddsData(sortedLines);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOdds();
    // Reset the selected games whenever the week changes
    setSelectedArbGame(null);
    setSelectedEVGame(null);
  }, [week]);

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Optionally reset selection when switching tabs:
    // setSelectedArbGame(null);
    // setSelectedEVGame(null);
  };

  // Handle week filter changes
  const handleWeekChange = (e) => {
    setWeek(Number(e.target.value));
  };

  // LEFT COLUMN: Week filter + Game list for the active tab
  const renderGameList = () => {
    return (
      <div className="left-panel">
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

        {/* Game List */}
        <div className="game-list">
          {oddsData.map((game) => {
            // Determine if this game is selected in the current tab
            const isSelected =
              activeTab === "arbitrage"
                ? selectedArbGame?.id === game.id
                : selectedEVGame?.id === game.id;

            return (
              <div
                key={game.id}
                className={`game-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  if (activeTab === "arbitrage") {
                    setSelectedArbGame(game);
                  } else {
                    setSelectedEVGame(game);
                  }
                }}
              >
                <img
                  src={getTeamLogo(game.homeTeam)}
                  alt={game.homeTeam}
                  className="team-logo-sm"
                />
                <span>{game.homeTeam}</span>
                <span className="vs-text">vs</span>
                <img
                  src={getTeamLogo(game.awayTeam)}
                  alt={game.awayTeam}
                  className="team-logo-sm"
                />
                <span>{game.awayTeam}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // RIGHT COLUMN: Display details for the selected game
  const renderGameDetails = () => {
    // Figure out which game is selected based on active tab
    const currentGame =
      activeTab === "arbitrage" ? selectedArbGame : selectedEVGame;

    if (!currentGame) {
      return (
        <div className="right-panel no-selection">
          <p>Please select a game from the list.</p>
        </div>
      );
    }

    // For Arbitrage tab, show the Arbitrage component
    if (activeTab === "arbitrage") {
      return (
        <div className="right-panel">
          <Arbitrage
            oddsData={[currentGame]} // pass as an array with a single game
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        </div>
      );
    }

    // For Positive EV tab, show the EVBetting component
    return (
      <div className="right-panel">
        <EVBetting
          oddsData={[currentGame]}
          getSportsbookLogo={getSportsbookLogo}
          getTeamLogo={getTeamLogo}
        />
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="ev-arbitrage-container">
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

      {/* Content Section */}
      {isLoading ? (
        <p>Loading betting lines...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : (
        <div className="two-column-layout">
          {renderGameList()}
          {renderGameDetails()}
        </div>
      )}
    </div>
  );
};

export default ArbitrageEV;