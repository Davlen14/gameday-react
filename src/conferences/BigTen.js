import React, { useState, useEffect } from 'react';
import teamsService from '../services/teamsService';

const BigTen = () => {
  const [bigTenTeams, setBigTenTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to convert latitude/longitude to percentage positions
  const getPositionFromCoordinates = (lat, lon) => {
    // These values are approximations based on the map's dimensions
    const mapWidth = 1200;
    const mapHeight = 800;
    
    // Rough conversion for continental US
    const minLat = 24.5, maxLat = 49.5;
    const minLon = -125.0, maxLon = -66.5;

    const xPercent = ((lon - minLon) / (maxLon - minLon)) * 100;
    const yPercent = ((maxLat - lat) / (maxLat - minLat)) * 100;

    return {
      left: `${xPercent}%`,
      top: `${yPercent}%`
    };
  };

  useEffect(() => {
    const fetchBigTenTeams = async () => {
      try {
        const allTeams = await teamsService.getTeams();
        const bigTenTeams = allTeams.filter(team => 
          team.conference === 'Big Ten' && 
          team.location?.latitude && 
          team.location?.longitude
        );
        setBigTenTeams(bigTenTeams);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Big Ten teams:', error);
        setIsLoading(false);
      }
    };

    fetchBigTenTeams();
  }, []);

  const mapContainerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const logoStyle = {
    position: 'absolute',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'contain',
    border: '3px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.2s ease',
  };

  const tooltipStyle = {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  };

  if (isLoading) return <div>Loading Big Ten Map...</div>;

  return (
    <div style={mapContainerStyle}>
      <svg 
        viewBox="0 0 1200 800" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* US Map Outline */}
        <path 
          d="M1200 0v800H0V0h1200zM199.5 101.25l-16.5 33 16.5 16.5 16.5-16.5-16.5-33zm-66 16.5l-16.5 33 16.5 16.5 16.5-16.5-16.5-33z" 
          fill="#e0e0e0"
        />
      </svg>
      
      {bigTenTeams.map((team) => {
        const { latitude, longitude } = team.location;
        const position = getPositionFromCoordinates(latitude, longitude);
        
        return (
          <div 
            key={team.id}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img
              src={team.logos?.[0] || '/photos/default-team.png'}
              alt={`${team.school} logo`}
              style={{
                ...logoStyle,
                backgroundColor: team.color || '#fff',
              }}
              title={team.school}
            />
            <div 
              style={{
                ...tooltipStyle,
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {team.school}
            </div>
          </div>
        );
      })}
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '10px',
        borderRadius: '5px',
        fontWeight: 'bold'
      }}>
        Big Ten Conference Map - 2024 Season
      </div>
    </div>
  );
};

export default BigTen;