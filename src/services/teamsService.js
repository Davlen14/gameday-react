// TeamsService.js
// =============================================================================
// This file handles all API interactions via a proxy for CORS. 
// The file has been modified to include an extended timeout and robust retry 
// mechanism (with exponential backoff) for 504 Gateway Timeout errors.
// =============================================================================

// Enhanced fetchData with AbortController, extended timeout, and exponential backoff
const fetchData = async (endpoint, params = {}, retries = 3, timeout = 10000) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);
  const url = `/api/proxy`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint, params }),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Retry on 504 (Gateway Timeout) if retries remain.
      if (response.status === 504 && retries > 0) {
        console.warn(`Retrying ${endpoint} in ${timeout}ms... (${4 - retries}/3)`);
        await new Promise(resolve => setTimeout(resolve, timeout));
        return fetchData(endpoint, params, retries - 1, timeout * 2); // Exponential backoff
      }
      const text = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${text}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // If aborted or 504 error, retry if possible
    if ((error.name === "AbortError" || error.message.includes("504")) && retries > 0) {
      console.warn(`Request aborted or timed out for ${endpoint}. Retrying in ${timeout}ms... (${4 - retries}/3)`);
      await new Promise(resolve => setTimeout(resolve, timeout));
      return fetchData(endpoint, params, retries - 1, timeout * 2);
    }
    console.error("Fetch Error:", error.message);
    throw error;
  }
};

// =============================================================================
// Core API interaction functions
// =============================================================================

export const getGameById = async (gameId) => {
  const endpoint = "/games";
  const params = { id: gameId }; // 'id' is the correct key for game lookup
  const response = await fetchData(endpoint, params);
  return response?.[0] || null;
};

export const getTeams = async () => {
  const endpoint = "/teams/fbs";
  const params = { year: 2024 };
  return await fetchData(endpoint, params);
};

// UPDATED: Added postseason support
export const getGameMedia = async (year, query) => {
  const endpoint = "/games/media";
  let params;
  if (typeof query === "object" && query.seasonType === "postseason") {
    params = { year, seasonType: "postseason" };
  } else {
    params = { year, week: query };
  }
  return await fetchData(endpoint, params);
};

export const getTeamGameStats = async (gameId, team, year) => {
  const endpoint = "/games/teams";
  const params = { gameId, team, year };
  return await fetchData(endpoint, params);
};

// UPDATED: Added postseason support
export const getGameWeather = async (year, query) => {
  const endpoint = "/games/weather";
  let params;
  if (typeof query === "object" && query.seasonType === "postseason") {
    params = { year, seasonType: "postseason" };
  } else {
    params = { year, week: query };
  }
  return await fetchData(endpoint, params);
};

export const getGames = async (query) => {
  const endpoint = "/games";
  let params;
  // If query is an object (e.g., { seasonType: "postseason" })
  if (typeof query === "object" && query.seasonType === "postseason") {
    params = {
      year: 2024,
      seasonType: "postseason",
      division: "fbs",
      // No week parameter for postseason games
    };
  } else {
    // Otherwise, assume it's a regular season week number
    params = {
      year: 2024,
      seasonType: "regular",
      division: "fbs",
      week: query,
    };
  }
  return await fetchData(endpoint, params);
};

export const getAdvancedBoxScore = async (gameId) => {
  const endpoint = "/game/box/advanced";
  const params = { id: gameId, year: 2024 };
  return await fetchData(endpoint, params);
};

export const getGameLines = async (year, team = null, seasonType = "regular") => {
  const endpoint = "/lines";
  const params = { year, seasonType };
  if (team) params.team = team;
  return await fetchData(endpoint, params);
};

