import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaSearch, FaFilter, FaSpinner, FaInfoCircle, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaTrophy, FaRulerVertical, FaWeightHanging, FaUniversity, FaRankings } from 'react-icons/fa';
import teamsService from '../services/teamsService';

const DraftNews = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftPicks, setDraftPicks] = useState([]);
  const [collegeTeams, setCollegeTeams] = useState([]);
  const [nflTeams, setNflTeams] = useState([]);
  const [positionFilter, setPositionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [year] = useState(2024);
  const [positions, setPositions] = useState(['All']);
  const [roundFilter, setRoundFilter] = useState('All');
  const [availableRounds, setAvailableRounds] = useState(['All']);

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
        
        // Fetch NFL teams
        const nflTeamsData = await teamsService.getDraftTeams(year);
        setNflTeams(nflTeamsData);
        
        // Process and set draft picks
        if (picksData && picksData.length > 0) {
          setDraftPicks(picksData);
          
          // Extract unique positions for the filter
          const uniquePositions = [...new Set(picksData.map(pick => pick.position))];
          setPositions(['All', ...uniquePositions.sort()]);
          
          // Extract unique rounds for the filter
          const uniqueRounds = [...new Set(picksData.map(pick => pick.round))];
          setAvailableRounds(['All', ...uniqueRounds.sort((a, b) => a - b)]);
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
  
  // Find NFL team logo
  const getNflTeamLogo = (teamName) => {
    const team = nflTeams.find(team => 
      team.displayName.includes(teamName) || 
      team.location === teamName || 
      team.nickname === teamName
    );
    
    if (team && team.logo) {
      return team.logo;
    }
    
    // Fallback to default naming pattern
    return `/photos/nfl/${teamName.toLowerCase().replace(/\s+/g, '')}.png`;
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
  
  // Filter draft picks by position, round, and search term
  const filteredPicks = draftPicks.filter(pick => {
    const matchesPosition = positionFilter === 'All' || pick.position === positionFilter;
    const matchesRound = roundFilter === 'All' || pick.round === parseInt(roundFilter);
    const matchesSearch = !searchTerm || 
      pick.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.collegeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.nflTeam?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPosition && matchesRound && matchesSearch;
  });

  // Get draft grade color
  const getDraftGradeColor = (grade) => {
    if (!grade) return "#999";
    if (grade >= 90) return "#22c55e"; // Green
    if (grade >= 80) return "#3b82f6"; // Blue
    if (grade >= 70) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  // Get pick color class based on overall pick number
  const getPickNumberColorClass = (overall) => {
    if (overall <= 10) return "pick-number-top10";
    if (overall <= 32) return "pick-number-first";
    if (overall <= 64) return "pick-number-second";
    if (overall <= 105) return "pick-number-third";
    return "pick-number-later";
  };

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
            color: #333;
          }
          
          .draft-news-header {
            text-align: center;
            margin-bottom: 2.5rem;
            position: relative;
            background: linear-gradient(135deg, #0c2340 0%, #013369 100%);
            padding: 2.5rem 1rem;
            border-radius: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            color: white;
          }
          
          .draft-news-header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .draft-news-header p {
            color: rgba(255, 255, 255, 0.85);
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.5;
          }
          
          .draft-controls {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 1rem;
            margin-bottom: 2rem;
            background-color: white;
            padding: 1.25rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .search-bar {
            position: relative;
          }
          
          .search-bar input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .search-bar input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            outline: none;
          }
          
          .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
          }
          
          .filter-dropdown select {
            padding: 0.75rem 2.5rem 0.75rem 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            font-size: 1rem;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%236b7280' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: calc(100% - 10px) center;
            background-color: white;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .filter-dropdown select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            outline: none;
          }
          
          .draft-list {
            background-color: white;
            border-radius: 0.75rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            border: 1px solid #f1f5f9;
          }
          
          .draft-pick {
            border-bottom: 1px solid #f1f5f9;
            transition: all 0.2s ease;
          }
          
          .draft-pick:hover {
            background-color: #f8fafc;
          }
          
          .draft-pick-header {
            display: flex;
            align-items: center;
            padding: 1.25rem;
            cursor: pointer;
          }
          
          .pick-number {
            width: 48px;
            height: 48px;
            border-radius: 0.5rem;
            background-color: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 1.25rem;
            flex-shrink: 0;
            font-size: 1.125rem;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          }
          
          .pick-number-top10 {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fbbf24;
          }
          
          .pick-number-first {
            background-color: #e0f2fe;
            color: #0369a1;
            border: 1px solid #7dd3fc;
          }
          
          .pick-number-second {
            background-color: #f0fdf4;
            color: #166534;
            border: 1px solid #86efac;
          }
          
          .pick-number-third {
            background-color: #fef9c3;
            color: #854d0e;
            border: 1px solid #fde047;
          }
          
          .pick-number-later {
            background-color: #f1f5f9;
            color: #64748b;
            border: 1px solid #cbd5e1;
          }
          
          .team-info {
            display: flex;
            align-items: center;
            margin-right: 1.5rem;
            flex: 1;
            min-width: 150px;
          }
          
          .team-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            margin-right: 0.75rem;
            border-radius: 0.5rem;
            background-color: #f8fafc;
            padding: 0.25rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .team-name {
            font-weight: 600;
            font-size: 1rem;
            color: #1e293b;
          }
          
          .player-info {
            display: flex;
            align-items: center;
            flex: 2;
          }
          
          .college-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            margin-right: 0.75rem;
            border-radius: 0.5rem;
            background-color: #f8fafc;
            padding: 0.25rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .player-name {
            font-weight: 600;
            font-size: 1.125rem;
            color: #1e293b;
          }
          
          .player-position {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            background-color: #ef4444;
            color: white;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 0.5rem;
            text-transform: uppercase;
          }
          
          .player-college {
            color: #64748b;
            font-size: 0.9rem;
            margin-top: 0.25rem;
          }
          
          .toggle-details {
            margin-left: auto;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f1f5f9;
            border-radius: 50%;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .toggle-details:hover {
            background-color: #e2e8f0;
            color: #334155;
          }
          
          .player-details {
            padding: 1.25rem;
            background-color: #f8fafc;
            font-size: 0.95rem;
            line-height: 1.5;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
            border-top: 1px solid #e2e8f0;
          }
          
          .details-card {
            background-color: white;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
          }
          
          .details-card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #475569;
            font-weight: 600;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          
          .details-card-content {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
          }
          
          .details-card-secondary {
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 0.25rem;
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
            color: #3b82f6;
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
            color: #ef4444;
          }
          
          .draft-round-header {
            padding: 1rem;
            background-color: #0c2340;
            font-weight: 600;
            color: white;
            border-bottom: 1px solid #1e293b;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .draft-round-header-icon {
            background-color: #013369;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .draft-grade {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-weight: bold;
            font-size: 1.25rem;
            color: white;
          }
          
          .draft-grade-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-top: 0.25rem;
            text-align: center;
          }
          
          @media (max-width: 1024px) {
            .draft-controls {
              grid-template-columns: 1fr 1fr;
            }
          }
          
          @media (max-width: 768px) {
            .draft-controls {
              grid-template-columns: 1fr;
            }
            
            .draft-news-header h1 {
              font-size: 2rem;
            }
            
            .draft-pick-header {
              flex-wrap: wrap;
              gap: 1rem;
            }
            
            .team-info {
              margin-right: 0;
              flex-basis: 100%;
            }
            
            .player-info {
              flex-basis: 100%;
            }
            
            .toggle-details {
              position: absolute;
              top: 1.25rem;
              right: 1.25rem;
            }
            
            .player-details {
              grid-template-columns: 1fr;
            }
            
            .pick-number {
              margin-right: 0.75rem;
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
        <p>Explore the complete {year} NFL Draft results featuring top college football prospects and detailed player information</p>
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
            <option value="All">All Positions</option>
            {positions.filter(pos => pos !== 'All').map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-dropdown">
          <select 
            value={roundFilter} 
            onChange={(e) => setRoundFilter(e.target.value)}
          >
            <option value="All">All Rounds</option>
            {availableRounds.filter(round => round !== 'All').map(round => (
              <option key={round} value={round}>Round {round}</option>
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
          {roundFilter === 'All' ? 
            [...new Set(filteredPicks.map(pick => pick.round))]
              .sort((a, b) => a - b)
              .map(round => (
                <React.Fragment key={`round-${round}`}>
                  <div className="draft-round-header">
                    <div className="draft-round-header-icon">
                      <FaTrophy />
                    </div>
                    Round {round}
                  </div>
                  {filteredPicks
                    .filter(pick => pick.round === round)
                    .sort((a, b) => a.pick - b.pick)
                    .map((pick, index) => renderDraftPick(pick, index))}
                </React.Fragment>
              ))
            : 
            filteredPicks
              .sort((a, b) => a.overall - b.overall)
              .map((pick, index) => renderDraftPick(pick, index))
          }
        </div>
      )}
    </div>
  );
  
  // Helper function to render a draft pick
  function renderDraftPick(pick, index) {
    return (
      <div key={`${pick.overall}-${index}`} className="draft-pick">
        <div 
          className="draft-pick-header" 
          onClick={() => togglePlayerDetails(`${pick.overall}-${index}`)}
        >
          <div className={`pick-number ${getPickNumberColorClass(pick.overall)}`}>
            {pick.overall}
          </div>
          <div className="team-info">
            <img 
              src={getNflTeamLogo(pick.nflTeam)}
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
            <div className="details-card">
              <div className="details-card-header">
                <FaRulerVertical /> Height
              </div>
              <div className="details-card-content">{formatHeight(pick.height)}</div>
            </div>
            
            <div className="details-card">
              <div className="details-card-header">
                <FaWeightHanging /> Weight
              </div>
              <div className="details-card-content">{pick.weight ? `${pick.weight} lbs` : "N/A"}</div>
            </div>
            
            <div className="details-card">
              <div className="details-card-header">
                <FaUniversity /> College Conference
              </div>
              <div className="details-card-content">{pick.collegeConference || "N/A"}</div>
            </div>
            
            <div className="details-card">
              <div className="details-card-header">
                <FaMapMarkerAlt /> Hometown
              </div>
              {pick.hometownInfo ? (
                <>
                  <div className="details-card-content">{pick.hometownInfo.city}, {pick.hometownInfo.state}</div>
                  <div className="details-card-secondary">{pick.hometownInfo.country}</div>
                </>
              ) : (
                <div className="details-card-content">N/A</div>
              )}
            </div>
            
            <div className="details-card">
              <div className="details-card-header">
                <FaRankings /> Pre-Draft Rankings
              </div>
              <div className="details-card-content">#{pick.preDraftRanking || "N/A"} Overall</div>
              <div className="details-card-secondary">#{pick.preDraftPositionRanking || "N/A"} {pick.position}</div>
            </div>
            
            <div className="details-card" style={{ textAlign: 'center' }}>
              <div className="details-card-header">
                <FaTrophy /> Draft Grade
              </div>
              <div 
                className="draft-grade" 
                style={{ 
                  backgroundColor: getDraftGradeColor(pick.preDraftGrade),
                  margin: '0 auto' 
                }}
              >
                {pick.preDraftGrade || 'N/A'}
              </div>
              <div className="draft-grade-label">out of 100</div>
            </div>
            
            <div className="details-card">
              <div className="details-card-header">
                <FaTrophy /> Draft Selection
              </div>
              <div className="details-card-content">Round {pick.round}, Pick {pick.pick}</div>
              <div className="details-card-secondary">#{pick.overall} Overall</div>
            </div>
            
            <div className="details-card">
              <div className="details-card-header">
                <FaInfoCircle /> Player IDs
              </div>
              <div className="details-card-secondary">College ID: {pick.collegeAthleteId}</div>
              <div className="details-card-secondary">NFL ID: {pick.nflAthleteId}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default DraftNews;