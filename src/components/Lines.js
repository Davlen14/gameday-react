// Lines.js
import React, { useEffect, useState } from "react";
import teamsService from "../services/teamsService";
import "../styles/Lines.css"; // Your custom CSS file

const Lines = () => {
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLines = async () => {
      try {
        // Pass year (2024) and seasonType ("regular")
        const response = await teamsService.getGameLines(2024, null, "regular");
        setLines(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLines();
  }, []);

  if (isLoading) {
    return <div>Loading lines for 2024...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="lines-container">
      <h1>2024 Lines</h1>
      {lines.length === 0 ? (
        <p>No lines data available for 2024.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Season</th>
              <th>Type</th>
              <th>Week</th>
              <th>Start Date</th>
              <th>Home Team</th>
              <th>Home Score</th>
              <th>Away Team</th>
              <th>Away Score</th>
              <th>Lines</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((game) => (
              <tr key={game.id}>
                <td data-label="ID">{game.id}</td>
                <td data-label="Season">{game.season}</td>
                <td data-label="Type">{game.seasonType}</td>
                <td data-label="Week">{game.week}</td>
                <td data-label="Start Date">{new Date(game.startDate).toLocaleString()}</td>
                <td data-label="Home Team">{game.homeTeam}</td>
                <td data-label="Home Score">{game.homeScore}</td>
                <td data-label="Away Team">{game.awayTeam}</td>
                <td data-label="Away Score">{game.awayScore}</td>
                <td data-label="Lines">
                  {game.lines && game.lines.length > 0 ? (
                    <ul>
                      {game.lines.map((line, index) => (
                        <li key={index}>
                          <strong>{line.provider}</strong>: Spread: {line.spread}, O/U: {line.overUnder}, Home ML: {line.homeMoneyline}, Away ML: {line.awayMoneyline}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No lines available"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Lines;