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

    // Gemini API block - Modified to analyze all teams for seasons 2000-2024
    else if (endpoint === "/gemini") {
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing GEMINI_API_KEY" });
      }

      // Use the provided years parameter if given; otherwise, default to 2000-2024
      const years = params?.years || Array.from({ length: 25 }, (_, i) => i + 2000);

      try {
        // Fetch list of all FBS teams
        const teamsResponse = await fetch("https://api.collegefootballdata.com/teams/fbs", {
          headers: { Authorization: `Bearer ${process.env.COLLEGE_FOOTBALL_API_KEY}` },
        });

        if (!teamsResponse.ok) {
          console.error(`❌ Failed to fetch teams (${teamsResponse.status}):`, await teamsResponse.text());
          return res.status(500).json({ error: "Failed to fetch teams" });
        }

        const teams = await teamsResponse.json();
        console.log(`✅ Found ${teams.length} teams for analysis`);

        // Fetch season stats for each year in parallel and combine the results
        const allStatsArrays = await Promise.all(
          years.map(async (year) => {
            const statsResponse = await fetch(`https://api.collegefootballdata.com/stats/season?year=${year}`, {
              headers: { Authorization: `Bearer ${process.env.COLLEGE_FOOTBALL_API_KEY}` },
            });
            if (!statsResponse.ok) {
              console.error(`❌ Failed to fetch team stats for ${year} (${statsResponse.status}):`, await statsResponse.text());
              return [];
            }
            const statsData = await statsResponse.json();
            // Add a year property if needed for further analysis
            statsData.forEach(stat => stat.year = year);
            return statsData;
          })
        );
        const allStats = allStatsArrays.flat();

        // Build structured cumulative data for each team by summing stats across the years
        const teamsWithStats = teams.map(team => {
          const teamStats = allStats.filter(stat => stat.team === team.school);
          // Helper to sum a stat across all available records for this team
          const sumStat = (statName) =>
            teamStats.reduce((acc, cur) => acc + (Number(cur.statValue) || 0), 0);
          return {
            name: team.school,
            conference: team.conference,
            passingYards: teamStats.length > 0 ? sumStat("netPassingYards") : "N/A",
            rushingYards: teamStats.length > 0 ? sumStat("rushingYards") : "N/A",
            totalYards: teamStats.length > 0 ? sumStat("totalYards") : "N/A",
            pointsAllowed: teamStats.length > 0 ? sumStat("opponentPoints") : "N/A",
          };
        });

        // Prepare Gemini prompt with all team data and indicate the period
        const fullPrompt = `
Here is the cumulative season data for all FBS college football teams from 2000 to 2024. Provide an in-depth analysis:

${teamsWithStats
  .map(
    team => `
**${team.name} (${team.conference})**
- **Cumulative Passing Yards:** ${team.passingYards}
- **Cumulative Rushing Yards:** ${team.rushingYards}
- **Cumulative Total Yards:** ${team.totalYards}
- **Cumulative Points Allowed:** ${team.pointsAllowed}`
  )
  .join("\n\n")}

Based on these cumulative stats:
- Identify the top-performing offenses and defenses.
- Highlight any surprising teams that have overperformed or underperformed over this period.
- Predict potential playoff or championship contenders based on long-term trends.
        `;

        console.log(`🔍 Sending enriched prompt to Gemini with ${teams.length} teams (2000-2024 data)`);

        // Send the data to Gemini for analysis
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        });

        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json();
          console.error(`❌ Gemini API Error (${geminiResponse.status}):`, errorData);
          return res.status(geminiResponse.status).json({ error: errorData });
        }

        const geminiData = await geminiResponse.json();
        console.log("✅ Gemini API Response:", geminiData);
        return res.status(200).json({
          stats: teamsWithStats,
          ai_analysis: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini API",
        });
      } catch (error) {
        console.error("❌ Gemini Integration Error:", error.message);
        return res.status(500).json({ error: "Error processing Gemini integration" });
      }
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

      const graphqlResponse = await fetch(GRAPHQL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${COLLEGE_FOOTBALL_API_KEY}`,
        },
        body: JSON.stringify({ query: graphQLQuery }),
      });

      if (!graphqlResponse.ok) {
        const error = await graphqlResponse.json();
        console.error(`❌ GraphQL API Error (${graphqlResponse.status}):`, error);
        return res.status(graphqlResponse.status).json({ error });
      }

      const graphqlData = await graphqlResponse.json();
      console.log("✅ GraphQL API Response:", graphqlData);
      return res.status(200).json(graphqlData);
    }

    // Default fallback for other endpoints
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
