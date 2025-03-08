import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import { FaMapMarkerAlt, FaTrophy, FaUsers } from "react-icons/fa";
import "../styles/TeamDetail.css";

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    roster: false,
    schedule: false,
  });
  const [error, setError] = useState(null);

  const getTeamLogo = (teamName) => {
    const foundTeam = allTeams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    if (newTeamId) {
      navigate(`/teams/${newTeamId}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        setAllTeams(teamsData);

        const foundTeam = teamsData.find(
          (t) => t.id === parseInt(teamId, 10)
        );
        if (!foundTeam) throw new Error("Team not found");
        setTeam(foundTeam);

        await Promise.all([
          fetchRatings(foundTeam.school),
          fetchRoster(foundTeam.school),
          fetchSchedule(foundTeam.school),
        ]);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading((prev) => ({ ...prev, team: false }));
      }
    };

    const fetchRatings = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, ratings: true }));
        const data = await teamsService.getTeamRatings(teamName, 2024);
        setRatings(data);
      } catch (err) {
        console.error("Error fetching ratings:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, ratings: false }));
      }
    };

    const fetchRoster = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, roster: true }));
        const data = await teamsService.getTeamRoster(teamName, 2024);
        setRoster(data);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, roster: false }));
      }
    };

    const fetchSchedule = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, schedule: true }));
        const data = await teamsService.getTeamSchedule(teamName, 2024);
        setSchedule(data);
      } catch (err) {
        console.error("Error fetching schedule:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, schedule: false }));
      }
    };

    fetchData();
  }, [teamId]);

  if (isLoading.team) return <div className="loading-screen">Loading team information...</div>;
  if (error) return <div className="error-screen">{error}</div>;
  if (!team) return <div className="not-found-screen">Team not found</div>;

  // Get team conference
  const teamConference = team.conference || "Independent";

  // Normalize ratings to a 0-5 scale for display purposes
  const normalizeRating = (value) => {
    if (!value) return 0;
    // Assuming SP+ ratings typically range from 0-45
    return parseFloat((value / 10).toFixed(1));
  };

  return (
    <div className="team-dashboard">
      {/* Top Bar */}
      <div className="team-top-bar">
        <Link to="/teams" className="back-button">
          ← Back
        </Link>
        <div className="team-selector">
          <div className="team-selector-label">TeamSelect:</div>
          <select 
            className="team-select" 
            value={teamId} 
            onChange={handleTeamChange}
          >
            {allTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.school}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Header */}
      <div className="team-header">
        <div className="team-logo-container">
          <img
            src={getTeamLogo(team.school)}
            alt={team.school}
            className="team-logo-large"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/photos/default_team.png";
            }}
          />
        </div>
        <div className="team-info">
          <h1 className="team-name">{team.school} {team.mascot}</h1>
          <div className="team-meta">
            <div className="meta-item">
              <FaMapMarkerAlt />
              <span>{team.location?.city}, {team.location?.state}</span>
            </div>
            <div className="meta-item">
              <FaTrophy />
              <span>{teamConference}</span>
            </div>
            <div className="meta-item">
              <FaUsers />
              <span>Division I ({team.classification})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* SP+ Ratings Card */}
        <div className="dashboard-card team-ratings-card">
          <div className="card-header">Current Player Statistics</div>
          <div className="card-body">
            <div className="rating-circles">
              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#d4001c ${normalizeRating(ratings.overall || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.overall || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">Miami, FL</span>
              </div>

              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#d4001c ${normalizeRating(ratings.offense || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.offense || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">ACC</span>
              </div>

              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#d4001c ${normalizeRating(ratings.defense || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.defense || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">FBS</span>
              </div>
            </div>
            
            <div className="rating-circles">
              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#4CAF50 ${normalizeRating(ratings.overall || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.overall || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">Miami, FL</span>
              </div>

              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#4CAF50 ${normalizeRating(ratings.offense || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.offense || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">ACC</span>
              </div>

              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#4CAF50 ${normalizeRating(ratings.defense || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.defense || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">FBS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Info Card */}
        <div className="dashboard-card team-info-card">
          <div className="card-header">About {team.school} Hurricanes</div>
          <div className="card-body">
            <table className="info-table">
              <tbody>
                <tr>
                  <td>Location:</td>
                  <td><strong>{team.location?.city}, {team.location?.state}</strong></td>
                </tr>
                <tr>
                  <td>Conference:</td>
                  <td><strong>{teamConference}</strong></td>
                </tr>
                <tr>
                  <td>Division:</td>
                  <td><strong>Division I ({team.classification})</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Card */}
        <div className="dashboard-card team-schedule-card">
          <div className="card-header">Current Position Statistics</div>
          <div className="card-body">
            <div className="rating-circles">
              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#d4001c ${normalizeRating(ratings.overall || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.overall || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">Miami, FL</span>
              </div>

              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#d4001c ${normalizeRating(ratings.offense || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.offense || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">ACC</span>
              </div>

              <div className="rating-circle">
                <div className="circle-outer" style={{ background: `conic-gradient(#d4001c ${normalizeRating(ratings.defense || 0) * 20}%, #f0f0f0 0)` }}>
                  <div className="circle-inner">
                    <span className="circle-value">{normalizeRating(ratings.defense || 0)}</span>
                  </div>
                </div>
                <span className="circle-label">FBS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Roster Card */}
        <div className="dashboard-card team-roster-card">
          <div className="card-header">Team Roster</div>
          <div className="card-body">
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Height</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player, index) => (
                  <tr key={index}>
                    <td>{player.fullName}</td>
                    <td>{player.position || "N/A"}</td>
                    <td>{player.height || "N/A"}</td>
                    <td>{player.year || "N/A"}</td>
                  </tr>
                ))}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      {isLoading.roster ? "Loading roster..." : "No roster information available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;