export const getTeamStats = async (team, year) => {
  const statsEndpoint = "/stats/season"; // API endpoint for team stats
  const params = { year, team };

  try {
    console.log(`Fetching stats for team: ${team}`);
    const response = await fetchData(statsEndpoint, params);

    if (!Array.isArray(response) || response.length === 0) {
      console.error(`Unexpected or empty API response for ${team}:`, response);
      // Return default stats if no response or unexpected data
      return {
        netPassingYards: 0,
        rushingYards: 0,
        totalYards: 0,
        yardsAllowed: 0,
        pointsAllowed: 0,
        sacks: 0,
      };
    }

    console.log(`Raw Team Stats for ${team}:`, response);
    const stats = {
      netPassingYards: 0,
      rushingYards: 0,
      totalYards: 0,
      yardsAllowed: 0,
      pointsAllowed: 0,
      sacks: 0,
    };

    response.forEach((stat) => {
      if (stat.statName === "netPassingYards") {
        stats.netPassingYards = stat.statValue;
      } else if (stat.statName === "rushingYards") {
        stats.rushingYards = stat.statValue;
      } else if (stat.statName === "totalYards") {
        stats.totalYards = stat.statValue;
      } else if (stat.statName === "opponentTotalYards") {
        stats.yardsAllowed = stat.statValue;
      } else if (stat.statName === "opponentPoints") {
        stats.pointsAllowed = stat.statValue;
      } else if (stat.statName === "sacks") {
        stats.sacks = stat.statValue;
      }
    });

    console.log(`Mapped Stats for ${team}:`, stats);
    return stats;
  } catch (error) {
    console.error(`Error fetching stats for ${team}:`, error);
    return {
      netPassingYards: 0,
      rushingYards: 0,
      totalYards: 0,
      yardsAllowed: 0,
      pointsAllowed: 0,
      sacks: 0,
    };
  }
};

