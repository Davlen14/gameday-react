const fetchData = async (endpoint, params = {}) => {
  const url = `/api/proxy`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint, params }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch Error:", error.message);
    throw error;
  }
};

// Core API interaction functions
export const getGameById = async (gameId, year) => {
  const endpoint = "/games";
  const params = { id: gameId, year }; // Added year parameter
  const response = await fetchData(endpoint, params);
  return response?.[0] || null;
};

export const getTeams = async (year = 2024) => {
  const endpoint = "/teams";
  const params = { year }; // Use the provided year parameter
  const allTeams = await fetchData(endpoint, params);
  
  // Filter for only FBS teams
  return allTeams.filter(team => team.classification === "fbs");
};

// Fetch team talent composite rankings
export const getTeamTalent = async (year = 2024, team = null) => {
  const endpoint = "/talent";
  const params = { year };
  if (team) params.team = team;
  return await fetchData(endpoint, params);
};

export const getFCSTeams = async (year = 2024) => {
  const endpoint = "/teams";
  const params = { year }; // Use the provided year parameter
  const allTeams = await fetchData(endpoint, params);
  
  // Filter for only FCS teams
  return allTeams.filter(team => team.classification === "fcs");
};

// UPDATED: Added postseason support and year parameter
export const getGameMedia = async (year = 2024, query) => {
    const endpoint = "/games/media";
    let params;
    if (typeof query === "object" && query.seasonType === "postseason") {
        params = { year, seasonType: "postseason" };
    } else {
        params = { year, week: query };
    }
    return await fetchData(endpoint, params);
};

export const getTeamGameStats = async (gameId, team, year = 2024) => {
  const endpoint = "/games/teams";
  const params = { gameId, team, year };
  return await fetchData(endpoint, params);
};

// UPDATED: Added postseason support and year parameter
export const getGameWeather = async (year = 2024, query) => {
    const endpoint = "/games/weather";
    let params;
    if (typeof query === "object" && query.seasonType === "postseason") {
        params = { year, seasonType: "postseason" };
    } else {
        params = { year, week: query };
    }
    return await fetchData(endpoint, params);
};

// UPDATED: Added year parameter to getGames
export const getGames = async (query, year = 2024) => {
    const endpoint = "/games";
    let params;
  
    // If query is an object (for example, { seasonType: "postseason" })
    if (typeof query === "object" && query.seasonType === "postseason") {
      params = {
        year,
        seasonType: "postseason",
        division: "fbs",
        // No week parameter for postseason games
      };
    } else {
      // Otherwise, assume it's a regular season week number
      params = {
        year,
        seasonType: "regular",
        division: "fbs",
        week: query,
      };
    }
  
    return await fetchData(endpoint, params);
};

export const getAdvancedBoxScore = async (gameId, year = 2024) => {
  const endpoint = "/game/box/advanced";
  const params = { id: gameId, year };
  return await fetchData(endpoint, params);
};

export const getGameLines = async (year = 2024, team = null, seasonType = "regular") => {
    const endpoint = "/lines";
    const params = { year, seasonType };
    if (team) params.team = team;
    return await fetchData(endpoint, params);
};

export const getTeamStats = async (team, year = 2024) => {
  const statsEndpoint = "/stats/season"; // API endpoint for team stats
  const params = { year, team };
  
  try {
    console.log(`Fetching stats for team: ${team}`);
    const response = await fetchData(statsEndpoint, params);
    
    if (!Array.isArray(response) || response.length === 0) {
      console.error(`Unexpected or empty API response for ${team}:`, response);
      return [];
    }
    
    console.log(`Raw Team Stats for ${team}:`, response);
    
    // Return the full array of stats directly without filtering
    return response;
    
  } catch (error) {
    console.error(`Error fetching stats for ${team}:`, error);
    return [];
  }
};

