import React from "react";

const VisualizeTrends = () => {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    padding: "40px",
    textAlign: "center",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "#333",
  };

  const headingStyle = {
    fontSize: "2rem",
    marginBottom: "10px",
  };

  const messageStyle = {
    fontSize: "1.2rem",
    marginBottom: "20px",
  };

  const constructionStyle = {
    fontSize: "2.5rem",
    color: "#ff9900",
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Visualize Trends</h1>
      <p style={messageStyle}>Visualize Trends page is under construction.</p>
      <div style={constructionStyle}>🚧</div>
    </div>
  );
};

export default VisualizeTrends;