export const getPolls = async (year = 2024, pollType = "ap", week = null) => {
  const endpoint = "/rankings";
  let params;
  if (week === "postseason") {
    params = { year, pollType, seasonType: "postseason" };
  } else {
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
export const getTeamById = async (teamId) => {
  const endpoint = "/teams/fbs";
  const allTeams = await fetchData(endpoint, { year: 2024 });
  const foundTeam = allTeams.find((team) => team.id === parseInt(teamId));
  if (!foundTeam) throw new Error(`Team with ID ${teamId} not found`);
  return foundTeam;
};

export const getTeamSchedule = async (team, year = 2024) => {
  const endpoint = "/games";
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
  const params = { year, team };
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

const getTeamVenue = async (teamId) => {
  const endpoint = "/venues";
  const response = await fetchData(endpoint, { teamId });
  return response?.[0] || null;
};

const getAdvancedStats = async (teamId) => {
  const endpoint = "/stats/season/advanced";
  return await fetchData(endpoint, { team: teamId });
};

const getTeamMatchup = async (team1, team2) => {
  const endpoint = "/teams/matchup";
  return await fetchData(endpoint, { team1, team2 });
};

// NEW ENDPOINTS ADDED FROM SWIFT SERVICE

export const getTeamRecords = async (teamId, year) => {
  const endpoint = "/records";
  const params = { teamId, year };
  return await fetchData(endpoint, params);
};

export const getPlayerSeasonStats = async (
  year = 2024,
  category,
  seasonType = "regular",
  limit = 100
) => {
  const endpoint = "/stats/player/season";
  const catParam = Array.isArray(category) ? category.join(",") : category;
  const params = { year: String(year), category: catParam, seasonType, limit: String(limit) };

  try {
    const response = await fetchData(endpoint, params);
    console.log(`getPlayerSeasonStats(${year}, ${category}) returned:`, response);
    return Array.isArray(response) ? response : response.data || [];
  } catch (error) {
    console.error(`Error in getPlayerSeasonStats for category "${category}":`, error);
    throw error;
  }
};

export const getPlayerGameStats = async (gameId, year, week, seasonType, team, category = null) => {
  const endpoint = "/games/players";
  const params = { gameId, year, week, seasonType, team };
  if (category) params.category = category;

  try {
    const response = await fetchData(endpoint, params);
    console.log(`getPlayerGameStats(${gameId}, ${year}, ${week}, ${seasonType}, ${team}, ${category}) returned:`, response);
    return response;
  } catch (error) {
    console.error(`Error in getPlayerGameStats for gameId "${gameId}":`, error);
    throw error;
  }
};

export const fetchScoreboard = async (year, query) => {
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
  const params = { year, team };
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

export const getCalendar = async (year) => {
  const endpoint = "/calendar";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getDrives = async (gameId) => {
  const endpoint = "/drives";
  const params = { gameId };
  return await fetchData(endpoint, params);
};

export const getPlays = async (gameId) => {
  const endpoint = "/plays";
  const params = { gameId };
  return await fetchData(endpoint, params);
};

export const getPlayTypes = async () => {
  const endpoint = "/plays/types";
  return await fetchData(endpoint);
};

export const getPlaysStats = async (gameId) => {
  const endpoint = "/plays/stats";
  const params = { gameId };
  return await fetchData(endpoint, params);
};

export const getPlaysStatsTypes = async () => {
  const endpoint = "/plays/stats/types";
  return await fetchData(endpoint);
};

export const getConferences = async () => {
  const endpoint = "/conferences";
  return await fetchData(endpoint);
};

export const getCoaches = async (year) => {
  const endpoint = "/coaches";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getPlayerSearch = async (searchTerm) => {
  const endpoint = "/player/search";
  const params = { searchTerm };
  return await fetchData(endpoint, params);
};

export const getPlayerUsage = async (year, team) => {
  const endpoint = "/player/usage";
  const params = { year, team };
  return await fetchData(endpoint, params);
};

export const getPlayerReturning = async (year) => {
  const endpoint = "/player/returning";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getPlayerPortal = async (year) => {
  const endpoint = "/player/portal";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getRecruitingTeams = async (year) => {
  const endpoint = "/recruiting/teams";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getRecruitingGroups = async (year) => {
  const endpoint = "/recruiting/groups";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getRatingsSPConferences = async (year) => {
  const endpoint = "/ratings/sp/conferences";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getRatingsSRS = async (year) => {
  const endpoint = "/ratings/srs";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getRatingsElo = async (year) => {
  const endpoint = "/ratings/elo";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getRatingsFPI = async (year) => {
  const endpoint = "/ratings/fpi";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getPPAPredicted = async (year) => {
  const endpoint = "/ppa/predicted";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getPPATeams = async (year) => {
  const endpoint = "/ppa/teams";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getPPAGames = async (year) => {
  const endpoint = "/ppa/games";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getPPAPlayersGames = async (year) => {
  const endpoint = "/ppa/players/games";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getMetricsWP = async (year, week) => {
  const endpoint = "/metrics/wp";
  const params = { year, week };
  return await fetchData(endpoint, params);
};

export const getMetricsWPPregame = async (year, week) => {
  const endpoint = "/metrics/wp/pregame";
  const params = { year, week };
  return await fetchData(endpoint, params);
};

export const getMetricsFGEP = async (year, gameId) => {
  const endpoint = "/metrics/fg/ep";
  const params = { year, gameId };
  return await fetchData(endpoint, params);
};

export const getStatsCategories = async () => {
  const endpoint = "/stats/categories";
  return await fetchData(endpoint);
};

export const getStatsGameAdvanced = async (gameId, year) => {
  const endpoint = "/stats/game/advanced";
  const params = { gameId, year };
  return await fetchData(endpoint, params);
};

export const getDraftTeams = async (year) => {
  const endpoint = "/draft/teams";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getDraftPositions = async (year) => {
  const endpoint = "/draft/positions";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getDraftPicks = async (year) => {
  const endpoint = "/draft/picks";
  const params = { year };
  return await fetchData(endpoint, params);
};

export const getWepaTeamSeason = async (year, team) => {
  const endpoint = "/wepa/team/season";
  const params = { year, team };
  return await fetchData(endpoint, params);
};

export const getWepaPlayersPassing = async (year, team) => {
  const endpoint = "/wepa/players/passing";
  const params = { year, team };
  return await fetchData(endpoint, params);
};

export const getWepaPlayersRushing = async (year, team) => {
  const endpoint = "/wepa/players/rushing";
  const params = { year, team };
  return await fetchData(endpoint, params);
};

export const getWepaPlayersKicking = async (year, team) => {
  const endpoint = "/wepa/players/kicking";
  const params = { year, team };
  return await fetchData(endpoint, params);
};

// =============================================================================
// Export all functions
// =============================================================================

const teamsService = {
  getGameById,
  getTeams,
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
  getPPATeams,
  getPPAGames,
  getPPAPlayersGames,
  getMetricsWP,
  getMetricsWPPregame,
  getMetricsFGEP,
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