export const getPolls = async (year = 2024, pollType = "ap", week = null) => {
    const endpoint = "/rankings";
    let params;
    if (week === "postseason") {
        // If the week is "postseason", set seasonType to "postseason" (no week parameter)
        params = { year, pollType, seasonType: "postseason" };
    } else {
        // Otherwise, set seasonType to "regular" and include the week parameter
        params = { year, pollType, seasonType: "regular" };
        if (week) {
            params.week = week;
        }
    }
    const data = await fetchData(endpoint, params);
    const mappedPolls = data.map(pollGroup => ({
        id: `${pollGroup.season}-${pollGroup.week}-${pollGroup.polls[0].poll.replace(/\s+/g, '-')}`,
        name: pollGroup.polls[0].poll,
        rankings: pollGroup.polls[0].ranks.map(team => ({
            school: team.school,
            conference: team.conference,
            rank: team.rank,
            points: team.points,
            firstPlaceVotes: team.firstPlaceVotes
        }))
    }));
    // For postseason, filter out non-FBS polls (keep only "AP Top 25" and "Coaches Poll"),
    // using trim() and toLowerCase() for safety.
    if (week === "postseason") {
        return mappedPolls.filter(poll => {
            const name = poll.name.trim().toLowerCase();
            return name === "ap top 25" || name === "coaches poll";
        });
    }
    return mappedPolls;
};

export const getPlayByPlay = async (gameId) => {
    const endpoint = "/live/plays";
    const params = { gameId };
    return await fetchData(endpoint, params);
};

// Updated FBS-specific functions
export const getTeamById = async (teamId, year = 2024) => {
    const endpoint = "/teams/fbs";
    const allTeams = await fetchData(endpoint, { year });

    const foundTeam = allTeams.find((team) => team.id === parseInt(teamId));
    if (!foundTeam) throw new Error(`Team with ID ${teamId} not found`);

    return foundTeam;
};

export const getTeamSchedule = async (team, year = 2024) => {
    const endpoint = "/games";

    // Fetch both regular season and postseason games
    const regularSeasonParams = { year, team, seasonType: "regular", division: "fbs" };
    const postseasonParams = { year, team, seasonType: "postseason", division: "fbs" };

    try {
        const [regularSeason, postseason] = await Promise.all([
            fetchData(endpoint, regularSeasonParams),
            fetchData(endpoint, postseasonParams),
        ]);

        const allGames = [...regularSeason, ...postseason];

        if (!allGames.length) {
            throw new Error("No schedule data found");
        }

        return allGames.map((game) => ({
            id: game.id,
            week: game.week,
            date: game.startDate,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            homePoints: game.homePoints || 0,
            awayPoints: game.awayPoints || 0,
            venue: game.venue || "TBD",
            conferenceGame: game.conferenceGame,
            neutralSite: game.neutralSite,
        }));
    } catch (error) {
        throw new Error("Error fetching schedule");
    }
};

export const getTeamRatings = async (team, year = 2024) => {
    const endpoint = "/ratings/sp";
    const params = { year, team }; // Ensure `team` is the team name (e.g., "Michigan")
    const response = await fetchData(endpoint, params);

    if (!response || response.length === 0) {
        throw new Error("No ratings data found");
    }

    const teamData = response.find((item) => item.team === team);
    if (!teamData) {
        throw new Error(`Ratings data not found for team: ${team}`);
    }

    return {
        overall: teamData.rating,
        offense: teamData.offense?.rating || "N/A",
        defense: teamData.defense?.rating || "N/A",
        specialTeams: teamData.specialTeams?.rating || "N/A",
        offenseRank: teamData.offense?.ranking || "N/A",
        defenseRank: teamData.defense?.ranking || "N/A",
    };
};

const getTeamVenue = async (teamId, year = 2024) => {
    const endpoint = "/venues";
    const params = { teamId, year };
    const response = await fetchData(endpoint, params);
    return response?.[0] || null;
};

const getAdvancedStats = async (teamId, year = 2024) => {
    const endpoint = "/stats/season/advanced";
    const params = { team: teamId, year };
    return await fetchData(endpoint, params);
};

const getTeamMatchup = async (team1, team2, year = 2024) => {
    const endpoint = "/teams/matchup";
    const params = { team1, team2, year };
    return await fetchData(endpoint, params);
};

// NEW ENDPOINTS ADDED FROM SWIFT SERVICE

export const getTeamRecords = async (teamId, year = 2024) => {
    const endpoint = "/records";
    const params = { teamId, year };
    return await fetchData(endpoint, params);
};

