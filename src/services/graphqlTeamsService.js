// Simplified graphqlTeamsService.js – Now includes ratings, team info, scoreboard data, and game info

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

// SP+ team ratings (used for gauges)
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

// Detailed team ratings (for rating table)
export const getTeamDetailedRatings = async (team, year = 2024) => {
  const query = `
    query Ratings($where: ratingsBoolExp) {
      ratings(where: $where) {
        conference
        conferenceId
        elo
        fpi
        fpiAvgWinProbabilityRank
        fpiDefensiveEfficiency
        fpiGameControlRank
        fpiOffensiveEfficiency
        fpiOverallEfficiency
        fpiRemainingSosRank
        fpiResumeRank
        fpiSosRank
        fpiSpecialTeamsEfficiency
        fpiStrengthOfRecordRank
        spDefense
        spOffense
        spOverall
        spSpecialTeams
        srs
        team
        teamId
        year
      }
    }
  `;
  
  const variables = {
    where: {
      team: { _eq: team },
      year: { _eq: year }
    }
  };
  
  const data = await fetchData(query, variables);
  return data?.ratings?.[0] || null;
};

// Basic team information (needed for TeamDetail.js)
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
  const variables = {
    limit: 100,
    offset: 0,
    where: { division: { _eq: "fbs" } }
  };
  const data = await fetchData(query, variables);
  return data?.currentTeams || [];
};

// New function: Get detailed game scoreboard data (from the "scoreboard" table)
export const getGameScoreboard = async (gameId) => {
  const query = `
    query GetGameScoreboard($gameId: Int!) {
      scoreboard(where: { id: { _eq: $gameId } }) {
        id
        awayClassification
        awayConference
        awayConferenceAbbreviation
        awayId
        awayLineScores
        awayPoints
        awayTeam
        city
        conferenceGame
        currentClock
        currentPeriod
        currentPossession
        currentSituation
        homeClassification
        homeConference
        homeConferenceAbbreviation
        homeId
        homeLineScores
        homePoints
        homeTeam
        lastPlay
        moneylineAway
        moneylineHome
        neutralSite
        overUnder
        spread
        startDate
        startTimeTbd
        state
        status
        temperature
        tv
        venue
        weatherDescription
        windDirection
        windSpeed
      }
    }
  `;
  const variables = { gameId: parseInt(gameId) };
  const data = await fetchData(query, variables);
  return data?.scoreboard?.[0] || null;
};

// New function: Get detailed game information (from the "game_info" table)
// This query returns comprehensive game details including relationships for weather, lines, and media.
export const getGameInfo = async (gameId) => {
  const query = `
    query GetGameInfo($gameId: Int!) {
      game_info(where: { id: { _eq: $gameId } }) {
        id
        attendance
        awayClassification
        awayConference
        awayConferenceId
        awayEndElo
        awayLineScores
        awayPoints
        awayPostgameWinProb
        awayStartElo
        awayTeam
        awayTeamId
        conferenceGame
        excitement
        homeClassification
        homeConference
        homeConferenceId
        homeEndElo
        homeLineScores
        homePoints
        homePostgameWinProb
        homeStartElo
        homeTeam
        homeTeamId
        neutralSite
        notes
        season
        seasonType
        startDate
        startTimeTbd
        status
        venueId
        week
        weather {
          temperature
          weatherDescription
          windDirection
          windSpeed
        }
        mediaInfo {
          id
          network
          outlet
          // Add any additional fields needed
        }
        lines {
          provider
          spread
          overUnder
          // Add additional line fields if needed
        }
      }
    }
  `;
  const variables = { gameId: parseInt(gameId) };
  const data = await fetchData(query, variables);
  return data?.game_info?.[0] || null;
};

// Export only ratings and team info functions along with the new game/scoreboard exports
const graphqlTeamsService = {
  getTeams,                     // For basic team info needed by TeamDetail
  getTeamRatings,               // For gauge components
  getTeamDetailedRatings,       // For detailed ratings table
  getGameScoreboard,            // For detailed game scoreboard data
  getGameInfo,                  // For comprehensive game details from "game_info"
};

export default graphqlTeamsService;
