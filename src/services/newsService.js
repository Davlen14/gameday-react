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

export default { fetchNews, fetchCollegeFootballNews, fetchCollegeCoachNews };

