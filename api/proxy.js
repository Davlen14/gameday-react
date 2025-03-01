// handler.js (Proxy API handler)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { endpoint, params, prompt } = req.body;

  // Helper function: Fetch with timeout and retry
  async function fetchWithRetry(url, options = {}, retries = 3, timeout = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) {
        // If status is 504 and retries remain, retry with exponential backoff
        if (response.status === 504 && retries > 0) {
          console.warn(`Retrying ${url} in ${timeout}ms... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, timeout));
          return fetchWithRetry(url, options, retries - 1, timeout * 2);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timer);
      // If error is due to abort, treat as retryable if retries remain
      if (error.name === "AbortError" && retries > 0) {
        console.warn(`Timeout reached. Retrying ${url} in ${timeout}ms... (${retries - 1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, timeout));
        return fetchWithRetry(url, options, retries - 1, timeout * 2);
      }
      throw error;
    }
  }

  try {
    // Handle specific endpoints

    // News API block (general news)
    if (endpoint === "/news") {
      const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
      if (!GNEWS_API_KEY) {
        console.error("❌ Missing GNEWS_API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing GNEWS_API_KEY" });
      }

      const searchQuery = params?.searchQuery || "college football";
      const newsAPIURL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        searchQuery
      )}&token=${GNEWS_API_KEY}`;

      console.log(`🔍 Fetching news for query: ${searchQuery}`);

      const newsData = await fetchWithRetry(newsAPIURL);
      console.log("✅ News API Response:", newsData);
      return res.status(200).json(newsData);
    }

    // Gemini API block
    else if (endpoint === "/gemini") {
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing GEMINI_API_KEY" });
      }

      console.log(`🔍 Sending prompt to Gemini: ${prompt}`);
      const geminiURL = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
      const geminiData = await fetchWithRetry(geminiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt || "" }],
            },
          ],
        }),
      });
      console.log("✅ Gemini API Response:", geminiData);
      return res.status(200).json({
        message:
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini API",
      });
    }

    // YouTube API block
    else if (endpoint === "/youtube") {
      const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
      if (!YOUTUBE_API_KEY) {
        console.error("❌ Missing YOUTUBE_API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing YOUTUBE_API_KEY" });
      }

      const searchQuery = params?.searchQuery || "latest news";
      const youtubeAPIURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery
      )}&key=${YOUTUBE_API_KEY}`;

      console.log(`🔍 Fetching YouTube data for query: ${searchQuery}`);
      const youtubeData = await fetchWithRetry(youtubeAPIURL);
      console.log("✅ YouTube API Response:", youtubeData);
      return res.status(200).json(youtubeData);
    }

    // College Football News block (using GNews)
    else if (endpoint === "/collegefootball") {
      const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
      if (!GNEWS_API_KEY) {
        console.error("❌ Missing GNEWS_API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing GNEWS_API_KEY" });
      }

      const searchQuery = params?.searchQuery || "college football";
      const newsAPIURL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        searchQuery
      )}&token=${GNEWS_API_KEY}`;

      console.log(`🔍 Fetching college football news for query: ${searchQuery}`);
      const collegeNewsData = await fetchWithRetry(newsAPIURL);
      console.log("✅ College Football News API Response:", collegeNewsData);
      return res.status(200).json(collegeNewsData);
    }

    // New College Football API block (GraphQL)
    else if (endpoint === "/graphql") {
      const GRAPHQL_API_URL = `https://api.collegefootballdata.com/graphql`;  // Replace with your actual GraphQL endpoint
      const COLLEGE_FOOTBALL_API_KEY = process.env.COLLEGE_FOOTBALL_API_KEY;
      if (!COLLEGE_FOOTBALL_API_KEY) {
        console.error("❌ Missing COLLEGE_FOOTBALL_API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing COLLEGE_FOOTBALL_API_KEY" });
      }

      const graphQLQuery = `
        query {
          collegeFootballData {
            id
            name
            rank
            points
            // Other fields you need from GraphQL
          }
        }
      `;

      const graphqlData = await fetchWithRetry(GRAPHQL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${COLLEGE_FOOTBALL_API_KEY}`,
        },
        body: JSON.stringify({ query: graphQLQuery }),
      });
      console.log("✅ GraphQL API Response:", graphqlData);
      return res.status(200).json(graphqlData);
    }

    // Default fallback for other endpoints
    else {
      const API_URL = `https://apinext.collegefootballdata.com${endpoint}`;
      const API_KEY = process.env.API_KEY;
      if (!API_KEY) {
        console.error("❌ Missing API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing API_KEY" });
      }

      console.log(`🔍 Fetching CFB data from: ${API_URL}`);

      const url = new URL(API_URL);
      if (params) {
        Object.entries(params).forEach(([key, value]) =>
          url.searchParams.append(key, value)
        );
      }

      const cfbData = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      console.log("✅ CFB API Response:", cfbData);
      return res.status(200).json(cfbData);
    }
  } catch (error) {
    console.error("❌ Proxy Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}