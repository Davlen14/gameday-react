import React, { useState, useEffect, useRef } from "react";
import { 
  FaMapMarkerAlt, 
  FaUniversity, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaWeight,
  FaRulerVertical,
  FaUser,
  FaTshirt,
  FaMapPin,
  FaIdCard,
  FaGraduationCap,
  FaCity,
  FaFlag,
  FaSearch,
  FaCompass,
  FaFilter
} from "react-icons/fa";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Loading animation component
const LoadingSpinner = ({ color = "#9e9e9e" }) => (
  <div className="loading-spinner">
    <svg width="50" height="50" viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="31.4 31.4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

// Helper function to lighten a color
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return (
    "#" +
    (0x1000000 +
      (R < 255 ? R : 255) * 0x10000 +
      (G < 255 ? G : 255) * 0x100 +
      (B < 255 ? B : 255)
    )
      .toString(16)
      .slice(1)
  );
};

// Helper function to darken a color
const darkenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
  return (
    "#" +
    (0x1000000 +
      (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)
    )
      .toString(16)
      .slice(1)
  );
};

// Gets player initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
};

// Format height from inches to feet and inches
const formatHeight = (heightInInches) => {
  if (!heightInInches) return "N/A";
  
  const inches = parseInt(heightInInches, 10);
  if (isNaN(inches)) return "N/A";
  
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  
  return `${feet}'${remainingInches}"`;
};

