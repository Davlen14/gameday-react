import React, { useState, useEffect } from 'react';
import teamsService from "../services/teamsService";

// Enhanced component for displaying game odds with betting tips
const GameOdds = ({ lines, gameId, homeTeam, awayTeam }) => {
  const [homeStats, setHomeStats] = useState(null);
  const [awayStats, setAwayStats] = useState(null);
  const [homeRecord, setHomeRecord] = useState(null);
  const [awayRecord, setAwayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState(null);
  const [predictions, setPredictions] = useState({
    spreadPrediction: null,
    overUnderPrediction: null,
    confidence: null
  });

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

  // Fetch team data when component loads or gameId changes
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        // Fetch home team stats and record
        const [homeStatsData, homeRecordData] = await Promise.all([
          teamsService.getTeamStats(homeTeam),
          teamsService.getTeamRecord(homeTeam)
        ]);
        
        // Fetch away team stats and record
        const [awayStatsData, awayRecordData] = await Promise.all([
          teamsService.getTeamStats(awayTeam),
          teamsService.getTeamRecord(awayTeam)
        ]);
        
        // Update state with fetched data
        setHomeStats(homeStatsData);
        setHomeRecord(homeRecordData);
        setAwayStats(awayStatsData);
        setAwayRecord(awayRecordData);
        
        // Calculate predictions with new data
        generatePredictions(homeStatsData, awayStatsData, homeRecordData, awayRecordData);
        
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (homeTeam && awayTeam && gameId) {
      fetchTeamData();
    }
  }, [homeTeam, awayTeam, gameId]);

  // Calculate betting predictions based on team stats
  const generatePredictions = (homeStats, awayStats, homeRecord, awayRecord) => {
    // Default values if we can't make predictions
    let spreadPrediction = null;
    let overUnderPrediction = null;
    let confidence = null;
    
    // Check if we have enough data to make predictions
    if (homeStats && awayStats && homeRecord && awayRecord) {
      try {
        // Calculate team strengths (simplified example)
        const homeWins = homeRecord.filter(game => 
          (game.homeTeam === homeTeam && game.homePoints > game.awayPoints) || 
          (game.awayTeam === homeTeam && game.awayPoints > game.homePoints)
        ).length;
        
        const awayWins = awayRecord.filter(game => 
          (game.homeTeam === awayTeam && game.homePoints > game.awayPoints) || 
          (game.awayTeam === awayTeam && game.awayPoints > game.homePoints)
        ).length;
        
        const homeStrength = homeWins / homeRecord.length;
        const awayStrength = awayWins / awayRecord.length;
        
        // Generate spread prediction (home team perspective)
        const strengthDiff = (homeStrength - awayStrength) * 10;
        spreadPrediction = {
          predictedSpread: Math.round(strengthDiff * 10) / 10,
          favoredTeam: strengthDiff > 0 ? homeTeam : awayTeam,
          explanation: strengthDiff > 0 
            ? `${homeTeam} is performing better this season with a ${(homeStrength * 100).toFixed(1)}% win rate vs ${awayTeam}'s ${(awayStrength * 100).toFixed(1)}%`
            : `${awayTeam} has been stronger with a ${(awayStrength * 100).toFixed(1)}% win rate vs ${homeTeam}'s ${(homeStrength * 100).toFixed(1)}%`
        };
        
        // Generate over/under prediction (simplified)
        // Calculate average scores for both teams
        const homeAvgScored = homeStats.avgPointsScored || 0;
        const homeAvgAllowed = homeStats.avgPointsAllowed || 0;
        const awayAvgScored = awayStats.avgPointsScored || 0;
        const awayAvgAllowed = awayStats.avgPointsAllowed || 0;
        
        // Predict total score based on team averages
        const predictedTotal = Math.round((homeAvgScored + awayAvgAllowed + awayAvgScored + homeAvgAllowed) / 2);
        
        overUnderPrediction = {
          predictedTotal: predictedTotal,
          recommendation: predictedTotal > 0 ? `Predicted total: ${predictedTotal}` : "Not enough historical data for confident O/U prediction",
          explanation: "Based on season scoring averages for both teams"
        };
        
        // Simple confidence metric (0-100)
        confidence = Math.min(100, Math.round((Math.abs(strengthDiff) * 20) + 50));
        
      } catch (error) {
        console.error("Error generating predictions:", error);
      }
    }
    
    setPredictions({
      spreadPrediction,
      overUnderPrediction,
      confidence
    });
  };

  // Handle line selection for detailed analysis
  const handleLineSelect = (line) => {
    setSelectedLine(line === selectedLine ? null : line);
  };

  // Get prediction indicator (green, yellow, red)
  const getConfidenceColor = (confidenceLevel) => {
    if (!confidenceLevel) return '#6c757d'; // gray
    if (confidenceLevel >= 70) return '#28a745'; // green
    if (confidenceLevel >= 40) return '#ffc107'; // yellow
    return '#dc3545'; // red
  };

  // Determine if a bet appears to be valuable
  const getBetValue = (line) => {
    if (!predictions.spreadPrediction || !line) return { value: "UNKNOWN", color: "#6c757d" };
    
    try {
      // Parse the spread to a number
      const spreadValue = parseFloat(line.spread);
      if (isNaN(spreadValue)) return { value: "UNKNOWN", color: "#6c757d" };
      
      // Calculate the difference between predicted and actual spread
      const predictedSpread = predictions.spreadPrediction.predictedSpread;
      const diff = Math.abs(predictedSpread - spreadValue);
      
      if (diff < 1) return { value: "FAIR", color: "#6c757d" };
      if (diff < 3) return { value: "GOOD", color: "#28a745" };
      if (diff < 5) return { value: "GREAT", color: "#007bff" };
      return { value: "STRONG", color: "#dc3545" };
    } catch (e) {
      return { value: "UNKNOWN", color: "#6c757d" };
    }
  };

  // CSS styles
  const styles = {
    container: {
      padding: '20px 0',
    },
    header: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
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
      padding: '12px 16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      gap: '16px',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      border: '1px solid transparent',
    },
    selectedLine: {
      backgroundColor: '#e9ecef',
      borderColor: '#dee2e6',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
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
      gap: '20px',
      flexGrow: 1,
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
    valueIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '80px',
      height: '30px',
      borderRadius: '15px',
      fontSize: '0.8rem',
      fontWeight: '700',
      color: 'white',
    },
    predictionBox: {
      backgroundColor: '#f8f9fa',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #dee2e6',
    },
    predictionHeader: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    confidenceIndicator: {
      display: 'flex',
      alignItems: 'center',
      marginTop: '16px',
    },
    confidenceBar: {
      height: '8px',
      borderRadius: '4px',
      backgroundColor: '#e9ecef',
      width: '100%',
      marginLeft: '12px',
      position: 'relative',
      overflow: 'hidden',
    },
    confidenceFill: {
      position: 'absolute',
      height: '100%',
      left: 0,
      top: 0,
      transition: 'width 0.5s ease-out',
    },
    betTip: {
      padding: '12px',
      backgroundColor: '#e8f4fc',
      borderRadius: '8px',
      marginTop: '16px',
      borderLeft: '4px solid #007bff',
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100px',
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(0, 0, 0, 0.1)',
      borderLeftColor: '#D4001C',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
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
    },
    lineDetails: {
      backgroundColor: '#e9ecef',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '8px',
      animation: 'fadeIn 0.3s ease-in',
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginTop: '12px',
    },
    detailCard: {
      backgroundColor: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    detailHeader: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#6c757d',
      marginBottom: '8px',
    },
    detailValue: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: '#212529',
    },
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'translateY(-10px)' },
      to: { opacity: 1, transform: 'translateY(0)' }
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Betting Information</h2>
        {predictions.confidence && (
          <div style={{
            ...styles.valueIndicator,
            backgroundColor: getConfidenceColor(predictions.confidence),
            width: 'auto',
            padding: '4px 12px'
          }}>
            {predictions.confidence}% CONFIDENCE
          </div>
        )}
      </div>

      {!loading && predictions.spreadPrediction && (
        <div style={styles.predictionBox}>
          <div style={styles.predictionHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#007bff"/>
            </svg>
            <span>MATCHUP ANALYSIS</span>
          </div>
          
          <p><strong>{predictions.spreadPrediction.favoredTeam}</strong> is favored by our model with a predicted spread of <strong>{Math.abs(predictions.spreadPrediction.predictedSpread).toFixed(1)}</strong> points.</p>
          <p>{predictions.spreadPrediction.explanation}</p>
          
          <div style={styles.confidenceIndicator}>
            <span style={styles.label}>CONFIDENCE</span>
            <div style={styles.confidenceBar}>
              <div style={{
                ...styles.confidenceFill,
                width: `${predictions.confidence}%`,
                backgroundColor: getConfidenceColor(predictions.confidence)
              }}></div>
            </div>
          </div>
          
          <div style={styles.betTip}>
            <strong>BETTING TIP:</strong> Look for lines where {predictions.spreadPrediction.favoredTeam} is favored by less than {Math.abs(predictions.spreadPrediction.predictedSpread).toFixed(1)} points as these may present value.
          </div>
        </div>
      )}

      <div>
        <div style={{ ...styles.sectionTitle, position: 'relative' }}>
          <span>Sportsbook Lines</span>
          <div style={{ ...styles.sectionTitleAfter, position: 'absolute' }}></div>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <span style={{ marginLeft: '12px' }}>Loading betting analysis...</span>
          </div>
        ) : gameLines && gameLines.length > 0 ? (
          <div style={styles.linesContainer}>
            {gameLines.map((line, index) => {
              const betValue = getBetValue(line);
              return (
                <React.Fragment key={index}>
                  <div 
                    style={{
                      ...styles.lineItem,
                      ...(selectedLine === line ? styles.selectedLine : {})
                    }}
                    onClick={() => handleLineSelect(line)}
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
                    {predictions.confidence && (
                      <div style={{
                        ...styles.valueIndicator,
                        backgroundColor: betValue.color
                      }}>
                        {betValue.value}
                      </div>
                    )}
                  </div>
                  
                  {selectedLine === line && (
                    <div style={styles.lineDetails}>
                      <h4 style={{marginTop: 0, marginBottom: '8px'}}>{line.provider} Line Analysis</h4>
                      <p>Our model {predictions.spreadPrediction ? `predicts ${predictions.spreadPrediction.favoredTeam} by ${Math.abs(predictions.spreadPrediction.predictedSpread).toFixed(1)}` : 'has insufficient data for confident predictions'}.</p>
                      
                      <div style={styles.detailsGrid}>
                        <div style={styles.detailCard}>
                          <div style={styles.detailHeader}>SPREAD ANALYSIS</div>
                          <div style={styles.detailValue}>{betValue.value}</div>
                          <p style={{fontSize: '0.9rem', marginTop: '8px'}}>
                            {betValue.value !== "UNKNOWN" ? 
                              `This line ${betValue.value !== "FAIR" ? "may offer" : "seems close to"} expected value based on our projections.` : 
                              "Cannot analyze this line"}
                          </p>
                        </div>
                        
                        <div style={styles.detailCard}>
                          <div style={styles.detailHeader}>OVER/UNDER ANALYSIS</div>
                          <div style={styles.detailValue}>
                            {predictions.overUnderPrediction && predictions.overUnderPrediction.predictedTotal > 0 ? "ANALYSIS" : "FAIR"}
                          </div>
                          <p style={{fontSize: '0.9rem', marginTop: '8px'}}>
                            {predictions.overUnderPrediction && predictions.overUnderPrediction.predictedTotal > 0 
                              ? `Our model predicts a total of ${predictions.overUnderPrediction.predictedTotal} points.` 
                              : "Over/Under projected to be close to the sportsbook's line."}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{...styles.betTip, marginTop: '16px'}}>
                        <strong>VALUE PERSPECTIVE:</strong> {betValue.value === "UNKNOWN" ? 
                          "Not enough data to determine value" : 
                          `This line appears to be ${betValue.value.toLowerCase() === "fair" ? "close to fair value" : "a potentially good value"} based on our models.`}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <p style={styles.noData}>No betting lines available for this game.</p>
        )}
      </div>
      <div style={styles.disclaimer}>
        <p>Odds displayed are for informational purposes only. Please check with sportsbooks for current odds. Betting predictions are based on available team statistics and should not be considered financial advice.</p>
      </div>
    </div>
  );
};

export default GameOdds;