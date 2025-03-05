import React from "react";

const BigTen = () => {
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
    perspective: "1200px", // adds depth to the 3D effect
  };

  const logoStyle = {
    width: "150px", // increased size for HD appearance
    height: "150px",
    objectFit: "contain",
    marginBottom: "20px",
    transformStyle: "preserve-3d",
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)", // drop shadow for extra depth
    borderRadius: "8px", // optional, for a smooth edge if desired
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
    <>
      {/* CSS styles for rotation, 3D tilt, and enhanced metal glare */}
      <style>
        {`
          @keyframes rotate {
            from { transform: perspective(1000px) rotateX(15deg) rotateY(0deg); }
            to { transform: perspective(1000px) rotateX(15deg) rotateY(360deg); }
          }
          .rotating-logo {
            animation: rotate 20s linear infinite;
            position: relative;
            transform-style: preserve-3d;
          }
          .rotating-logo::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%);
            pointer-events: none;
            mix-blend-mode: overlay;
            border-radius: inherit;
          }
        `}
      </style>
      <div style={containerStyle}>
        <img
          src="/photos/Big Ten.png"
          alt="Big Ten Logo"
          style={logoStyle}
          className="rotating-logo"
        />
        <h1 style={headingStyle}>Big Ten Conference</h1>
        <p style={messageStyle}>
          Big Ten Conference page is under construction.
        </p>
        <div style={constructionStyle}>🚧</div>
      </div>
    </>
  );
};

export default BigTen;