// Leaflet map controller for programmatic control
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const RosterMap = ({ teamName, teamColor, year = 2024 }) => {
  const [roster, setRoster] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filterPosition, setFilterPosition] = useState('All');
  const [positionGroups, setPositionGroups] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [searchTerm, setSearchTerm] = useState('');
  const [stadiumLocation, setStadiumLocation] = useState(null);
  const [mapKey, setMapKey] = useState(Date.now()); // For forcing remount of MapContainer
  const mapContainerRef = useRef(null);
  
  // Fetch roster data
  useEffect(() => {
    const fetchRoster = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await teamsService.getTeamRoster(teamName, year);
        setRoster(data);
        
        // Extract unique position groups for filtering
        const positions = ['All', ...new Set(data.map(player => player.position))].filter(Boolean);
        setPositionGroups(positions);
        
        // Fetch team location data
        const teamsData = await teamsService.getTeams();
        const team = teamsData.find(t => t.school === teamName);
        
        if (team) {
          setTeamData(team);
          
          // Set stadium location using the team's actual location data
          if (team.location && team.location.latitude && team.location.longitude) {
            setStadiumLocation([team.location.latitude, team.location.longitude]);
            
            // Center the map on the stadium initially
            setMapCenter([team.location.latitude, team.location.longitude]);
            setMapZoom(5); // Start with a reasonable zoom level
            
            console.log("Set stadium location:", [team.location.latitude, team.location.longitude]);
          } else {
            console.warn("Team location data missing or incomplete:", team);
          }
        } else {
          console.warn("Team not found:", teamName);
        }
        
        // Force a refresh of the map
        setMapKey(Date.now());
      } catch (err) {
        console.error("Error fetching roster:", err.message);
        setError("Failed to load roster information.");
        setRoster([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoster();
  }, [teamName, year]);

  // Determine bounds for the map to fit all markers
  useEffect(() => {
    if (roster.length > 0 && stadiumLocation) {
      // Create a bounds object to include all points
      const validPlayerLocations = roster
        .filter(p => p.homeLatitude && p.homeLongitude)
        .map(p => [p.homeLatitude, p.homeLongitude]);
      
      if (validPlayerLocations.length > 0) {
        // Add stadium location to the points
        const allPoints = [...validPlayerLocations, stadiumLocation];
        
        // Get the extremes
        const latitudes = allPoints.map(p => p[0]);
        const longitudes = allPoints.map(p => p[1]);
        
        const south = Math.min(...latitudes);
        const north = Math.max(...latitudes);
        const west = Math.min(...longitudes);
        const east = Math.max(...longitudes);
        
        // Add some padding
        const latPadding = (north - south) * 0.2;
        const lngPadding = (east - west) * 0.2;
        
        // Calculate center point
        const centerLat = (north + south) / 2;
        const centerLng = (east + west) / 2;
        
        setMapCenter([centerLat, centerLng]);
        
        // Determine zoom level based on the bounds size
        // This is a rough calculation, adjust as needed
        const latDiff = Math.abs(north - south) + latPadding * 2;
        const lngDiff = Math.abs(east - west) + lngPadding * 2;
        
        // The larger the difference, the smaller the zoom
        const zoom = Math.min(
          Math.floor(6 / Math.max(latDiff / 10, lngDiff / 20)),
          10
        );
        
        setMapZoom(zoom > 3 ? zoom : 4);
      }
    }
  }, [roster, stadiumLocation]);

  // Filter players based on selected position and search term
  const filteredPlayers = roster.filter(player => {
    // Position filter
    const positionMatch = filterPosition === 'All' || player.position === filterPosition;
    
    // Search filter
    const playerName = `${player.firstName || ''} ${player.lastName || ''}`.toLowerCase();
    const playerHometown = `${player.homeCity || ''} ${player.homeState || ''}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
                      playerName.includes(searchLower) || 
                      playerHometown.includes(searchLower) ||
                      (player.position || '').toLowerCase().includes(searchLower);
    
    return positionMatch && searchMatch;
  });

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Handle marker click
  const handleMarkerClick = (player) => {
    setSelectedPlayer(player);
    setMapCenter([player.homeLatitude, player.homeLongitude]);
    setMapZoom(7);
  };
  
  // Handle stadium marker click
  const handleStadiumClick = () => {
    // Reset the map view to show all players
    setMapZoom(4);
    setMapCenter([39.8283, -98.5795]);
    setSelectedPlayer(null);
  };
  
  // Close player info panel
  const closePlayerInfo = () => {
    setSelectedPlayer(null);
  };
  
  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterPosition('All');
    setSearchTerm('');
    
    // Reset map view to fit all players
    if (roster.length > 0 && stadiumLocation) {
      setMapCenter([39.8283, -98.5795]);
      setMapZoom(4);
    }
    
    setSelectedPlayer(null);
  };
  
  // Find home state distribution
  const stateDistribution = roster.reduce((acc, player) => {
    if (player.homeState) {
      acc[player.homeState] = (acc[player.homeState] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Sort states by count
  const topStates = Object.entries(stateDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Create custom icons for markers
  const createPlayerIcon = (player) => {
    const initials = getInitials(player.firstName, player.lastName);
    
    return L.divIcon({
      className: 'player-marker-icon',
      html: `
        <div class="marker-container" style="--player-color: ${teamColor}; --player-light: ${lightenColor(teamColor, 20)}; --player-dark: ${darkenColor(teamColor, 30)};">
          <div class="marker-initials">${initials}</div>
          <div class="marker-position">${player.position || ''}</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
  };
  
  // Create stadium icon
  const createStadiumIcon = () => {
    if (!teamData || !teamData.logos || !teamData.logos[0]) {
      return L.divIcon({
        className: 'stadium-marker-icon',
        html: `
          <div class="stadium-container" style="--team-color: ${teamColor}; --team-light: ${lightenColor(teamColor, 20)}; --team-dark: ${darkenColor(teamColor, 30)};">
            <div class="stadium-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6l11-6l-11-6zm0 18l-9-5v-6.5l9 5v6.5zm0 0l9-5v-6.5l-9 5v6.5z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 50]
      });
    }
    
    return L.divIcon({
      className: 'stadium-marker-icon',
      html: `
        <div class="stadium-container" style="--team-color: ${teamColor}; --team-light: ${lightenColor(teamColor, 20)}; --team-dark: ${darkenColor(teamColor, 30)};">
          <img src="${teamData.logos[0]}" alt="${teamName}" class="stadium-logo" />
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50]
    });
  };

  console.log("Filtered players count:", filteredPlayers.length);
  console.log("Players with location data:", filteredPlayers.filter(p => p.homeLatitude && p.homeLongitude).length);
  console.log("Stadium location:", stadiumLocation);

  return (
    <div className="dashboard-card full-width-card">
      <div className="card-header" style={cardHeaderStyle}>
        <FaMapMarkerAlt style={{ marginRight: "12px", color: teamColor }} />
        Roster Map
      </div>
      <div className="card-body roster-map-container">
        {isLoading ? (
          <div className="loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Loading roster map...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <>
            <div className="roster-map-controls">
              <div className="control-buttons">
                <button 
                  className="filter-toggle-button" 
                  onClick={toggleFilters}
                  style={{
                    backgroundColor: teamColor,
                    boxShadow: `0 4px 10px ${teamColor}50`
                  }}
                >
                  <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <button 
                  className="reset-button" 
                  onClick={resetFilters}
                  style={{
                    backgroundColor: '#ffffff',
                    color: teamColor,
                    border: `2px solid ${teamColor}`,
                    boxShadow: `0 4px 10px ${teamColor}30`
                  }}
                >
                  <FaCompass /> Reset Map
                </button>
              </div>
              
              <div className="search-container">
                <div className="search-input-wrapper" style={{borderColor: teamColor}}>
                  <FaSearch style={{color: teamColor}} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search players or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {showFilters && (
                <div className="filter-panel" style={{borderColor: `${teamColor}30`}}>
                  <h3 style={{color: teamColor}}>Filter By Position</h3>
                  <div className="position-filters">
                    {positionGroups.map(position => (
                      <button
                        key={position}
                        className={`position-filter-button ${filterPosition === position ? 'active' : ''}`}
                        onClick={() => setFilterPosition(position)}
                        style={{
                          backgroundColor: filterPosition === position ? teamColor : '#ffffff',
                          color: filterPosition === position ? '#ffffff' : teamColor,
                          borderColor: teamColor
                        }}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                  
                  <div className="map-stats">
                    <h3 style={{color: teamColor}}>Roster Breakdown</h3>
                    <div className="stat-item">
                      <div className="stat-label">Total Players:</div>
                      <div className="stat-value">{roster.length}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">States Represented:</div>
                      <div className="stat-value">{Object.keys(stateDistribution).length}</div>
                    </div>
                    <h4 style={{color: teamColor}}>Top States</h4>
                    <div className="top-states">
                      {topStates.map(([state, count]) => (
                        <div key={state} className="state-item">
                          <div className="state-name">{state}</div>
                          <div className="state-count" style={{backgroundColor: teamColor}}>{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="map-visualization" ref={mapContainerRef}>
              <MapContainer 
                key={mapKey}
                center={mapCenter} 
                zoom={mapZoom} 
                style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController 
                  center={mapCenter} 
                  zoom={mapZoom}
                />
                
                {/* Stadium marker */}
                {stadiumLocation && (
                  <Marker 
                    position={stadiumLocation} 
                    icon={createStadiumIcon()}
                    eventHandlers={{
                      click: handleStadiumClick
                    }}
                  >
                    <Popup>
                      <div className="stadium-popup">
                        <h3>{teamName} Stadium</h3>
                        {teamData?.location?.name && (
                          <div>{teamData.location.name}</div>
                        )}
                        {teamData?.location?.city && teamData?.location?.state && (
                          <div>{teamData.location.city}, {teamData.location.state}</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Player markers */}
                {filteredPlayers.map(player => {
                  if (!player.homeLatitude || !player.homeLongitude) return null;
                  
                  // Debugging output for player locations
                  console.log(`Player ${player.firstName} ${player.lastName} at [${player.homeLatitude}, ${player.homeLongitude}]`);
                  
                  return (
                    <Marker 
                      key={player.id}
                      position={[player.homeLatitude, player.homeLongitude]} 
                      icon={createPlayerIcon(player)}
                      eventHandlers={{
                        click: () => handleMarkerClick(player)
                      }}
                    >
                      <Popup>
                        <div className="player-popup">
                          <h3>{player.firstName} {player.lastName}</h3>
                          <div>{player.position} | #{player.jersey}</div>
                          <div>{player.homeCity}, {player.homeState}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
            
            {/* Player Info Panel */}
            {selectedPlayer && (
              <div className="player-info-panel" style={{borderColor: teamColor}}>
                <div className="info-header" style={{backgroundColor: teamColor}}>
                  <h3>{selectedPlayer.firstName} {selectedPlayer.lastName}</h3>
                  <button 
                    className="close-btn"
                    onClick={closePlayerInfo}
                  >×</button>
                </div>
                <div className="info-body">
                  <div className="player-details">
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaIdCard />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Jersey</div>
                        <div className="detail-value">{selectedPlayer.jersey || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaUser />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Position</div>
                        <div className="detail-value">{selectedPlayer.position || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaGraduationCap />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Year</div>
                        <div className="detail-value">{selectedPlayer.year || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaRulerVertical />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Height</div>
                        <div className="detail-value">{formatHeight(selectedPlayer.height)}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaWeight />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Weight</div>
                        <div className="detail-value">{selectedPlayer.weight ? `${selectedPlayer.weight} lbs` : 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaCity />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Hometown</div>
                        <div className="detail-value">{selectedPlayer.homeCity}, {selectedPlayer.homeState}</div>
                      </div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-icon" style={{backgroundColor: `${teamColor}20`, color: teamColor}}>
                        <FaFlag />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Country</div>
                        <div className="detail-value">{selectedPlayer.homeCountry || 'USA'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS styles in component */}
      <style>{`
        /* Fix for Leaflet icons */
        .leaflet-default-icon-path {
          background-image: url("https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png");
        }
        
        /* Base Styles */
        .roster-map-container {
          position: relative;
          padding: 0;
          overflow: hidden;
        }
        
        .loading-indicator, .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        
        .error-message {
          color: #e53935;
          font-weight: 500;
        }
        
        /* Controls Styling */
        .roster-map-controls {
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px 8px 0 0;
          border-bottom: 1px solid #eaeaea;
          position: relative;
          z-index: 1000;
        }
        
        .control-buttons {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .filter-toggle-button, .reset-button {
          border: none;
          border-radius: 30px;
          padding: 8px 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-toggle-button:hover, .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .filter-toggle-button svg, .reset-button svg {
          margin-right: 6px;
        }
        
        .search-container {
          margin-bottom: 15px;
        }
        
        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 30px;
          padding: 5px 15px;
          border: 2px solid;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        
        .search-input {
          border: none;
          outline: none;
          width: 100%;
          padding: 8px 10px;
          font-size: 16px;
        }
        
        /* Filter Panel */
        .filter-panel {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .filter-panel h3 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 18px;
        }
        
        .position-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .position-filter-button {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 500;
          cursor: pointer;
          border: 2px solid;
          transition: all 0.2s ease;
        }
        
        .position-filter-button:hover {
          transform: translateY(-2px);
        }
        
        /* Stats Styling */
        .map-stats {
          border-top: 1px solid #eaeaea;
          padding-top: 15px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-weight: 500;
        }
        
        .stat-value {
          font-weight: 600;
        }
        
        .top-states {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        
        .state-item {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 20px;
          padding: 0 5px 0 10px;
          font-size: 14px;
        }
        
        .state-name {
          margin-right: 8px;
        }
        
        .state-count {
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        
        /* Map Visualization */
        .map-visualization {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
        }
        
        /* Player Marker Styling */
        .player-marker-icon .marker-container {
          width: 40px;
          height: 40px;
          background: linear-gradient(145deg, var(--player-color), var(--player-light));
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.6);
          border: 2px solid white;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .player-marker-icon .marker-container:hover {
          transform: rotate(-45deg) scale(1.1);
        }
        
        .player-marker-icon .marker-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50% 50% 50% 0;
          background: linear-gradient(rgba(255, 255, 255, 0.3), transparent);
          z-index: 0;
        }
        
        .player-marker-icon .marker-initials {
          transform: rotate(45deg);
          color: white;
          font-weight: 700;
          font-size: 16px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          z-index: 1;
        }
        
        .player-marker-icon .marker-position {
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          background: var(--player-color);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .player-marker-icon .marker-container:hover .marker-position {
          opacity: 1;
        }
        
        /* Stadium Marker Styling */
        .stadium-marker-icon .stadium-container {
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, var(--team-light), var(--team-color));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.6);
          border: 3px solid white;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        
        .stadium-marker-icon .stadium-container:hover {
          transform: scale(1.1);
        }
        
        .stadium-marker-icon .stadium-logo {
          width: 80%;
          height: 80%;
          object-fit: contain;
          filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4));
        }
        
        .stadium-marker-icon .stadium-icon {
          color: white;
          font-size: 24px;
        }
        
        /* Popup Styling */
        .player-popup, .stadium-popup {
          text-align: center;
          padding: 5px;
        }
        
        .player-popup h3, .stadium-popup h3 {
          margin: 5px 0;
          font-size: 16px;
        }
        
        /* Player Info Panel */
        .player-info-panel {
          position: absolute;
          top: 80px;
          right: 20px;
          width: 300px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .info-header {
          padding: 15px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .info-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        
        .info-body {
          padding: 15px;
        }
        
        .player-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .detail-row {
          display: flex;
          align-items: center;
        }
        
        .detail-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        
        .detail-content {
          flex: 1;
        }
        
        .detail-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .detail-value {
          font-weight: 600;
          font-size: 16px;
        }
        
        /* Pulse Animation */
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--team-color-rgb), 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(var(--team-color-rgb), 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--team-color-rgb), 0); }
        }
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .player-info-panel {
            top: auto;
            right: auto;
            bottom: 10px;
            left: 10px;
            width: calc(100% - 20px);
          }
          
          .control-buttons {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default RosterMap;