import React from "react";
import "../styles/LatestUpdates.css"; // ✅ Corrected path


const LatestUpdates = () => {
  return (
    <div className="latest-updates-container">
      <h1>Latest Updates</h1>
      <p>This page is under construction. Stay tuned for the latest college football news!</p>
      <img src="/photos/under-construction.png" alt="Under Construction" className="under-construction-img" />
    </div>
  );
};

export default LatestUpdates;
