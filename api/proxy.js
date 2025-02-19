export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { endpoint, params, prompt } = req.body;
  
    try {
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
  
        const newsResponse = await fetch(newsAPIURL);
        if (!newsResponse.ok) {
          console.error(`❌ News API Error (${newsResponse.status}):`, await newsResponse.text());
          return res
            .status(newsResponse.status)
            .json({ error: `News API error with status ${newsResponse.status}` });
        }
  
        const newsData = await newsResponse.json();
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
  
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
  
        if (!geminiResponse.ok) {
          const error = await geminiResponse.json();
          console.error(`❌ Gemini API Error (${geminiResponse.status}):`, error);
          return res.status(geminiResponse.status).json({ error });
        }
  
        const geminiData = await geminiResponse.json();
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
  
        const youtubeResponse = await fetch(youtubeAPIURL);
        if (!youtubeResponse.ok) {
          console.error(
            `❌ YouTube API Error (${youtubeResponse.status}):`,
            await youtubeResponse.text()
          );
          return res
            .status(youtubeResponse.status)
            .json({ error: `YouTube API error with status ${youtubeResponse.status}` });
        }
  
        const youtubeData = await youtubeResponse.json();
        console.log("✅ YouTube API Response:", youtubeData);
        return res.status(200).json(youtubeData);
      }
  
      // College Football News block (using GNews)
      else if (endpoint === "/collegefootball") {
        const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
        if (!GNEWS_API_KEY) {
          console.error("❌ Missing GNEWS_API_KEY in environment");
          return res
            .status(500)
            .json({ error: "Server misconfiguration: missing GNEWS_API_KEY" });
        }
  
        const searchQuery = params?.searchQuery || "college football";
        const newsAPIURL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
          searchQuery
        )}&token=${GNEWS_API_KEY}`;
  
        console.log(`🔍 Fetching college football news for query: ${searchQuery}`);
  
        const newsResponse = await fetch(newsAPIURL);
        if (!newsResponse.ok) {
          console.error(
            `❌ College Football News API Error (${newsResponse.status}):`,
            await newsResponse.text()
          );
          return res.status(newsResponse.status).json({
            error: `College Football News API error with status ${newsResponse.status}`,
          });
        }
  
        const newsData = await newsResponse.json();
        console.log("✅ College Football News API Response:", newsData);
        return res.status(200).json(newsData);
      }
  
      // Joel Klatt News block (using GNews)
      else if (endpoint === "/joelklatt") {
        const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
        if (!GNEWS_API_KEY) {
          console.error("❌ Missing GNEWS_API_KEY in environment");
          return res
            .status(500)
            .json({ error: "Server misconfiguration: missing GNEWS_API_KEY" });
        }
  
        const searchQuery = params?.searchQuery || "Joel Klatt";
        const newsAPIURL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
          searchQuery
        )}&token=${GNEWS_API_KEY}`;
  
        console.log(`🔍 Fetching Joel Klatt news for query: ${searchQuery}`);
  
        const newsResponse = await fetch(newsAPIURL);
        if (!newsResponse.ok) {
          console.error(
            `❌ Joel Klatt News API Error (${newsResponse.status}):`,
            await newsResponse.text()
          );
          return res.status(newsResponse.status).json({
            error: `Joel Klatt News API error with status ${newsResponse.status}`,
          });
        }
  
        const newsData = await newsResponse.json();
        console.log("✅ Joel Klatt News API Response:", newsData);
        return res.status(200).json(newsData);
      }
  
      // College Football Data API block (fallback for endpoints not covered above)
      else {
        const API_URL = `https://apinext.collegefootballdata.com${endpoint}`;
        const API_KEY = process.env.API_KEY;
  
        if (!API_KEY) {
          console.error("❌ Missing API_KEY in environment");
          return res
            .status(500)
            .json({ error: "Server misconfiguration: missing API_KEY" });
        }
  
        console.log(`🔍 Fetching CFB data from: ${API_URL}`);
  
        const url = new URL(API_URL);
        if (params) {
          Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        }
  
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        });
  
        if (!response.ok) {
          console.error(`❌ API Error (${response.status}):`, await response.text());
          return res
            .status(response.status)
            .json({ error: `API error with status ${response.status}` });
        }
  
        const data = await response.json();
        console.log("✅ CFB API Response:", data);
        return res.status(200).json(data);
      }
    } catch (error) {
      console.error("❌ Proxy Error:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
