import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  RadialBarChart, 
  RadialBar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";
import { 
  FaChartLine, 
  FaUsers, 
  FaCalendar, 
  FaTrophy, 
  FaInfoCircle 
} from "react-icons/fa";
import teamsService from "../services/teamsService";
import "../styles/TeamDetail.css";

// Advanced Gauge Component with More Customization
const ModernGauge = ({ 
  label, 
  rawValue, 
  minValue = 1, 
  maxValue = 45, 
  colors = {
    red: "#ff4d4d", 
    yellow: "#ffc700", 
    green: "#4caf50"
  } 
}) => {
  // Calculate normalized value and color zones
  const clampedValue = Math.max(minValue, Math.min(rawValue, maxValue));
  const normalizedValue = ((clampedValue - minValue) / (maxValue - minValue)) * 100;
  
  // Determine color based on value
  const getColorForValue = () => {
    if (clampedValue <= maxValue * 0.33) return colors.red;
    if (clampedValue <= maxValue * 0.66) return colors.yellow;
    return colors.green;
  };

  return (
    <motion.div 
      className="modern-gauge"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="gauge-content">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={[
              { value: normalizedValue, fill: getColorForValue() }
            ]}
          >
            <RadialBar 
              dataKey="value" 
              cornerRadius={10} 
              background={{ fill: "rgba(0,0,0,0.1)" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="gauge-value">
          <span className="value" style={{ color: getColorForValue() }}>
            {Math.round(clampedValue)}
          </span>
          <span className="label">{label}</span>
        </div>
      </div>
      <div className="gauge-tooltip">
        <FaInfoCircle />
        <span className="tooltip-text">
          This {label.toLowerCase()} rating is based on SP+ metrics
        </span>
      </div>
    </motion.div>
  );
};

// Performance Trend Chart Component
const PerformanceTrendChart = ({ data, metric }) => {
  return (
    <motion.div 
      className="performance-trend-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="chart-header">
        <FaChartLine /> {metric} Performance Trend
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#d4001c" 
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  
  // Enhanced state management
  const [teamData, setTeamData] = useState({
    team: null,
    teams: [],
    ratings: {},
    roster: [],
    schedule: [],
    performanceTrends: []
  });
  
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized helper functions
  const getTeamLogo = useMemo(() => {
    return (teamName) => {
      const foundTeam = teamData.teams.find(
        (t) => t.school.toLowerCase() === teamName?.toLowerCase()
      );
      return foundTeam?.logos?.[0] || "/photos/default_team.png";
    };
  }, [teamData.teams]);

  // Fetch all team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        
        // Parallel data fetching
        const [teamsData, foundTeam] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getTeamById(teamId)
        ]);

        // Fetch additional details
        const [ratings, roster, schedule] = await Promise.all([
          teamsService.getTeamRatings(foundTeam.school, 2024),
          teamsService.getTeamRoster(foundTeam.school, 2024),
          teamsService.getTeamSchedule(foundTeam.school, 2024)
        ]);

        // Prepare performance trends (example data structure)
        const performanceTrends = [
          { 
            week: 'Overall', 
            value: ratings.overall || 0 
          },
          { 
            week: 'Offense', 
            value: ratings.offense || 0 
          },
          { 
            week: 'Defense', 
            value: ratings.defense || 0 
          }
        ];

        setTeamData({
          team: foundTeam,
          teams: teamsData,
          ratings,
          roster,
          schedule,
          performanceTrends
        });
      } catch (err) {
        setError(`Error: ${err.message}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  // Loading and error states
  if (isLoading) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="loading-container"
    >
      Loading Team Details...
    </motion.div>
  );

  if (error) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="error-container"
    >
      {error}
    </motion.div>
  );

  // Destructure team data
  const { team, ratings, roster, schedule, performanceTrends } = teamData;

  return (
    <motion.div 
      className="team-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Sidebar */}
      <aside className="team-sidebar">
        <Link to="/teams" className="back-to-teams">
          ← Back to Teams
        </Link>
        
        <motion.img
          src={getTeamLogo(team.school)}
          alt={team.school}
          className="team-logo-large"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        <h1 className="team-name">{team.school}</h1>
        <p className="team-mascot">{team.mascot}</p>
        
        {/* Navigation Sections */}
        <nav className="team-nav">
          <button 
            onClick={() => setActiveSection('overview')}
            className={activeSection === 'overview' ? 'active' : ''}
          >
            <FaTrophy /> Overview
          </button>
          <button 
            onClick={() => setActiveSection('roster')}
            className={activeSection === 'roster' ? 'active' : ''}
          >
            <FaUsers /> Roster
          </button>
          <button 
            onClick={() => setActiveSection('schedule')}
            className={activeSection === 'schedule' ? 'active' : ''}
          >
            <FaCalendar /> Schedule
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="team-main-content">
        {activeSection === 'overview' && (
          <motion.div 
            className="team-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* SP+ Ratings */}
            <section className="team-ratings">
              <h2>Team Performance Metrics</h2>
              <div className="gauges-container">
                <ModernGauge 
                  label="Overall" 
                  rawValue={ratings.overall || 1} 
                />
                <ModernGauge 
                  label="Offense" 
                  rawValue={ratings.offense || 1} 
                />
                <ModernGauge 
                  label="Defense" 
                  rawValue={ratings.defense || 1} 
                />
              </div>
              
              {/* Performance Trend Chart */}
              <PerformanceTrendChart 
                data={performanceTrends} 
                metric="Team Performance" 
              />
            </section>
          </motion.div>
        )}

        {activeSection === 'roster' && (
          <motion.section 
            className="team-roster"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2>Team Roster</h2>
            <div className="roster-grid">
              {roster.map((player, index) => (
                <motion.div 
                  key={player.id || index} 
                  className="player-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="player-info">
                    <span className="player-name">{player.fullName}</span>
                    <span className="player-details">
                      {player.position} | {player.height} | {player.year}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {activeSection === 'schedule' && (
          <motion.section 
            className="team-schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2>Game Schedule</h2>
            {schedule.map((game, index) => (
              <motion.div 
                key={game.id || index} 
                className="schedule-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="game-teams">
                  <img 
                    src={getTeamLogo(game.homeTeam)} 
                    alt={game.homeTeam} 
                    className="team-logo" 
                  />
                  <span className="vs">vs</span>
                  <img 
                    src={getTeamLogo(game.awayTeam)} 
                    alt={game.awayTeam} 
                    className="team-logo" 
                  />
                </div>
                <div className="game-details">
                  <span className="game-date">{game.date}</span>
                  <span className="game-venue">{game.venue || 'TBD'}</span>
                  <span className="game-score">
                    {game.homePoints} - {game.awayPoints}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.section>
        )}
      </main>
    </motion.div>
  );
};

export default TeamDetail;