export const getPlayerSeasonStats = async (
  year = 2024,
  category = "passing",
  seasonType = "regular",
  limit = 100
) => {
  const endpoint = "/stats/player/season";
  
  // If the category passed in is "sacks", change it to "defensive"
  let effectiveCategory = category;
  if (category.toLowerCase() === "sacks") {
    effectiveCategory = "defensive";
  }

  const catParam = Array.isArray(effectiveCategory)
    ? effectiveCategory.join(",")
    : effectiveCategory;
    
  // Reintroduce the division parameter to filter by FBS
  const params = {
    year: String(year),
    category: catParam,
    seasonType,
    limit: String(limit),
    division: "fbs"
  };

  try {
    const response = await fetchData(endpoint, params);
    console.log(`getPlayerSeasonStats(${year}, ${category}) returned:`, response);
    return Array.isArray(response) ? response : response.data || [];
  } catch (error) {
    console.error(`Error in getPlayerSeasonStats for category "${category}":`, error);
    throw error;
  }
};

// Function to fetch player game stats
export const getPlayerGameStats = async (gameId, year = 2024, week = 1, seasonType = "regular", team = null, category = null) => {
  const endpoint = "/games/players";
  const params = { year, week };
  
  if (gameId) params.gameId = gameId;
  if (seasonType) params.seasonType = seasonType;
  if (team) params.team = team;
  if (category) params.category = category;

  try {
    const response = await fetchData(endpoint, params);
    console.log(`getPlayerGameStats called with params:`, params, "returned:", response);
    return response;
  } catch (error) {
    console.error(`Error in getPlayerGameStats for gameId "${gameId}":`, error);
    throw error;
  }
};

// UPDATED: Added postseason support for fetchScoreboard
export const fetchScoreboard = async (year = 2024, query) => {
    const endpoint = "/games";
    let params;
    if (typeof query === "object" && query.seasonType === "postseason") {
        params = { year, seasonType: "postseason" };
    } else {
        params = { year, week: query };
    }
    return await fetchData(endpoint, params);
};

export const getAllRecruits = async (year = 2025) => {
    const endpoint = "/recruiting/players";
    const params = { year };
    return await fetchData(endpoint, params);
};

export const getTeamRoster = async (team, year = 2024) => {
    const endpoint = "/roster";
    const params = { year, team }; // Ensure `team` is the team name (e.g., "Michigan")
    const response = await fetchData(endpoint, params);
  
    if (!response || response.length === 0) {
      throw new Error("No roster data found");
    }
  
    return response.map((player) => ({
      id: player.id || null,
      fullName: `${player.firstName || ""} ${player.lastName || ""}`.trim() || "Unknown Player",
      position: player.position || "N/A",
      height: player.height || "N/A",
      weight: player.weight || "N/A",
      year: player.year || "N/A",
      homeCity: player.homeCity || "N/A",
      homeState: player.homeState || "N/A",
    }));
  };


  // -------------------------
// Additional Endpoints
// -------------------------

