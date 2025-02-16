import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const TeamDetail = () => {
  const { teamId } = useParams();
  const [allTeams, setAllTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Rankings");
  const [sortOption, setSortOption] = useState("Name");
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    roster: false,
    schedule: false,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        setAllTeams(teamsData);
        const foundTeam = teamsData.find((t) => t.id === parseInt(teamId, 10));
        if (!foundTeam) throw new Error("Team not found");
        setTeam(foundTeam);

        // Fetch related data concurrently
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

  const sortedRoster = useMemo(() => {
    switch (sortOption) {
      case "Name":
        return [...roster].sort((a, b) => a.fullName.localeCompare(b.fullName));
      case "Position":
        return [...roster].sort((a, b) =>
          (a.position || "").localeCompare(b.position || "")
        );
      case "Height":
        return [...roster].sort((a, b) => (a.height || 0) - (b.height || 0));
      case "Year":
        return [...roster].sort((a, b) => (a.year || 0) - (b.year || 0));
      default:
        return roster;
    }
  }, [roster, sortOption]);

  if (isLoading.team) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div>
      <Link to="/teams">← Back to All Teams</Link>
      
      {/* Team Header */}
      <div>
        <img
          src={team.logos?.[0] || "/photos/default_team.png"}
          alt={team.school}
          width="150"
          height="150"
          onError={(e) => (e.target.style.display = "none")}
        />
        <h1>{team.school}</h1>
        <p>{team.mascot}</p>
      </div>

      {/* Category Buttons */}
      <div>
        {["Rankings", "Roster", "Statistics", "Schedule", "News"].map((category) => (
          <button key={category} onClick={() => setSelectedCategory(category)}>
            {category}
          </button>
        ))}
      </div>

      {/* Display Data Based on Category */}
      {selectedCategory === "Rankings" && (
        <div>
          <h2>Ratings</h2>
          {isLoading.ratings ? <p>Loading ratings...</p> : (
            <div>
              <p>Overall Rating: {ratings.overall || "N/A"}</p>
              <p>Offense Rating: {ratings.offense || "N/A"}</p>
              <p>Defense Rating: {ratings.defense || "N/A"}</p>
            </div>
          )}
        </div>
      )}

      {selectedCategory === "Roster" && (
        <div>
          <h2>Roster</h2>
          {isLoading.roster ? <p>Loading roster...</p> : (
            <div>
              <label>Sort by:</label>
              <select onChange={(e) => setSortOption(e.target.value)} value={sortOption}>
                <option>Name</option>
                <option>Position</option>
                <option>Height</option>
                <option>Year</option>
              </select>
              <ul>
                {sortedRoster.length > 0 ? (
                  sortedRoster.map((player, index) => (
                    <li key={index}>
                      {player.fullName} - {player.position || "N/A"} - Height: {player.height} - Year: {player.year || "N/A"}
                    </li>
                  ))
                ) : (
                  <p>No roster data available.</p>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {selectedCategory === "Schedule" && (
        <div>
          <h2>Schedule</h2>
          {isLoading.schedule ? <p>Loading schedule...</p> : (
            <ul>
              {schedule.map((game, index) => (
                <li key={index}>
                  <span>{game.homeTeam} vs. {game.awayTeam} | Score: {game.homePoints} - {game.awayPoints} | Venue: {game.venue || "TBD"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedCategory === "News" && (
        <div>
          <h2>News</h2>
          <p>Coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;

