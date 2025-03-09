// Simplified graphqlTeamsService.js – Only includes ratings functionality

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

// Export only ratings-related functions
const graphqlTeamsService = {
  getTeams,          // Kept for basic team info needed by TeamDetail
  getTeamRatings,    // Used by gauge components
  getTeamDetailedRatings, // Used by ratings component
};

export default graphqlTeamsService;