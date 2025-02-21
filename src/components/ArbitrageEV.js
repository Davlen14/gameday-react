import React, { useState } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import "./styles/ArbitrageEV.css"; // Styles for layout

const ArbitrageEV = () => {
  const [activeTab, setActiveTab] = useState("arbitrage");

  return (
    <div className="ev-arbitrage-container">
      <div className="tab-nav">
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => setActiveTab("arbitrage")}
        >
          Arbitrage
        </button>
        <button
          className={activeTab === "ev" ? "active" : ""}
          onClick={() => setActiveTab("ev")}
        >
          Positive EV
        </button>
      </div>
      <div className="tab-content">
        {activeTab === "arbitrage" ? <Arbitrage /> : <EVBetting />}
      </div>
    </div>
  );
};

export default ArbitrageEV;
