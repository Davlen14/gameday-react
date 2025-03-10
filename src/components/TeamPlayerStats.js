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
  const impactPlayers = sortedPlayers.slice(0, 5);

  return (
    <div className="team-player-stats">
      <h1>
        {teamName} Player Stats ({year})
      </h1>

      <section className="impact-players">
        <h2>Impact Players</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Season</th>
              <th>Team</th>
              <th>Conference</th>
              <th>Avg PPA</th>
              <th>Total PPA</th>
            </tr>
          </thead>
          <tbody>
            {impactPlayers.map((player) => (
              <tr key={player.id} className="impact-row">
                <td>{player.name}</td>
                <td>{player.position}</td>
                <td>{player.season}</td>
                <td>{player.team}</td>
                <td>{player.conference}</td>
                <td>{player.averagePPA.all}</td>
                <td>{player.totalPPA.all}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="all-players">
        <h2>All Players</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Season</th>
              <th>Team</th>
              <th>Conference</th>
              <th>Avg PPA</th>
              <th>Total PPA</th>
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
                <td>{player.season}</td>
                <td>{player.team}</td>
                <td>{player.conference}</td>
                <td>{player.averagePPA.all}</td>
                <td>{player.totalPPA.all}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

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
        h2 {
          margin-top: 40px;
          margin-bottom: 10px;
          color: #444;
          border-bottom: 2px solid #ddd;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
          padding: 12px 15px;
          border: 1px solid #eee;
          text-align: left;
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
            padding: 10px;
          }
          h1 {
            font-size: 1.8em;
          }
          h2 {
            font-size: 1.4em;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamPlayerStats;
