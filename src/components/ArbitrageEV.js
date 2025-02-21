import React, { useState, useEffect } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import teamsService from "../services/teamsService";
import "../styles/ArbitrageEV.css";

// Helper function to get sportsbook logos
const getSportsbookLogo = (provider) => {
  const logos = {
    DraftKings: "/photos/draftkings.png",
    "ESPN Bet": "/photos/espnbet.png",
    Bovada: "/photos/bovada.jpg",
  };
  return logos[provider] || "/photos/default_sportsbook.png";
};

const ArbitrageEV = () => {
  const [activeTab, setActiveTab] = useState("arbitrage");
  const [oddsData, setOddsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch betting odds data
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoading(true);

        // Fetch game lines for 2024 regular season
        const response = await teamsService.getGameLines(2024, null, "regular");

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
  }, []);

  return (
    <div className="ev-arbitrage-container">
      <div className="tab-nav">
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => setActiveTab("arbitrage")}
        >
          <span className="tab-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="tab-title">Arbitrage</span>
        </button>
        <button
          className={activeTab === "ev" ? "active" : ""}
          onClick={() => setActiveTab("ev")}
        >
          <span className="tab-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3z" />
            </svg>
          </span>
          <span className="tab-title">Positive EV</span>
        </button>
      </div>

      <div className="tab-content">
        {isLoading ? (
          <p>Loading betting lines...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : activeTab === "arbitrage" ? (
          <Arbitrage oddsData={oddsData} getSportsbookLogo={getSportsbookLogo} />
        ) : (
          <EVBetting oddsData={oddsData} getSportsbookLogo={getSportsbookLogo} />
        )}
      </div>
    </div>
  );
};

export default ArbitrageEV;