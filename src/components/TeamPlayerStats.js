import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const TeamPlayerStats = ({ teamName, year = 2024 }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        // Fetch PPA player data for the given team and year
        const data = await teamsService.getPPAPlayers(teamName, year);
        setPlayers(data);
      } catch (err) {
        setError(err.message || "Error fetching player stats.");
      } finally {
        setLoading(false);
      }
    };

    if (teamName) {
      fetchPlayerStats();
    }
  }, [teamName, year]);

  if (loading) {
    return (
      <div className="team-player-stats">
        <div className="loading-spinner">Loading player stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-player-stats">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  // Sort players by overall impact (totalPPA.all) in descending order
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalPPA.all - a.totalPPA.all
  );
  // Identify the top 5 impact players
  const impactPlayers = sortedPlayers.slice(0, 5);

  return (
    <div className="team-player-stats">
      <h1>
        {teamName} Player Stats ({year})
      </h1>

      <table>
        <thead>
          <tr>
            <th rowSpan="2">Name</th>
            <th rowSpan="2">Position</th>
            <th colSpan="8">Average PPA</th>
            <th colSpan="8">Total PPA</th>
          </tr>
          <tr>
            <th>All</th>
            <th>Pass</th>
            <th>Rush</th>
            <th>FirstDown</th>
            <th>SecondDown</th>
            <th>ThirdDown</th>
            <th>StandardDowns</th>
            <th>PassingDowns</th>
            <th>All</th>
            <th>Pass</th>
            <th>Rush</th>
            <th>FirstDown</th>
            <th>SecondDown</th>
            <th>ThirdDown</th>
            <th>StandardDowns</th>
            <th>PassingDowns</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player) => (
            <tr
              key={player.id}
              className={
                impactPlayers.find((p) => p.id === player.id)
                  ? "impact-row"
                  : ""
              }
            >
              <td>{player.name}</td>
              <td>{player.position}</td>
              <td>{player.averagePPA.all}</td>
              <td>{player.averagePPA.pass}</td>
              <td>{player.averagePPA.rush}</td>
              <td>{player.averagePPA.firstDown}</td>
              <td>{player.averagePPA.secondDown}</td>
              <td>{player.averagePPA.thirdDown}</td>
              <td>{player.averagePPA.standardDowns}</td>
              <td>{player.averagePPA.passingDowns}</td>
              <td>{player.totalPPA.all}</td>
              <td>{player.totalPPA.pass}</td>
              <td>{player.totalPPA.rush}</td>
              <td>{player.totalPPA.firstDown}</td>
              <td>{player.totalPPA.secondDown}</td>
              <td>{player.totalPPA.thirdDown}</td>
              <td>{player.totalPPA.standardDowns}</td>
              <td>{player.totalPPA.passingDowns}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Embedded CSS for modern styling */}
      <style>{`
        .team-player-stats {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 20px;
          background: #f7f7f7;
          color: #333;
          line-height: 1.6;
        }
        h1 {
          text-align: center;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
          padding: 8px 10px;
          border: 1px solid #eee;
          text-align: center;
          font-size: 0.9em;
        }
        th {
          background-color: #f4f4f4;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        .impact-row {
          background-color: #fff9c4 !important;
          font-weight: bold;
        }
        .loading-spinner,
        .error {
          text-align: center;
          padding: 20px;
          font-size: 1.2em;
        }
        @media (max-width: 768px) {
          th, td {
            padding: 6px 8px;
            font-size: 0.8em;
          }
          h1 {
            font-size: 1.6em;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamPlayerStats;