// GET /calendar - Fetch the game calendar
export const getCalendar = async (year = 2024) => {
    const endpoint = "/calendar";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /drives - Fetch drive data for a given game
  export const getDrives = async (gameId, year = 2024) => {
    const endpoint = "/drives";
    const params = { gameId, year };
    return await fetchData(endpoint, params);
  };

  // Alias for getDrives
export const getGameDrives = async (gameId, year = 2024) => {
  return await getDrives(gameId, year);
};
  
  // GET /plays - Fetch general play-by-play data for a given game
  export const getPlays = async (gameId, year = 2024) => {
    const endpoint = "/plays";
    const params = { gameId, year };
    return await fetchData(endpoint, params);
  };
  
  // GET /plays/types - Fetch the types of plays
  export const getPlayTypes = async () => {
    const endpoint = "/plays/types";
    return await fetchData(endpoint);
  };
  
  export const getGamePlayers = async (gameId, year = 2024) => {
    try {
      console.log(`Fetching player data specifically for game ${gameId}`);
      
      // Direct endpoint for game-specific player stats
      const endpoint = "/games/players";
      const params = { gameId, year };
      
      const playerData = await fetchData(endpoint, params);
      
      if (!playerData || !Array.isArray(playerData) || playerData.length === 0) {
        console.warn(`No player data found for game ${gameId}, trying alternative endpoint`);
        // Fallback to the original implementation if the direct endpoint fails
        return await getPlayerGameStats(gameId, year, 1, "regular");
      }
      
      return playerData;
    } catch (error) {
      console.error(`Error fetching player data for game ${gameId}:`, error);
      // Try fallback approach
      try {
        console.log(`Attempting fallback player data fetch for game ${gameId}`);
        return await getPlayerGameStats(gameId, year, 1, "regular");
      } catch (fallbackError) {
        console.error(`Fallback player data fetch also failed:`, fallbackError);
        return []; // Return empty array to prevent null references
      }
    }
  };

  // Create a function that calls PPA endpoints for a specific game
export const getGamePPA = async (gameId, year = 2024) => {
  try {
    console.log(`Fetching PPA data specifically for game ${gameId}`);
    // Use a more targeted endpoint for game-specific PPA data
    const endpoint = "/ppa/players/games";
    const params = { gameId, year }; // Pass gameId directly as a parameter
    return await fetchData(endpoint, params);
  } catch (error) {
    console.error(`Error fetching PPA data for game ${gameId}:`, error);
    return []; // Return empty array on error to prevent null references
  }
};

  // GET /plays/stats - Fetch statistics for plays in a given game
  export const getPlaysStats = async (gameId, year = 2024) => {
    const endpoint = "/plays/stats";
    const params = { gameId, year };
    return await fetchData(endpoint, params);
  };
  
  // GET /plays/stats/types - Fetch the types for play statistics
  export const getPlaysStatsTypes = async () => {
    const endpoint = "/plays/stats/types";
    return await fetchData(endpoint);
  };
  
  // GET /conferences - Fetch conference information
  export const getConferences = async (year = 2024) => {
    const endpoint = "/conferences";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /coaches - Fetch coaches information
  export const getCoaches = async () => {
    const endpoint = "/coaches";
    return await fetchData(endpoint);
  };
  
// GET /player/search - Search for players based on a query
export const getPlayerSearch = async (searchTerm, year = 2024) => {
  const endpoint = "/player/search";
  const params = { searchTerm, year };
  return await fetchData(endpoint, params);
};
  
  // GET /player/usage - Fetch player usage data
  export const getPlayerUsage = async (year = 2024, team) => {
    const endpoint = "/player/usage";
    const params = { year, team };
    return await fetchData(endpoint, params);
  };
  
  // GET /player/returning - Fetch data on returning players
  export const getPlayerReturning = async (year = 2024) => {
    const endpoint = "/player/returning";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /player/portal - Fetch data from the player portal
  export const getPlayerPortal = async (year = 2024) => {
    const endpoint = "/player/portal";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /recruiting/teams - Fetch recruiting data for teams
  export const getRecruitingTeams = async (year = 2024) => {
    const endpoint = "/recruiting/teams";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /recruiting/groups - Fetch recruiting groups data
  export const getRecruitingGroups = async (year = 2024) => {
    const endpoint = "/recruiting/groups";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ratings/sp/conferences - Fetch SP ratings broken down by conference
  export const getRatingsSPConferences = async (year = 2024) => {
    const endpoint = "/ratings/sp/conferences";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ratings/srs - Fetch SRS (Simple Rating System) ratings
  export const getRatingsSRS = async (year = 2024) => {
    const endpoint = "/ratings/srs";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ratings/elo - Fetch Elo ratings
  export const getRatingsElo = async (year = 2024) => {
    const endpoint = "/ratings/elo";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ratings/fpi - Fetch FPI (Football Power Index) ratings
  export const getRatingsFPI = async (year = 2024) => {
    const endpoint = "/ratings/fpi";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ppa/predicted - Fetch predicted points (PPA) data
  export const getPPAPredicted = async (year = 2024) => {
    const endpoint = "/ppa/predicted";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ppa/teams - Fetch PPA data for teams
  export const getPPATeams = async (year = 2024) => {
    const endpoint = "/ppa/teams";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
// GET /ppa/players/season - Fetch PPA data for players for a specific team and year
export const getPPAPlayers = async (team, year = 2024) => {
  const endpoint = "/ppa/players/season";
  const params = { year, team };
  return await fetchData(endpoint, params);
};


  // GET /ppa/games - Fetch PPA data for games
  export const getPPAGames = async (year = 2024) => {
    const endpoint = "/ppa/games";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /ppa/players/games - Fetch PPA data for players in games
  export const getPPAPlayersGames = async (year = 2024) => {
    const endpoint = "/ppa/players/games";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  export const getMetricsWP = async (gameId, year = 2024) => {
    const endpoint = "/metrics/wp";
    const params = { gameId, year };
    return await fetchData(endpoint, params);
  };
  
  
  // GET /metrics/wp/pregame - Fetch pregame win probability metrics
  export const getMetricsWPPregame = async (year = 2024, week) => {
    const endpoint = "/metrics/wp/pregame";
    const params = { year, week };
    return await fetchData(endpoint, params);
  };
  
  // GET /metrics/fg/ep - Fetch field goal expected points metrics
  export const getMetricsFGEP = async (year = 2024, gameId) => {
    const endpoint = "/metrics/fg/ep";
    const params = { year, gameId };
    return await fetchData(endpoint, params);
  };
  
  // GET /stats/categories - Fetch statistical categories
  export const getStatsCategories = async () => {
    const endpoint = "/stats/categories";
    return await fetchData(endpoint);
  };
  
  // GET /stats/game/advanced - Fetch advanced game stats
  export const getStatsGameAdvanced = async (gameId, year = 2024) => {
    const endpoint = "/stats/game/advanced";
    const params = { gameId, year };
    return await fetchData(endpoint, params);
  };
  
  // GET /draft/teams - Fetch NFL draft teams data
  export const getDraftTeams = async (year = 2024) => {
    const endpoint = "/draft/teams";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /draft/positions - Fetch NFL draft positions data
  export const getDraftPositions = async (year = 2024) => {
    const endpoint = "/draft/positions";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /draft/picks - Fetch NFL draft picks data
  export const getDraftPicks = async (year = 2024) => {
    const endpoint = "/draft/picks";
    const params = { year };
    return await fetchData(endpoint, params);
  };
  
  // GET /wepa/team/season - Fetch adjusted team metrics (Wepa)
  export const getWepaTeamSeason = async (year = 2024, team) => {
    const endpoint = "/wepa/team/season";
    const params = { year, team };
    return await fetchData(endpoint, params);
  };
  
  // GET /wepa/players/passing - Fetch adjusted player passing metrics (Wepa)
  export const getWepaPlayersPassing = async (year = 2024, team) => {
    const endpoint = "/wepa/players/passing";
    const params = { year, team };
    return await fetchData(endpoint, params);
  };
  
  // GET /wepa/players/rushing - Fetch adjusted player rushing metrics (Wepa)
  export const getWepaPlayersRushing = async (year = 2024, team) => {
    const endpoint = "/wepa/players/rushing";
    const params = { year, team };
    return await fetchData(endpoint, params);
  };
  
  // GET /wepa/players/kicking - Fetch adjusted player kicking metrics (Wepa)
  export const getWepaPlayersKicking = async (year = 2024, team) => {
    const endpoint = "/wepa/players/kicking";
    const params = { year, team };
    return await fetchData(endpoint, params);
  };
  

// Export all functions
const teamsService = {
    getGameById,
    getTeams,
    getTeamTalent,
    getGames,
    getGameMedia,
    getGameWeather,
    getAdvancedBoxScore,
    getGameLines,
    getTeamStats,
    getPolls,
    getTeamRatings,
    getPlayByPlay,
    getTeamById,
    getTeamSchedule,
    getTeamRoster,
    getTeamVenue,
    getAdvancedStats,
    getTeamMatchup,
    // New endpoints added
    getTeamRecords,
    getPlayerSeasonStats,
    getPlayerGameStats,
    fetchScoreboard,
    getAllRecruits,
    getCalendar,
    getDrives,
    getPlays,
    getPlayTypes,
    getPlaysStats,
    getPlaysStatsTypes,
    getConferences,
    getCoaches,
    getPlayerSearch,
    getPlayerUsage,
    getPlayerReturning,
    getPlayerPortal,
    getRecruitingTeams,
    getRecruitingGroups,
    getRatingsSPConferences,
    getRatingsSRS,
    getRatingsElo,
    getRatingsFPI,
    getPPAPredicted,
    getTeamGameStats,
    getFCSTeams,
    getPPATeams,
    getPPAGames,
    getPPAPlayersGames,
    getPPAPlayers,
    getMetricsWP,
    getMetricsWPPregame,
    getMetricsFGEP,
    getGameDrives,
    getGamePlayers,
    getGamePPA,
    getStatsCategories,
    getStatsGameAdvanced,
    getDraftTeams,
    getDraftPositions,
    getDraftPicks,
    getWepaTeamSeason,
    getWepaPlayersPassing,
    getWepaPlayersRushing,
    getWepaPlayersKicking,
};

export default teamsService;
