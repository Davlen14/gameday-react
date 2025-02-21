import React, { useState } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import "../styles/ArbitrageEV.css"; // Styles for layout

const ArbitrageEV = () => {
  const [activeTab, setActiveTab] = useState("arbitrage");

  return (
    <div className="ev-arbitrage-container">
      <div className="tab-nav">
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => setActiveTab("arbitrage")}
        >
          <span className="tab-icon">
            {/* Example Arbitrage icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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
            {/* Example Positive EV icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3z" />
            </svg>
          </span>
          <span className="tab-title">Positive EV</span>
        </button>
      </div>
      <div className="tab-content">
        {activeTab === "arbitrage" ? <Arbitrage /> : <EVBetting />}
      </div>
    </div>
  );
};

export default ArbitrageEV;