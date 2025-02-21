// teamsService.js – Updated to use GraphQL via the proxy

// Proxy-based API interaction using GraphQL
const fetchData = async (query, variables = {}) => {
    const url = `/api/proxy`;
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });
  
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
  
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors.map((e) => e.message).join(", "));
      }
      return result.data;
    } catch (error) {
      console.error("Fetch Error:", error.message);
      throw error;
    }
  };
  
  // 1. getGameById
  export const getGameById = async (gameId) => {
    const query = `
      query GetGameById($id: Int!) {
        games(where: { id: { _eq: $id } }) {
          id
          season
          seasonType
          week
          startDate
          homeTeam
          awayTeam
          homePoints
          awayPoints
          venue
        }
      }
    `;
    const variables = { id: gameId };
    const data = await fetchData(query, variables);
    return data?.games?.[0] || null;
  };
  
// 2. getTeams – using the new currentTeams query
export const getTeams = async () => {
    const query = `
      query CurrentTeams(
        $limit: Int,
        $offset: Int,
        $orderBy: [currentTeamsOrderBy!],
        $where: currentTeamsBoolExp
      ) {
        currentTeams(
          limit: $limit,
          offset: $offset,
          orderBy: $orderBy,
          where: $where
        ) {
          abbreviation
          classification
          conference
          conferenceId
          division
          school
          teamId
        }
      }
    `;
    // Adjust variables as needed; here we filter for FBS teams
    const variables = {
      limit: 100,
      offset: 0,
      where: { division: { _eq: "fbs" } }
    };
    const data = await fetchData(query, variables);
    return data?.currentTeams || [];
  };
  
  // 2A. getTeamLogo – using the historicalTeam query to fetch logos
  export const getTeamLogo = async (school) => {
    const query = `
      query HistoricalTeam($where: historicalTeamBoolExp) {
        historicalTeam(where: $where) {
          images
        }
      }
    `;
    // We use the school name to match the historical record
    const variables = { where: { school: { _eq: school } } };
    const data = await fetchData(query, variables);
    return data?.historicalTeam?.[0]?.images || null;
  };
  
  
  // 3. getGameMedia
  export const getGameMedia = async (year, queryParam) => {
    const query = `
      query GetGameMedia($year: Int!, $seasonType: String, $week: Int) {
        gameMedia(where: {
          year: { _eq: $year },
          ${typeof queryParam === "object" && queryParam.seasonType === "postseason" 
            ? "seasonType: { _eq: $seasonType }" 
            : "week: { _eq: $week }"}
        }) {
          id
          mediaUrl
          type
        }
      }
    `;
    let variables = { year };
    if (typeof queryParam === "object" && queryParam.seasonType === "postseason") {
      variables.seasonType = "postseason";
    } else {
      variables.week = queryParam;
    }
    const data = await fetchData(query, variables);
    return data?.gameMedia || [];
  };
  
  // 4. getGameWeather
  export const getGameWeather = async (year, queryParam) => {
    const query = `
      query GetGameWeather($year: Int!, $seasonType: String, $week: Int) {
        gameWeather(where: {
          year: { _eq: $year },
          ${typeof queryParam === "object" && queryParam.seasonType === "postseason" 
            ? "seasonType: { _eq: $seasonType }" 
            : "week: { _eq: $week }"}
        }) {
          id
          temperature
          conditions
        }
      }
    `;
    let variables = { year };
    if (typeof queryParam === "object" && queryParam.seasonType === "postseason") {
      variables.seasonType = "postseason";
    } else {
      variables.week = queryParam;
    }
    const data = await fetchData(query, variables);
    return data?.gameWeather || [];
  };
  
  // 5. getGames
  export const getGames = async (queryParam) => {
    const query = `
      query GetGames($year: Int!, $seasonType: String!, $division: String!, $week: Int) {
        games(where: {
          year: { _eq: $year },
          seasonType: { _eq: $seasonType },
          division: { _eq: $division },
          week: { _eq: $week }
        }) {
          id
          week
          startDate
          homeTeam
          awayTeam
          homePoints
          awayPoints
          venue
          conferenceGame
          neutralSite
        }
      }
    `;
    let variables = { year: 2024, division: "fbs" };
    if (typeof queryParam === "object" && queryParam.seasonType === "postseason") {
      variables.seasonType = "postseason";
      variables.week = null; // postseason games typically omit week
    } else {
      variables.seasonType = "regular";
      variables.week = queryParam;
    }
    const data = await fetchData(query, variables);
    return data?.games || [];
  };
  
  // 6. getAdvancedBoxScore
  export const getAdvancedBoxScore = async (gameId) => {
    const query = `
      query GetAdvancedBoxScore($id: Int!, $year: Int!) {
        advancedBoxScore(where: { id: { _eq: $id }, year: { _eq: $year } }) {
          id
          stats {
            key
            value
          }
        }
      }
    `;
    const variables = { id: gameId, year: 2024 };
    const data = await fetchData(query, variables);
    return data?.advancedBoxScore?.[0] || null;
  };
  
  // 7. getGameLines
  export const getGameLines = async (year, team = null, seasonType = "regular") => {
    const query = `
      query GetGameLines($year: Int!, $seasonType: String!, $team: String) {
        lines(where: {
          year: { _eq: $year },
          seasonType: { _eq: $seasonType }
          ${team ? ", team: { _eq: $team }" : ""}
        }) {
          id
          line
          team
        }
      }
    `;
    const variables = { year, seasonType };
    if (team) variables.team = team;
    const data = await fetchData(query, variables);
    return data?.lines || [];
  };
  
  // 8. getTeamStats
  export const getTeamStats = async (team, year) => {
    const query = `
      query GetTeamStats($year: Int!, $team: String!) {
        teamStats(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          statName
          statValue
        }
      }
    `;
    const variables = { year, team };
    try {
      const data = await fetchData(query, variables);
      const statsArray = data?.teamStats || [];
      const filtered = statsArray.filter((stat) =>
        ["netPassingYards", "rushingYards", "totalYards"].includes(stat.statName)
      );
      return filtered.reduce(
        (acc, stat) => {
          acc[stat.statName] = stat.statValue;
          return acc;
        },
        {
          netPassingYards: 0,
          rushingYards: 0,
          totalYards: 0,
        }
      );
    } catch (error) {
      console.error(`Error fetching stats for ${team}:`, error);
      return {
        netPassingYards: 0,
        rushingYards: 0,
        totalYards: 0,
      };
    }
  };
  
  // 9. getPolls
  export const getPolls = async (year = 2024, pollType = "ap", week = null) => {
    const query = `
      query GetPolls($year: Int!, $pollType: String!, $seasonType: String!, $week: Int) {
        polls(where: {
          year: { _eq: $year },
          pollType: { _eq: $pollType },
          seasonType: { _eq: $seasonType }
          ${week ? ", week: { _eq: $week }" : ""}
        }) {
          season
          week
          pollName
          ranks {
            school
            conference
            rank
            points
            firstPlaceVotes
          }
        }
      }
    `;
    let variables = { year, pollType };
    if (week === "postseason") {
      variables.seasonType = "postseason";
    } else {
      variables.seasonType = "regular";
      if (week) variables.week = week;
    }
    const data = await fetchData(query, variables);
    const polls = data?.polls || [];
    return polls.map((pollGroup) => ({
      id: `${pollGroup.season}-${pollGroup.week}-${pollGroup.pollName.replace(/\s+/g, "-")}`,
      name: pollGroup.pollName,
      rankings: pollGroup.ranks.map((team) => ({
        school: team.school,
        conference: team.conference,
        rank: team.rank,
        points: team.points,
        firstPlaceVotes: team.firstPlaceVotes,
      })),
    }));
  };
  
  // 10. getPlayByPlay
  export const getPlayByPlay = async (gameId) => {
    const query = `
      query GetPlayByPlay($gameId: Int!) {
        playByPlay(where: { gameId: { _eq: $gameId } }) {
          id
          playDescription
          time
        }
      }
    `;
    const variables = { gameId };
    const data = await fetchData(query, variables);
    return data?.playByPlay || [];
  };
  
  // 11. getTeamById
  export const getTeamById = async (teamId) => {
    const query = `
      query GetTeamsForYear($year: Int!) {
        teams(where: { year: { _eq: $year }, division: { _eq: "fbs" } }) {
          id
          school
          conference
        }
      }
    `;
    const variables = { year: 2024 };
    const data = await fetchData(query, variables);
    const team = data?.teams.find((team) => team.id === parseInt(teamId));
    if (!team) throw new Error(`Team with ID ${teamId} not found`);
    return team;
  };
  
  // 12. getTeamSchedule
  export const getTeamSchedule = async (team, year = 2024) => {
    const query = `
      query GetTeamSchedule($year: Int!, $team: String!, $seasonType: String!, $division: String!) {
        games(where: {
          year: { _eq: $year },
          seasonType: { _eq: $seasonType },
          division: { _eq: $division },
          _or: [
            { homeTeam: { _eq: $team } },
            { awayTeam: { _eq: $team } }
          ]
        }) {
          id
          week
          startDate
          homeTeam
          awayTeam
          homePoints
          awayPoints
          venue
          conferenceGame
          neutralSite
        }
      }
    `;
    const regularVars = { year, team, seasonType: "regular", division: "fbs" };
    const postseasonVars = { year, team, seasonType: "postseason", division: "fbs" };
    try {
      const [regularData, postseasonData] = await Promise.all([
        fetchData(query, regularVars),
        fetchData(query, postseasonVars),
      ]);
      const allGames = [
        ...(regularData?.games || []),
        ...(postseasonData?.games || []),
      ];
      if (!allGames.length) throw new Error("No schedule data found");
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
  
  // 13. getTeamRatings
  export const getTeamRatings = async (team, year = 2024) => {
    const query = `
      query GetTeamRatings($year: Int!, $team: String!) {
        teamRatings(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          rating
          offense { rating, ranking }
          defense { rating, ranking }
          specialTeams { rating }
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    const teamData = data?.teamRatings?.[0];
    if (!teamData) throw new Error(`Ratings data not found for team: ${team}`);
    return {
      overall: teamData.rating,
      offense: teamData.offense?.rating || "N/A",
      defense: teamData.defense?.rating || "N/A",
      specialTeams: teamData.specialTeams?.rating || "N/A",
      offenseRank: teamData.offense?.ranking || "N/A",
      defenseRank: teamData.defense?.ranking || "N/A",
    };
  };
  
  // 14. getTeamVenue (internal)
  const getTeamVenue = async (teamId) => {
    const query = `
      query GetTeamVenue($teamId: Int!) {
        venues(where: { teamId: { _eq: $teamId } }) {
          id
          name
          location
        }
      }
    `;
    const variables = { teamId };
    const data = await fetchData(query, variables);
    return data?.venues?.[0] || null;
  };
  
  // 15. getAdvancedStats (internal)
  const getAdvancedStats = async (teamId) => {
    const query = `
      query GetAdvancedStats($teamId: Int!) {
        advancedTeamStats(where: { teamId: { _eq: $teamId } }) {
          statName
          statValue
        }
      }
    `;
    const variables = { teamId };
    return await fetchData(query, variables);
  };
  
  // 16. getTeamMatchup (internal)
  const getTeamMatchup = async (team1, team2) => {
    const query = `
      query GetTeamMatchup($team1: String!, $team2: String!) {
        teamMatchup(where: { team1: { _eq: $team1 }, team2: { _eq: $team2 } }) {
          matchupData
        }
      }
    `;
    const variables = { team1, team2 };
    return await fetchData(query, variables);
  };
  
  // 17. getTeamRecords
  export const getTeamRecords = async (teamId, year) => {
    const query = `
      query GetTeamRecords($teamId: Int!, $year: Int!) {
        teamRecords(where: { teamId: { _eq: $teamId }, year: { _eq: $year } }) {
          wins
          losses
          ties
        }
      }
    `;
    const variables = { teamId, year };
    const data = await fetchData(query, variables);
    return data?.teamRecords || [];
  };
  
  // 18. getPlayerSeasonStats
  export const getPlayerSeasonStats = async (year = 2024, category, seasonType = "regular", limit = 10000) => {
    const query = `
      query GetPlayerSeasonStats($year: Int!, $category: String!, $seasonType: String!, $limit: Int!) {
        playerSeasonStats(where: { year: { _eq: $year }, category: { _eq: $category }, seasonType: { _eq: $seasonType } }, limit: $limit) {
          playerId
          statName
          statValue
        }
      }
    `;
    const variables = { year, category, seasonType, limit };
    const data = await fetchData(query, variables);
    return data?.playerSeasonStats || [];
  };
  
  // 19. getPlayerGameStats
  export const getPlayerGameStats = async (gameId, year, week, seasonType, team, category = null) => {
    const query = `
      query GetPlayerGameStats($gameId: Int!, $year: Int!, $week: Int!, $seasonType: String!, $team: String!${category ? ", $category: String" : ""}) {
        playerGameStats(where: {
          gameId: { _eq: $gameId },
          year: { _eq: $year },
          week: { _eq: $week },
          seasonType: { _eq: $seasonType },
          team: { _eq: $team }
          ${category ? ", category: { _eq: $category }" : ""}
        }) {
          playerId
          statName
          statValue
        }
      }
    `;
    const variables = { gameId, year, week, seasonType, team };
    if (category) variables.category = category;
    const data = await fetchData(query, variables);
    return data?.playerGameStats || [];
  };
  
  // 20. fetchScoreboard
  export const fetchScoreboard = async (year, queryParam) => {
    const query = `
      query FetchScoreboard($year: Int!, $seasonType: String!, $week: Int) {
        games(where: {
          year: { _eq: $year },
          seasonType: { _eq: $seasonType },
          week: { _eq: $week }
        }) {
          id
          homeTeam
          awayTeam
          homePoints
          awayPoints
          startDate
        }
      }
    `;
    let variables = { year };
    if (typeof queryParam === "object" && queryParam.seasonType === "postseason") {
      variables.seasonType = "postseason";
      variables.week = null;
    } else {
      variables.seasonType = "regular";
      variables.week = queryParam;
    }
    const data = await fetchData(query, variables);
    return data?.games || [];
  };
  
  // 21. getAllRecruits
  export const getAllRecruits = async (year = 2025) => {
    const query = `
      query GetAllRecruits($year: Int!) {
        recruits(where: { year: { _eq: $year } }) {
          id
          name
          position
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.recruits || [];
  };
  
  // 22. getTeamRoster
  export const getTeamRoster = async (team, year = 2024) => {
    const query = `
      query GetTeamRoster($year: Int!, $team: String!) {
        roster(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          id
          firstName
          lastName
          position
          height
          weight
          year
          homeCity
          homeState
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    if (!data?.roster || data.roster.length === 0) {
      throw new Error("No roster data found");
    }
    return data.roster.map((player) => ({
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
  
  // 23. getCalendar
  export const getCalendar = async (year) => {
    const query = `
      query GetCalendar($year: Int!) {
        calendar(where: { year: { _eq: $year } }) {
          id
          date
          event
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.calendar || [];
  };
  
  // 24. getDrives
  export const getDrives = async (gameId) => {
    const query = `
      query GetDrives($gameId: Int!) {
        drives(where: { gameId: { _eq: $gameId } }) {
          id
          driveNumber
          description
        }
      }
    `;
    const variables = { gameId };
    const data = await fetchData(query, variables);
    return data?.drives || [];
  };
  
  // 25. getPlays
  export const getPlays = async (gameId) => {
    const query = `
      query GetPlays($gameId: Int!) {
        plays(where: { gameId: { _eq: $gameId } }) {
          id
          playDescription
          time
        }
      }
    `;
    const variables = { gameId };
    const data = await fetchData(query, variables);
    return data?.plays || [];
  };
  
  // 26. getPlayTypes
  export const getPlayTypes = async () => {
    const query = `
      query GetPlayTypes {
        playTypes {
          id
          typeName
        }
      }
    `;
    const data = await fetchData(query);
    return data?.playTypes || [];
  };
  
  // 27. getPlaysStats
  export const getPlaysStats = async (gameId) => {
    const query = `
      query GetPlaysStats($gameId: Int!) {
        playsStats(where: { gameId: { _eq: $gameId } }) {
          id
          statName
          statValue
        }
      }
    `;
    const variables = { gameId };
    const data = await fetchData(query, variables);
    return data?.playsStats || [];
  };
  
  // 28. getPlaysStatsTypes
  export const getPlaysStatsTypes = async () => {
    const query = `
      query GetPlaysStatsTypes {
        playsStatsTypes {
          id
          typeName
        }
      }
    `;
    const data = await fetchData(query);
    return data?.playsStatsTypes || [];
  };
  
  // 29. getConferences
  export const getConferences = async () => {
    const query = `
      query GetConferences {
        conferences {
          id
          name
        }
      }
    `;
    const data = await fetchData(query);
    return data?.conferences || [];
  };
  
  // 30. getCoaches
  export const getCoaches = async (year) => {
    const query = `
      query GetCoaches($year: Int!) {
        coaches(where: { year: { _eq: $year } }) {
          id
          name
          team
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.coaches || [];
  };
  
  // 31. getPlayerSearch
  export const getPlayerSearch = async (queryStr) => {
    const query = `
      query GetPlayerSearch($query: String!) {
        players(where: { name: { _ilike: $query } }) {
          id
          name
          team
        }
      }
    `;
    const variables = { query: `%${queryStr}%` };
    const data = await fetchData(query, variables);
    return data?.players || [];
  };
  
  // 32. getPlayerUsage
  export const getPlayerUsage = async (year, team) => {
    const query = `
      query GetPlayerUsage($year: Int!, $team: String!) {
        playerUsage(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          id
          usageStats
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    return data?.playerUsage || [];
  };
  
  // 33. getPlayerReturning
  export const getPlayerReturning = async (year) => {
    const query = `
      query GetPlayerReturning($year: Int!) {
        playerReturning(where: { year: { _eq: $year } }) {
          id
          name
          returningStatus
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.playerReturning || [];
  };
  
  // 34. getPlayerPortal
  export const getPlayerPortal = async (year) => {
    const query = `
      query GetPlayerPortal($year: Int!) {
        playerPortal(where: { year: { _eq: $year } }) {
          id
          name
          portalData
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.playerPortal || [];
  };
  
  // 35. getRecruitingTeams
  export const getRecruitingTeams = async (year) => {
    const query = `
      query GetRecruitingTeams($year: Int!) {
        recruitingTeams(where: { year: { _eq: $year } }) {
          id
          teamName
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.recruitingTeams || [];
  };
  
  // 36. getRecruitingGroups
  export const getRecruitingGroups = async (year) => {
    const query = `
      query GetRecruitingGroups($year: Int!) {
        recruitingGroups(where: { year: { _eq: $year } }) {
          id
          groupName
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.recruitingGroups || [];
  };
  
  // 37. getRatingsSPConferences
  export const getRatingsSPConferences = async (year) => {
    const query = `
      query GetRatingsSPConferences($year: Int!) {
        ratingsSPConferences(where: { year: { _eq: $year } }) {
          id
          conference
          rating
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ratingsSPConferences || [];
  };
  
  // 38. getRatingsSRS
  export const getRatingsSRS = async (year) => {
    const query = `
      query GetRatingsSRS($year: Int!) {
        ratingsSRS(where: { year: { _eq: $year } }) {
          id
          srs
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ratingsSRS || [];
  };
  
  // 39. getRatingsElo
  export const getRatingsElo = async (year) => {
    const query = `
      query GetRatingsElo($year: Int!) {
        ratingsElo(where: { year: { _eq: $year } }) {
          id
          elo
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ratingsElo || [];
  };
  
  // 40. getRatingsFPI
  export const getRatingsFPI = async (year) => {
    const query = `
      query GetRatingsFPI($year: Int!) {
        ratingsFPI(where: { year: { _eq: $year } }) {
          id
          fpi
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ratingsFPI || [];
  };
  
  // 41. getPPAPredicted
  export const getPPAPredicted = async (year) => {
    const query = `
      query GetPPAPredicted($year: Int!) {
        ppaPredicted(where: { year: { _eq: $year } }) {
          id
          predictedPoints
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ppaPredicted || [];
  };
  
  // 42. getPPATeams
  export const getPPATeams = async (year) => {
    const query = `
      query GetPPATeams($year: Int!) {
        ppaTeams(where: { year: { _eq: $year } }) {
          id
          team
          ppa
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ppaTeams || [];
  };
  
  // 43. getPPAGames
  export const getPPAGames = async (year) => {
    const query = `
      query GetPPAGames($year: Int!) {
        ppaGames(where: { year: { _eq: $year } }) {
          id
          gameId
          ppa
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ppaGames || [];
  };
  
  // 44. getPPAPlayersGames
  export const getPPAPlayersGames = async (year) => {
    const query = `
      query GetPPAPlayersGames($year: Int!) {
        ppaPlayersGames(where: { year: { _eq: $year } }) {
          id
          playerId
          gameId
          ppa
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.ppaPlayersGames || [];
  };
  
  // 45. getMetricsWP
  export const getMetricsWP = async (year, week) => {
    const query = `
      query GetMetricsWP($year: Int!, $week: Int!) {
        metricsWP(where: { year: { _eq: $year }, week: { _eq: $week } }) {
          id
          winProbability
        }
      }
    `;
    const variables = { year, week };
    const data = await fetchData(query, variables);
    return data?.metricsWP || [];
  };
  
  // 46. getMetricsWPPregame
  export const getMetricsWPPregame = async (year, week) => {
    const query = `
      query GetMetricsWPPregame($year: Int!, $week: Int!) {
        metricsWPPregame(where: { year: { _eq: $year }, week: { _eq: $week } }) {
          id
          pregameWinProbability
        }
      }
    `;
    const variables = { year, week };
    const data = await fetchData(query, variables);
    return data?.metricsWPPregame || [];
  };
  
  // 47. getMetricsFGEP
  export const getMetricsFGEP = async (year, gameId) => {
    const query = `
      query GetMetricsFGEP($year: Int!, $gameId: Int!) {
        metricsFGEP(where: { year: { _eq: $year }, gameId: { _eq: $gameId } }) {
          id
          expectedPoints
        }
      }
    `;
    const variables = { year, gameId };
    const data = await fetchData(query, variables);
    return data?.metricsFGEP || [];
  };
  
  // 48. getStatsCategories
  export const getStatsCategories = async () => {
    const query = `
      query GetStatsCategories {
        statsCategories {
          id
          name
        }
      }
    `;
    const data = await fetchData(query);
    return data?.statsCategories || [];
  };
  
  // 49. getStatsGameAdvanced
  export const getStatsGameAdvanced = async (gameId, year) => {
    const query = `
      query GetStatsGameAdvanced($gameId: Int!, $year: Int!) {
        statsGameAdvanced(where: { gameId: { _eq: $gameId }, year: { _eq: $year } }) {
          id
          statName
          statValue
        }
      }
    `;
    const variables = { gameId, year };
    const data = await fetchData(query, variables);
    return data?.statsGameAdvanced || [];
  };
  
  // 50. getDraftTeams
  export const getDraftTeams = async (year) => {
    const query = `
      query GetDraftTeams($year: Int!) {
        draftTeams(where: { year: { _eq: $year } }) {
          id
          team
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.draftTeams || [];
  };
  
  // 51. getDraftPositions
  export const getDraftPositions = async (year) => {
    const query = `
      query GetDraftPositions($year: Int!) {
        draftPositions(where: { year: { _eq: $year } }) {
          id
          position
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.draftPositions || [];
  };
  
  // 52. getDraftPicks
  export const getDraftPicks = async (year) => {
    const query = `
      query GetDraftPicks($year: Int!) {
        draftPicks(where: { year: { _eq: $year } }) {
          id
          pickNumber
          team
          player
        }
      }
    `;
    const variables = { year };
    const data = await fetchData(query, variables);
    return data?.draftPicks || [];
  };
  
  // 53. getWepaTeamSeason
  export const getWepaTeamSeason = async (year, team) => {
    const query = `
      query GetWepaTeamSeason($year: Int!, $team: String!) {
        wepaTeamSeason(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          id
          wepa
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    return data?.wepaTeamSeason || [];
  };
  
  // 54. getWepaPlayersPassing
  export const getWepaPlayersPassing = async (year, team) => {
    const query = `
      query GetWepaPlayersPassing($year: Int!, $team: String!) {
        wepaPlayersPassing(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          id
          wepa
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    return data?.wepaPlayersPassing || [];
  };
  
  // 55. getWepaPlayersRushing
  export const getWepaPlayersRushing = async (year, team) => {
    const query = `
      query GetWepaPlayersRushing($year: Int!, $team: String!) {
        wepaPlayersRushing(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          id
          wepa
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    return data?.wepaPlayersRushing || [];
  };
  
  // 56. getWepaPlayersKicking
  export const getWepaPlayersKicking = async (year, team) => {
    const query = `
      query GetWepaPlayersKicking($year: Int!, $team: String!) {
        wepaPlayersKicking(where: { year: { _eq: $year }, team: { _eq: $team } }) {
          id
          wepa
        }
      }
    `;
    const variables = { year, team };
    const data = await fetchData(query, variables);
    return data?.wepaPlayersKicking || [];
  };
  
  // Export all functions in teamsService
  const graphqlTeamsService = {
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
    getTeamVenue, // internal function (if needed elsewhere, you can export it)
    getAdvancedStats, // internal
    getTeamMatchup, // internal
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
  
  export default graphqlTeamsService;
  