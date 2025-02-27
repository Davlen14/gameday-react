import React from "react";

const AmericanAthletic = () => {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center",
    minHeight: "80vh",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "#333",
  };

  const logoStyle = {
    width: "120px",
    height: "120px",
    objectFit: "contain",
    marginBottom: "20px",
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
      <img src="/photos/American Athletic.png" alt="American Athletic Logo" style={logoStyle} />
      <h1 style={headingStyle}>American Athletic Conference</h1>
      <p style={messageStyle}>American Athletic Conference page is under construction.</p>
      <div style={constructionStyle}>🚧</div>
    </div>
  );
};

export default AmericanAthletic;