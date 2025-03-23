import React, { useState, useEffect } from 'react';
import { FaFootballBall, FaUserGraduate, FaSearch, FaFilter, FaSpinner, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import teamsService from '../services/teamsService';

const DraftNews = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftPicks, setDraftPicks] = useState([]);
  const [collegeTeams, setCollegeTeams] = useState([]);
  const [positionFilter, setPositionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [year] = useState(2024);
  const [positions, setPositions] = useState(['All']);

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchDraftData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch draft picks from the API
        const picksData = await teamsService.getDraftPicks(year);
        
        // Fetch college teams for logos
        const collegeTeamsData = await teamsService.getTeams(year);
        setCollegeTeams(collegeTeamsData);
        
        // Process and set draft picks
        if (picksData && picksData.length > 0) {
          setDraftPicks(picksData);
          
          // Extract unique positions for the filter
          const uniquePositions = [...new Set(picksData.map(pick => pick.position))];
          setPositions(['All', ...uniquePositions.sort()]);
        }
      } catch (err) {
        console.error("Error fetching draft data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDraftData();
  }, [year]);
  
  // Find college team logo
  const getCollegeLogo = (collegeTeam) => {
    const team = collegeTeams.find(team => team.school === collegeTeam);
    return team?.logos?.[0] || `/photos/${collegeTeam.replace(/\s+/g, '')}.png`;
  };
  
  // Format height from inches to feet and inches
  const formatHeight = (heightInInches) => {
    if (!heightInInches) return "N/A";
    const feet = Math.floor(heightInInches / 12);
    const inches = heightInInches % 12;
    return `${feet}'${inches}"`;
  };
  
  // Toggle player details
  const togglePlayerDetails = (pickId) => {
    setSelectedPlayer(selectedPlayer === pickId ? null : pickId);
  };
  
  // Filter draft picks by position and search term
  const filteredPicks = draftPicks.filter(pick => {
    const matchesPosition = positionFilter === 'All' || pick.position === positionFilter;
    const matchesSearch = !searchTerm || 
      pick.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.collegeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.nflTeam?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPosition && matchesSearch;
  });

  return (
    <div className="draft-news-container">
      {/* CSS Styles */}
      <style>
        {`
          .draft-news-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
            font-family: 'Inter', 'Roboto', sans-serif;
          }
          
          .draft-news-header {
            text-align: center;
            margin-bottom: 2rem;
            position: relative;
          }
          
          .draft-news-header h1 {
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 0.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }
          
          .draft-news-header p {
            color: #666;
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
          }
          
          .draft-controls {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .search-bar {
            flex: 1;
            min-width: 250px;
            position: relative;
          }
          
          .search-bar input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid #ddd;
            border-radius: 30px;
            font-size: 1rem;
          }
          
          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
          }
          
          .filter-dropdown {
            min-width: 150px;
          }
          
          .filter-dropdown select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 30px;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: calc(100% - 10px) center;
            padding-right: 30px;
            font-size: 1rem;
          }
          
          .draft-list {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            border: 1px solid #eee;
          }
          
          .draft-pick {
            padding: 1rem;
            border-bottom: 1px solid #eee;
            transition: all 0.2s ease;
          }
          
          .draft-pick:hover {
            background-color: #f9f9f9;
          }
          
          .draft-pick-header {
            display: flex;
            align-items: center;
            cursor: pointer;
          }
          
          .pick-number {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #eee;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 1rem;
            flex-shrink: 0;
          }
          
          .team-info {
            display: flex;
            align-items: center;
            margin-right: 1.5rem;
            flex: 1;
          }
          
          .team-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-right: 0.75rem;
          }
          
          .team-name {
            font-weight: 600;
            font-size: 1rem;
          }
          
          .player-info {
            display: flex;
            align-items: center;
            flex: 2;
          }
          
          .college-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            margin-right: 0.75rem;
          }
          
          .player-name {
            font-weight: 600;
          }
          
          .player-position {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            background-color: #D4001C;
            color: white;
            border-radius: 4px;
            font-size: 0.75rem;
            margin-left: 0.5rem;
          }
          
          .player-college {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.25rem;
          }
          
          .toggle-details {
            margin-left: auto;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            border-radius: 50%;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .toggle-details:hover {
            background-color: #eee;
            color: #333;
          }
          
          .player-details {
            margin-top: 1rem;
            padding: 1rem;
            background-color: #f9f9f9;
            border-radius: 8px;
            font-size: 0.95rem;
            line-height: 1.5;
          }
          
          .details-row {
            display: flex;
            margin-bottom: 0.75rem;
          }
          
          .details-label {
            width: 120px;
            font-weight: 600;
            color: #555;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            text-align: center;
          }
          
          .loading-spinner {
            font-size: 3rem;
            color: #D4001C;
            animation: spin 1.5s linear infinite;
            margin-bottom: 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .error-container {
            padding: 2rem;
            text-align: center;
            color: #D4001C;
          }
          
          .draft-round-header {
            padding: 0.75rem 1rem;
            background-color: #f0f0f0;
            font-weight: 600;
            color: #333;
            border-bottom: 1px solid #ddd;
          }
          
          @media (max-width: 768px) {
            .draft-news-header h1 {
              font-size: 2rem;
            }
            
            .draft-pick-header {
              flex-wrap: wrap;
            }
            
            .team-info {
              margin-bottom: 0.75rem;
              flex-basis: 100%;
            }
            
            .player-info {
              flex-basis: 100%;
            }
            
            .toggle-details {
              margin-left: auto;
              margin-top: -2.5rem;
            }
          }
        `}
      </style>

      {/* Header */}
      <header className="draft-news-header">
        <h1>
          <FaUserGraduate />
          {year} NFL Draft Results
        </h1>
        <p>Explore the complete {year} NFL Draft results featuring top college football prospects</p>
      </header>

      {/* Search and Filter Controls */}
      <div className="draft-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search players, teams, or colleges..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <select 
            value={positionFilter} 
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Draft Picks List */}
      {isLoading ? (
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading draft data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <FaInfoCircle size={40} />
          <h3>Error loading draft data</h3>
          <p>{error}</p>
        </div>
      ) : filteredPicks.length === 0 ? (
        <div className="loading-container">
          <p>No draft picks found matching your criteria.</p>
        </div>
      ) : (
        <div className="draft-list">
          {/* Group picks by round */}
          {[...new Set(filteredPicks.map(pick => pick.round))].sort((a, b) => a - b).map(round => (
            <React.Fragment key={`round-${round}`}>
              <div className="draft-round-header">Round {round}</div>
              {filteredPicks
                .filter(pick => pick.round === round)
                .sort((a, b) => a.pick - b.pick)
                .map((pick, index) => (
                <div key={`${pick.overall}-${index}`} className="draft-pick">
                  <div 
                    className="draft-pick-header" 
                    onClick={() => togglePlayerDetails(`${pick.overall}-${index}`)}
                  >
                    <div className="pick-number">
                      {pick.overall}
                    </div>
                    <div className="team-info">
                      <img 
                        src={`/photos/nfl/${pick.nflTeam.toLowerCase().replace(/\s+/g, '')}.png`}
                        alt={pick.nflTeam} 
                        className="team-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/default_nfl.png";
                        }}
                      />
                      <div>
                        <div className="team-name">{pick.nflTeam}</div>
                      </div>
                    </div>
                    <div className="player-info">
                      <img 
                        src={getCollegeLogo(pick.collegeTeam)}
                        alt={pick.collegeTeam}
                        className="college-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/default_team.png";
                        }}
                      />
                      <div>
                        <div>
                          <span className="player-name">{pick.name}</span>
                          <span className="player-position">{pick.position}</span>
                        </div>
                        <div className="player-college">{pick.collegeTeam}</div>
                      </div>
                    </div>
                    <div className="toggle-details">
                      {selectedPlayer === `${pick.overall}-${index}` ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>
                  
                  {selectedPlayer === `${pick.overall}-${index}` && (
                    <div className="player-details">
                      <div className="details-row">
                        <div className="details-label">Height:</div>
                        <div>{formatHeight(pick.height)}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Weight:</div>
                        <div>{pick.weight ? `${pick.weight} lbs` : "N/A"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Conference:</div>
                        <div>{pick.collegeConference || "N/A"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Pre-Draft Rank:</div>
                        <div>{pick.preDraftRanking || "N/A"} Overall</div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Position Rank:</div>
                        <div>{pick.preDraftPositionRanking ? `#${pick.preDraftPositionRanking}` : "N/A"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Draft Grade:</div>
                        <div>{pick.preDraftGrade ? `${pick.preDraftGrade}/100` : "N/A"}</div>
                      </div>
                      {pick.hometownInfo && (
                        <div className="details-row">
                          <div className="details-label">Hometown:</div>
                          <div>{`${pick.hometownInfo.city}, ${pick.hometownInfo.state}`}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftNews;