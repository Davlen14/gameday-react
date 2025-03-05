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
  };

  const logoStyle = {
    width: "120px",
    height: "120px",
    objectFit: "contain",
    marginBottom: "20px",
    transformStyle: "preserve-3d",
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
      {/* CSS styles for rotation, 3D effect, and metal glare */}
      <style>
        {`
          @keyframes rotate {
            from { transform: perspective(1000px) rotateY(0deg); }
            to { transform: perspective(1000px) rotateY(360deg); }
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
            background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%);
            pointer-events: none;
            mix-blend-mode: overlay;
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