import React from 'react';

// Component for displaying game odds
const GameOdds = ({ lines, gameId }) => {
  // Sportsbook logos mapping
  const sportsbookLogos = {
    "DraftKings": "/photos/draftkings.png",
    "ESPN Bet": "/photos/espnbet.png",
    "Bovada": "/photos/bovada.jpg",
  };

  // Helper to get sportsbook logo
  const getSportsbookLogo = (provider) => {
    return sportsbookLogos[provider] || "/photos/default_sportsbook.png";
  };

  // Find lines for the current game
  const gameLinesObj = lines.find(line => line.id === gameId || line.gameId === gameId);
  const gameLines = gameLinesObj && gameLinesObj.lines ? gameLinesObj.lines : [];

  // CSS styles
  const styles = {
    container: {
      padding: '20px 0',
    },
    header: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#343a40',
      position: 'relative',
      paddingBottom: '8px',
    },
    sectionTitleAfter: {
      content: '""',
      position: 'absolute',
      bottom: '0',
      left: '0',
      height: '3px',
      width: '40px',
      backgroundColor: '#D4001C',
    },
    linesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '16px',
    },
    lineItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      gap: '16px',
      transition: 'background-color 0.2s ease',
    },
    lineItemHover: {
      backgroundColor: '#e9ecef',
    },
    branding: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '50px',
    },
    logo: {
      width: '30px',
      height: '30px',
      objectFit: 'contain',
    },
    lineData: {
      display: 'flex',
      gap: '12px',
    },
    dataPiece: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    label: {
      fontWeight: '500',
      color: '#6c757d',
      fontSize: '0.9rem',
    },
    value: {
      fontWeight: '700',
      color: '#212529',
      fontSize: '0.95rem',
    },
    noData: {
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      color: '#6c757d',
      textAlign: 'center',
    },
    disclaimer: {
      fontSize: '0.8rem',
      color: '#6c757d',
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: '4px solid #ffc107',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Betting Information</h2>
      <div>
        <div style={{ ...styles.sectionTitle, position: 'relative' }}>
          <span>Sportsbook Lines</span>
          <div style={{ ...styles.sectionTitleAfter, position: 'absolute' }}></div>
        </div>

        {gameLines && gameLines.length > 0 ? (
          <div style={styles.linesContainer}>
            {gameLines.map((line, index) => (
              <div 
                key={index} 
                style={styles.lineItem} 
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              >
                <div style={styles.branding}>
                  <img 
                    src={getSportsbookLogo(line.provider)} 
                    alt={line.provider || "Sportsbook"} 
                    style={styles.logo}
                  />
                </div>
                <div style={styles.lineData}>
                  <div style={styles.dataPiece}>
                    <span style={styles.label}>SP: </span>
                    <span style={styles.value}>{line.spread || "N/A"}</span>
                  </div>
                  <div style={styles.dataPiece}>
                    <span style={styles.label}>O/U: </span>
                    <span style={styles.value}>{line.overUnder || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noData}>No betting lines available for this game.</p>
        )}
      </div>
      <div style={styles.disclaimer}>
        <p>Odds displayed are for informational purposes only. Please check with sportsbooks for current odds.</p>
      </div>
    </div>
  );
};

export default GameOdds;