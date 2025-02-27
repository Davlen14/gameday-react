import React from "react";

const Pac12 = () => {
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
      <img src="/photos/Pac-12.png" alt="Pac-12 Logo" style={logoStyle} />
      <h1 style={headingStyle}>Pac-12 Conference</h1>
      <p style={messageStyle}>Pac-12 Conference page is under construction.</p>
      <div style={constructionStyle}>🚧</div>
    </div>
  );
};

export default Pac12;