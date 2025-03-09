// newsService.js

const API_URL = "/api/proxy"; // Proxy route

/**
 * Generic function to fetch news for a given query.
 */
const fetchNews = async (query = "college football") => {
  const requestBody = {
    endpoint: "/news",
    params: { searchQuery: query },
  };

  try {
    console.log(`🔍 Fetching news with query: "${query}"...`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`❌ API Error (${response.status}):`, await response.text());
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ News API Response:", data);
    return data;
  } catch (error) {
    console.error("❌ Fetch Error:", error.message);
    return { error: "Failed to fetch news. Please try again later." };
  }
};

/**
 * Fetches college football news.
 */
const fetchCollegeFootballNews = async () => {
  return await fetchNews("college football");
};

/**
 * Fetches college coach news.
 */
const fetchCollegeCoachNews = async () => {
  return await fetchNews("college coach news");
};

/**
 * Fetches transfer portal news.
 */
const fetchTransferPortalNews = async () => {
  return await fetchNews("college football transfer portal");
};

/**
 * Fetches news about high-profile transfers.
 */
const fetchHighProfileTransferNews = async () => {
  return await fetchNews("college football top transfers");
};

/**
 * Fetches news about transfer portal impact players.
 */
const fetchTransferImpactNews = async () => {
  return await fetchNews("college football transfer impact players");
};

/**
 * Fetches conference-specific transfer news.
 */
const fetchConferenceTransferNews = async (conference) => {
  return await fetchNews(`${conference} college football transfers`);
};

/**
 * Fetches team-specific transfer news.
 */
const fetchTeamTransferNews = async (team) => {
  return await fetchNews(`${team} football transfers`);
};

/**
 * Fetches NIL (Name, Image, Likeness) related transfer news.
 */
const fetchNILTransferNews = async () => {
  return await fetchNews("college football NIL transfers");
};

/**
 * Fetches quarterback transfer portal news.
 */
const fetchQBTransferNews = async () => {
  return await fetchNews("college football quarterback transfers");
};

/**
 * Fetches news about transfer rules and eligibility.
 */
const fetchTransferRulesNews = async () => {
  return await fetchNews("college football transfer portal rules eligibility");
};

export default { 
  fetchNews, 
  fetchCollegeFootballNews, 
  fetchCollegeCoachNews,
  fetchTransferPortalNews,
  fetchHighProfileTransferNews,
  fetchTransferImpactNews,
  fetchConferenceTransferNews,
  fetchTeamTransferNews,
  fetchNILTransferNews,
  fetchQBTransferNews,
  fetchTransferRulesNews
};