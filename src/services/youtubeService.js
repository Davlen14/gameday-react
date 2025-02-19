// src/services/youtubeService.js

/**
 * Fetches YouTube data using your proxy API endpoint.
 * @param {string} query - The search query. Defaults to "latest news".
 * @returns {Promise<object>} The API response data.
 */
const fetchYoutubeData = async (query = "latest news") => {
    const API_URL = "/api/proxy"; // Your proxy route
    const requestBody = {
      endpoint: "/youtube",
      params: { searchQuery: query },
    };
  
    try {
      console.log(`🔍 Fetching YouTube data with query: "${query}"...`);
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        console.error(`❌ YouTube API Error (${response.status}):`, await response.text());
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("✅ YouTube API Response:", data);
      return data;
    } catch (error) {
      console.error("❌ Fetch YouTube Error:", error.message);
      return { error: "Failed to fetch YouTube data. Please try again later." };
    }
  };
  
  export default { fetchYoutubeData };