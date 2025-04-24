import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaSearch, FaFilter, FaSpinner, FaInfoCircle, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaTrophy, FaRulerVertical, FaWeightHanging, FaUniversity, FaListOl } from 'react-icons/fa';
import teamsService from '../services/teamsService';

const DraftNews = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collegeTeams, setCollegeTeams] = useState([]);
  const [nflTeams, setNflTeams] = useState([]);
  const [positionFilter, setPositionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [year] = useState(2025);
  const [positions, setPositions] = useState(['All', 'QB', 'WR', 'CB', 'WR/CB', 'EDGE', 'T', 'RB', 'TE', 'LB', 'DI', 'S', 'G', 'IOL']);
  const [roundFilter, setRoundFilter] = useState('All');
  const [availableRounds, setAvailableRounds] = useState(['All', 1]);

  // Mock draft picks for 2025 first round based on PFF's latest mock draft
  const [draftPicks, setDraftPicks] = useState([
    {
      overall: 1,
      pick: 1,
      round: 1,
      name: "Cam Ward",
      position: "QB",
      nflTeam: "Tennessee Titans",
      collegeTeam: "Miami",
      height: 75, // 6'3"
      weight: 220,
      collegeConference: "ACC",
      hometownInfo: { city: "West Columbia", state: "TX", country: "USA" },
      preDraftRanking: 20,
      preDraftPositionRanking: 1,
      preDraftGrade: 91.7,
      collegeAthleteId: "133244",
      nflAthleteId: "CAW133244"
    },
    {
      overall: 2,
      pick: 2,
      round: 1,
      name: "Travis Hunter",
      position: "WR/CB",
      nflTeam: "Cleveland Browns",
      collegeTeam: "Colorado",
      height: 73, // 6'1"
      weight: 185,
      collegeConference: "Big 12",
      hometownInfo: { city: "Suwanee", state: "GA", country: "USA" },
      preDraftRanking: 1,
      preDraftPositionRanking: 1,
      preDraftGrade: 90.3,
      collegeAthleteId: "160766",
      nflAthleteId: "TRH160766"
    },
    {
      overall: 3,
      pick: 3,
      round: 1,
      name: "Abdul Carter",
      position: "EDGE",
      nflTeam: "New York Giants",
      collegeTeam: "Penn State",
      height: 76, // 6'4"
      weight: 252,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Philadelphia", state: "PA", country: "USA" },
      preDraftRanking: 2,
      preDraftPositionRanking: 1,
      preDraftGrade: 92.4,
      collegeAthleteId: "164160",
      nflAthleteId: "ABC164160"
    },
    {
      overall: 4,
      pick: 4,
      round: 1,
      name: "Will Campbell",
      position: "T",
      nflTeam: "New England Patriots",
      collegeTeam: "LSU",
      height: 78, // 6'6"
      weight: 310,
      collegeConference: "SEC",
      hometownInfo: { city: "Monroe", state: "LA", country: "USA" },
      preDraftRanking: 6,
      preDraftPositionRanking: 1,
      preDraftGrade: 88.5,
      collegeAthleteId: "157106",
      nflAthleteId: "WIC157106"
    },
    {
      overall: 5,
      pick: 5,
      round: 1,
      name: "Ashton Jeanty",
      position: "RB",
      nflTeam: "Jacksonville Jaguars",
      collegeTeam: "Boise State",
      height: 70, // 5'10"
      weight: 215,
      collegeConference: "Mountain West",
      hometownInfo: { city: "Arlington", state: "TX", country: "USA" },
      preDraftRanking: 3,
      preDraftPositionRanking: 1,
      preDraftGrade: 89.2,
      collegeAthleteId: "157196",
      nflAthleteId: "ASJ157196"
    },
    {
      overall: 6,
      pick: 6,
      round: 1,
      name: "Armand Membou",
      position: "T",
      nflTeam: "Las Vegas Raiders",
      collegeTeam: "Missouri",
      height: 77, // 6'5"
      weight: 320,
      collegeConference: "SEC",
      hometownInfo: { city: "Kansas City", state: "MO", country: "USA" },
      preDraftRanking: 9,
      preDraftPositionRanking: 2,
      preDraftGrade: 87.4,
      collegeAthleteId: "125008",
      nflAthleteId: "ARM125008"
    },
    {
      overall: 7,
      pick: 7,
      round: 1,
      name: "Tyler Warren",
      position: "TE",
      nflTeam: "New York Jets",
      collegeTeam: "Penn State",
      height: 78, // 6'6"
      weight: 251,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Mechanicsville", state: "VA", country: "USA" },
      preDraftRanking: 12,
      preDraftPositionRanking: 1,
      preDraftGrade: 85.8,
      collegeAthleteId: "129798",
      nflAthleteId: "TYW129798"
    },
    {
      overall: 8,
      pick: 8,
      round: 1,
      name: "Jalon Walker",
      position: "LB/EDGE",
      nflTeam: "Carolina Panthers",
      collegeTeam: "Georgia",
      height: 76, // 6'4"
      weight: 245,
      collegeConference: "SEC",
      hometownInfo: { city: "Salisbury", state: "NC", country: "USA" },
      preDraftRanking: 25,
      preDraftPositionRanking: 1,
      preDraftGrade: 84.3,
      collegeAthleteId: "157070",
      nflAthleteId: "JAW157070"
    },
    {
      overall: 9,
      pick: 9,
      round: 1,
      name: "Kelvin Banks Jr.",
      position: "T",
      nflTeam: "New Orleans Saints",
      collegeTeam: "Texas",
      height: 78, // 6'6"
      weight: 320,
      collegeConference: "Big 12",
      hometownInfo: { city: "Houston", state: "TX", country: "USA" },
      preDraftRanking: 22,
      preDraftPositionRanking: 3,
      preDraftGrade: 83.7,
      collegeAthleteId: "163839",
      nflAthleteId: "KEB163839"
    },
    {
      overall: 10,
      pick: 10,
      round: 1,
      name: "Colston Loveland",
      position: "TE",
      nflTeam: "Chicago Bears",
      collegeTeam: "Michigan",
      height: 78, // 6'6"
      weight: 245,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Gooding", state: "ID", country: "USA" },
      preDraftRanking: 16,
      preDraftPositionRanking: 2,
      preDraftGrade: 85.3,
      collegeAthleteId: "158540",
      nflAthleteId: "COL158540"
    },
    {
      overall: 11,
      pick: 11,
      round: 1,
      name: "Mason Graham",
      position: "DI",
      nflTeam: "San Francisco 49ers",
      collegeTeam: "Michigan",
      height: 75, // 6'3"
      weight: 318,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Anaheim", state: "CA", country: "USA" },
      preDraftRanking: 5,
      preDraftPositionRanking: 1,
      preDraftGrade: 88.9,
      collegeAthleteId: "158535",
      nflAthleteId: "MAG158535"
    },
    {
      overall: 12,
      pick: 12,
      round: 1,
      name: "Tetairoa McMillan",
      position: "WR",
      nflTeam: "Dallas Cowboys",
      collegeTeam: "Arizona",
      height: 77, // 6'5"
      weight: 212,
      collegeConference: "Big 12",
      hometownInfo: { city: "Waipahu", state: "HI", country: "USA" },
      preDraftRanking: 4,
      preDraftPositionRanking: 1,
      preDraftGrade: 89.0,
      collegeAthleteId: "158735",
      nflAthleteId: "TEM158735"
    },
    {
      overall: 13,
      pick: 13,
      round: 1,
      name: "Jahdae Barron",
      position: "CB",
      nflTeam: "Miami Dolphins",
      collegeTeam: "Texas",
      height: 71, // 5'11"
      weight: 195,
      collegeConference: "Big 12",
      hometownInfo: { city: "Austin", state: "TX", country: "USA" },
      preDraftRanking: 11,
      preDraftPositionRanking: 1,
      preDraftGrade: 86.2,
      collegeAthleteId: "123105",
      nflAthleteId: "JAB123105"
    },
    {
      overall: 14,
      pick: 14,
      round: 1,
      name: "Jihaad Campbell",
      position: "LB",
      nflTeam: "Indianapolis Colts",
      collegeTeam: "Alabama",
      height: 75, // 6'3"
      weight: 232,
      collegeConference: "SEC",
      hometownInfo: { city: "Sicklerville", state: "NJ", country: "USA" },
      preDraftRanking: 13,
      preDraftPositionRanking: 1,
      preDraftGrade: 85.5,
      collegeAthleteId: "157013",
      nflAthleteId: "JIC157013"
    },
    {
      overall: 15,
      pick: 15,
      round: 1,
      name: "Shemar Stewart",
      position: "EDGE",
      nflTeam: "Atlanta Falcons",
      collegeTeam: "Texas A&M",
      height: 77, // 6'5"
      weight: 285,
      collegeConference: "SEC",
      hometownInfo: { city: "Opa Locka", state: "FL", country: "USA" },
      preDraftRanking: 31,
      preDraftPositionRanking: 3,
      preDraftGrade: 82.9,
      collegeAthleteId: "158675",
      nflAthleteId: "SHS158675"
    },
    {
      overall: 16,
      pick: 16,
      round: 1,
      name: "Will Johnson",
      position: "CB",
      nflTeam: "Arizona Cardinals",
      collegeTeam: "Michigan",
      height: 74, // 6'2"
      weight: 202,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Detroit", state: "MI", country: "USA" },
      preDraftRanking: 14,
      preDraftPositionRanking: 2,
      preDraftGrade: 85.0,
      collegeAthleteId: "158536",
      nflAthleteId: "WIJ158536"
    },
    {
      overall: 17,
      pick: 17,
      round: 1,
      name: "Walter Nolen",
      position: "DI",
      nflTeam: "Cincinnati Bengals",
      collegeTeam: "Mississippi",
      height: 76, // 6'4"
      weight: 300,
      collegeConference: "SEC",
      hometownInfo: { city: "Memphis", state: "TN", country: "USA" },
      preDraftRanking: 7,
      preDraftPositionRanking: 2,
      preDraftGrade: 87.8,
      collegeAthleteId: "158666",
      nflAthleteId: "WAN158666"
    },
    {
      overall: 18,
      pick: 18,
      round: 1,
      name: "Grey Zabel",
      position: "IOL",
      nflTeam: "Seattle Seahawks",
      collegeTeam: "North Dakota State",
      height: 78, // 6'6"
      weight: 325,
      collegeConference: "Missouri Valley",
      hometownInfo: { city: "Fargo", state: "ND", country: "USA" },
      preDraftRanking: 27,
      preDraftPositionRanking: 1,
      preDraftGrade: 83.3,
      collegeAthleteId: "125314",
      nflAthleteId: "GRZ125314"
    },
    {
      overall: 19,
      pick: 19,
      round: 1,
      name: "Donovan Ezeiruaku",
      position: "EDGE",
      nflTeam: "Tampa Bay Buccaneers",
      collegeTeam: "Boston College",
      height: 75, // 6'3"
      weight: 254,
      collegeConference: "ACC",
      hometownInfo: { city: "Williamstown", state: "NJ", country: "USA" },
      preDraftRanking: 17,
      preDraftPositionRanking: 2,
      preDraftGrade: 84.8,
      collegeAthleteId: "143824",
      nflAthleteId: "DOE143824"
    },
    {
      overall: 20,
      pick: 20,
      round: 1,
      name: "Emeka Egbuka",
      position: "WR",
      nflTeam: "Denver Broncos",
      collegeTeam: "Ohio State",
      height: 73, // 6'1"
      weight: 205,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Steilacoom", state: "WA", country: "USA" },
      preDraftRanking: 19,
      preDraftPositionRanking: 3,
      preDraftGrade: 84.2,
      collegeAthleteId: "145055",
      nflAthleteId: "EME145055"
    },
    {
      overall: 21,
      pick: 21,
      round: 1,
      name: "Shedeur Sanders",
      position: "QB",
      nflTeam: "Pittsburgh Steelers",
      collegeTeam: "Colorado",
      height: 74, // 6'2"
      weight: 215,
      collegeConference: "Big 12",
      hometownInfo: { city: "Canton", state: "TX", country: "USA" },
      preDraftRanking: 45,
      preDraftPositionRanking: 2,
      preDraftGrade: 79.5,
      collegeAthleteId: "131396",
      nflAthleteId: "SHS131396"
    },
    {
      overall: 22,
      pick: 22,
      round: 1,
      name: "Kenneth Grant",
      position: "DI",
      nflTeam: "Los Angeles Chargers",
      collegeTeam: "Michigan",
      height: 75, // 6'3"
      weight: 339,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Indianapolis", state: "IN", country: "USA" },
      preDraftRanking: 21,
      preDraftPositionRanking: 3,
      preDraftGrade: 83.9,
      collegeAthleteId: "162816",
      nflAthleteId: "KEG162816"
    },
    {
      overall: 23,
      pick: 23,
      round: 1,
      name: "Matthew Golden",
      position: "WR",
      nflTeam: "Green Bay Packers",
      collegeTeam: "Texas",
      height: 73, // 6'1"
      weight: 195,
      collegeConference: "Big 12",
      hometownInfo: { city: "Houston", state: "TX", country: "USA" },
      preDraftRanking: 24,
      preDraftPositionRanking: 4,
      preDraftGrade: 83.5,
      collegeAthleteId: "156165",
      nflAthleteId: "MAG156165"
    },
    {
      overall: 24,
      pick: 24,
      round: 1,
      name: "Derrick Harmon",
      position: "DI",
      nflTeam: "Minnesota Vikings",
      collegeTeam: "Oregon",
      height: 76, // 6'4"
      weight: 320,
      collegeConference: "Pac-12",
      hometownInfo: { city: "Detroit", state: "MI", country: "USA" },
      preDraftRanking: 42,
      preDraftPositionRanking: 4,
      preDraftGrade: 80.2,
      collegeAthleteId: "144962",
      nflAthleteId: "DEH144962"
    },
    {
      overall: 25,
      pick: 25,
      round: 1,
      name: "Donovan Jackson",
      position: "G",
      nflTeam: "Houston Texans",
      collegeTeam: "Ohio State",
      height: 73, // 6'1"
      weight: 315,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Bellaire", state: "TX", country: "USA" },
      preDraftRanking: 46,
      preDraftPositionRanking: 1,
      preDraftGrade: 79.3,
      collegeAthleteId: "145064",
      nflAthleteId: "DOJ145064"
    },
    {
      overall: 26,
      pick: 26,
      round: 1,
      name: "Luther Burden III",
      position: "WR",
      nflTeam: "Los Angeles Rams",
      collegeTeam: "Missouri",
      height: 71, // 5'11"
      weight: 208,
      collegeConference: "SEC",
      hometownInfo: { city: "St. Louis", state: "MO", country: "USA" },
      preDraftRanking: 15,
      preDraftPositionRanking: 2,
      preDraftGrade: 85.0,
      collegeAthleteId: "157170",
      nflAthleteId: "LUB157170"
    },
    {
      overall: 27,
      pick: 27,
      round: 1,
      name: "Mykel Williams",
      position: "EDGE",
      nflTeam: "Baltimore Ravens",
      collegeTeam: "Georgia",
      height: 77, // 6'5"
      weight: 265,
      collegeConference: "SEC",
      hometownInfo: { city: "Columbus", state: "GA", country: "USA" },
      preDraftRanking: 38,
      preDraftPositionRanking: 4,
      preDraftGrade: 81.0,
      collegeAthleteId: "157061",
      nflAthleteId: "MYW157061"
    },
    {
      overall: 28,
      pick: 28,
      round: 1,
      name: "Tyleik Williams",
      position: "DI",
      nflTeam: "Detroit Lions",
      collegeTeam: "Ohio State",
      height: 75, // 6'3"
      weight: 318,
      collegeConference: "Big Ten",
      hometownInfo: { city: "Manassas", state: "VA", country: "USA" },
      preDraftRanking: 41,
      preDraftPositionRanking: 5,
      preDraftGrade: 80.5,
      collegeAthleteId: "145080",
      nflAthleteId: "TYW145080"
    },
    {
      overall: 29,
      pick: 29,
      round: 1,
      name: "Trey Amos",
      position: "CB",
      nflTeam: "Washington Commanders",
      collegeTeam: "Mississippi",
      height: 73, // 6'1"
      weight: 195,
      collegeConference: "SEC",
      hometownInfo: { city: "New Orleans", state: "LA", country: "USA" },
      preDraftRanking: 28,
      preDraftPositionRanking: 3,
      preDraftGrade: 83.1,
      collegeAthleteId: "122628",
      nflAthleteId: "TRA122628"
    },
    {
      overall: 30,
      pick: 30,
      round: 1,
      name: "Malaki Starks",
      position: "S",
      nflTeam: "Buffalo Bills",
      collegeTeam: "Georgia",
      height: 73, // 6'1"
      weight: 205,
      collegeConference: "SEC",
      hometownInfo: { city: "Jefferson", state: "GA", country: "USA" },
      preDraftRanking: 8,
      preDraftPositionRanking: 1,
      preDraftGrade: 87.5,
      collegeAthleteId: "157069",
      nflAthleteId: "MAS157069"
    },
    {
      overall: 31,
      pick: 31,
      round: 1,
      name: "Tyler Booker",
      position: "G",
      nflTeam: "Kansas City Chiefs",
      collegeTeam: "Alabama",
      height: 77, // 6'5"
      weight: 325,
      collegeConference: "SEC",
      hometownInfo: { city: "New Haven", state: "CT", country: "USA" },
      preDraftRanking: 48,
      preDraftPositionRanking: 2,
      preDraftGrade: 78.8,
      collegeAthleteId: "157001",
      nflAthleteId: "TYB157001"
    },
    {
      overall: 32,
      pick: 32,
      round: 1,
      name: "Maxwell Hairston",
      position: "CB",
      nflTeam: "Philadelphia Eagles",
      collegeTeam: "Kentucky",
      height: 72, // 6'0"
      weight: 198,
      collegeConference: "SEC",
      hometownInfo: { city: "West Bloomfield", state: "MI", country: "USA" },
      preDraftRanking: 43,
      preDraftPositionRanking: 4,
      preDraftGrade: 80.1,
      collegeAthleteId: "146746",
      nflAthleteId: "MAH146746"
    }
  ]);

  // Fetch teams data on component mount
  useEffect(() => {
    const fetchTeamsData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch college teams for logos
        const collegeTeamsData = await teamsService.getTeams(year);
        setCollegeTeams(collegeTeamsData);
        
        // Fetch NFL teams
        const nflTeamsData = await teamsService.getDraftTeams(year);
        setNflTeams(nflTeamsData);
      } catch (err) {
        console.error("Error fetching teams data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamsData();
  }, [year]);
  
  // Find college team logo
  const getCollegeLogo = (collegeTeam) => {
    const team = collegeTeams.find(team => team.school === collegeTeam);
    return team?.logos?.[0] || `/photos/${collegeTeam.replace(/\s+/g, '')}.png`;
  };
  
  // Find NFL team logo
  const getNflTeamLogo = (teamName) => {
    const team = nflTeams.find(team => 
      team.displayName?.includes(teamName) || 
      team.location === teamName || 
      team.nickname === teamName
    );
    
    if (team && team.logo) {
      return team.logo;
    }
    
    // Fallback to default naming pattern
    return `/photos/nfl/${teamName.toLowerCase().replace(/\s+/g, '')}.png`;
  };
  
  // Format height from inches to feet and inches
  const formatHeight = (heightInInches) => {
    if (!heightInInches) return "N/A";
    const feet = Math.floor(heightInInches / 12);
    const inches = heightInInches % 12;
    return `${feet}'${inches}"`;
  };
  
  // Toggle player details
  const togglePlayerDetails = (pickId) => {
    setSelectedPlayer(selectedPlayer === pickId ? null : pickId);
  };
  
  // Filter draft picks by position, round, and search term
  const filteredPicks = draftPicks.filter(pick => {
    const matchesPosition = positionFilter === 'All' || pick.position === positionFilter || pick.position.includes(positionFilter);
    const matchesRound = roundFilter === 'All' || pick.round === parseInt(roundFilter);
    const matchesSearch = !searchTerm || 
      pick.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.collegeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.nflTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPosition && matchesRound && matchesSearch;
  });

  // Get draft grade color using custom color scheme
  const getDraftGradeColor = (grade) => {
    if (!grade) return "#4b4b6a"; // Secondary text color
    if (grade >= 90) return "#d4001c"; // Primary accent
    if (grade >= 85) return "#ff3b5f"; // Secondary accent
    if (grade >= 80) return "#ff7a92"; // Lighter accent
    if (grade >= 75) return "#4b4b6a"; // Secondary text
    return "#1a1a2e"; // Primary text
  };

  // Get pick color class based on overall pick number
  const getPickNumberColorClass = (overall) => {
    if (overall <= 5) return "pick-number-top5";
    if (overall <= 10) return "pick-number-top10";
    if (overall <= 20) return "pick-number-top20";
    if (overall <= 32) return "pick-number-first";
    return "pick-number-later";
  };

  return (
    <div className="draft-news-container">
      {/* CSS Styles */}
      <style>
        {`
          .draft-news-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
            font-family: 'Inter', 'Roboto', sans-serif;
            color: var(--text-primary);
            background-color: var(--bg-primary);
          }
          
          :root {
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --text-primary: #1a1a2e;
            --text-secondary: #4b4b6a;
            --accent-primary: #d4001c;
            --accent-secondary: #ff3b5f;
          }
          
          .draft-news-header {
            text-align: center;
            margin-bottom: 2.5rem;
            position: relative;
            background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
            padding: 2.5rem 1rem;
            border-radius: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            color: white;
          }
          
          .draft-news-header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .draft-news-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.5;
          }
          
          .draft-controls {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 1rem;
            margin-bottom: 2rem;
            background-color: var(--bg-secondary);
            padding: 1.25rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          
          .search-input {
            padding: 0.75rem 1rem;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 0.5rem;
            font-size: 1rem;
            width: 100%;
            transition: all 0.2s;
            background-color: white;
            display: flex;
            align-items: center;
          }
          
          .search-input input {
            border: none;
            background: transparent;
            flex: 1;
            font-size: 1rem;
            margin-left: 0.5rem;
            color: var(--text-primary);
          }
          
          .search-input input:focus {
            outline: none;
          }
          
          .filter-select {
            padding: 0.75rem 1rem;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 0.5rem;
            font-size: 1rem;
            background-color: white;
            color: var(--text-primary);
            cursor: pointer;
            min-width: 120px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
          }
          
          .filter-select select {
            border: none;
            background: transparent;
            font-size: 1rem;
            color: var(--text-primary);
            cursor: pointer;
            appearance: none;
            width: 100%;
          }
          
          .filter-select select:focus {
            outline: none;
          }
          
          .draft-picks-list {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          
          .draft-pick-card {
            background-color: var(--bg-secondary);
            border-radius: 0.75rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            transition: all 0.2s;
          }
          
          .draft-pick-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          
          .draft-pick-header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 1rem;
            align-items: center;
            padding: 1.25rem;
            cursor: pointer;
          }
          
          .pick-number {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
            border-radius: 50%;
            color: white;
          }
          
          .pick-number-top5 {
            background: linear-gradient(135deg, #d4001c 0%, #ff3b5f 100%);
          }
          
          .pick-number-top10 {
            background: linear-gradient(135deg, #ff3b5f 0%, #ff7a92 100%);
          }
          
          .pick-number-top20 {
            background: linear-gradient(135deg, #ff7a92 0%, #ffb3c0 100%);
          }
          
          .pick-number-first {
            background: linear-gradient(135deg, #4b4b6a 0%, #7878a3 100%);
          }
          
          .pick-number-later {
            background: linear-gradient(135deg, #7878a3 0%, #a1a1c4 100%);
          }
          
          .player-info {
            display: flex;
            flex-direction: column;
          }
          
          .player-name {
            font-weight: 700;
            font-size: 1.2rem;
            margin-bottom: 0.25rem;
            color: var(--text-primary);
          }
          
          .player-details {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            font-size: 0.9rem;
            color: var(--text-secondary);
          }
          
          .player-detail {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          
          .team-logos {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .team-logo {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            object-fit: contain;
            background-color: white;
            padding: 0.25rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .expand-icon {
            color: var(--text-secondary);
            font-size: 1.25rem;
          }
          
          .player-expanded-details {
            background-color: #f2f4f8;
            padding: 1.5rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
          }
          
          .player-stat-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .player-stat-group h4 {
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .player-stat {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.95rem;
          }
          
          .player-stat svg {
            color: var(--accent-secondary);
          }
          
          .draft-grades {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-top: 0.75rem;
          }
          
          .draft-grade {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
          }
          
          .grade-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }
          
          .grade-value {
            font-weight: 700;
            font-size: 1.1rem;
          }
          
          .loading-error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            text-align: center;
            background-color: var(--bg-secondary);
            border-radius: 0.75rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          
          .loading-spinner {
            font-size: 2rem;
            color: var(--accent-primary);
            animation: spin 1s linear infinite;
            margin-bottom: 1.5rem;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .error-icon {
            font-size: 2.5rem;
            color: var(--accent-primary);
            margin-bottom: 1.5rem;
          }
          
          @media (max-width: 768px) {
            .draft-controls {
              grid-template-columns: 1fr;
            }
            
            .draft-pick-header {
              grid-template-columns: auto 1fr auto;
            }
            
            .player-expanded-details {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="draft-news-header">
        <h1>
          <FaUserGraduate /> {year} NFL Mock Draft
        </h1>
        <p>Track the latest mock draft picks, player profiles, and predictions for the upcoming NFL Draft.</p>
      </div>

      {isLoading ? (
        <div className="loading-error-container">
          <div className="loading-spinner">
            <FaSpinner />
          </div>
          <h3>Loading draft data...</h3>
        </div>
      ) : error ? (
        <div className="loading-error-container">
          <div className="error-icon">
            <FaInfoCircle />
          </div>
          <h3>Error loading draft data</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="draft-controls">
            <div className="search-input">
              <FaSearch color="#4b4b6a" />
              <input
                type="text"
                placeholder="Search by name, team, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-select">
              <FaFilter color="#4b4b6a" />
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-select">
              <FaListOl color="#4b4b6a" />
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
              >
                {availableRounds.map((round) => (
                  <option key={round} value={round}>
                    {round === 'All' ? 'All Rounds' : `Round ${round}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="draft-picks-list">
            {filteredPicks.length === 0 ? (
              <div className="loading-error-container">
                <h3>No draft picks match your search criteria</h3>
                <p>Try adjusting your filters or search term</p>
              </div>
            ) : (
              filteredPicks.map((pick) => (
                <div key={pick.overall} className="draft-pick-card">
                  <div 
                    className="draft-pick-header"
                    onClick={() => togglePlayerDetails(pick.overall)}
                  >
                    <div className={`pick-number ${getPickNumberColorClass(pick.overall)}`}>
                      {pick.overall}
                    </div>
                    
                    <div className="player-info">
                      <div className="player-name">{pick.name}</div>
                      <div className="player-details">
                        <div className="player-detail">
                          <FaUserGraduate size={14} />
                          {pick.position}
                        </div>
                        <div className="player-detail">
                          <FaUniversity size={14} />
                          {pick.collegeTeam}
                        </div>
                      </div>
                    </div>
                    
                    <div className="team-logos">
                      <img 
                        src={getCollegeLogo(pick.collegeTeam)} 
                        alt={`${pick.collegeTeam} logo`} 
                        className="team-logo" 
                      />
                      <img 
                        src={getNflTeamLogo(pick.nflTeam.split(' ').pop())} 
                        alt={`${pick.nflTeam} logo`} 
                        className="team-logo" 
                      />
                      <div className="expand-icon">
                        {selectedPlayer === pick.overall ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                  </div>
                  
                  {selectedPlayer === pick.overall && (
                    <div className="player-expanded-details">
                      <div className="player-stat-group">
                        <h4>Draft Information</h4>
                        <div className="player-stat">
                          <FaListOl size={16} />
                          <span>Round {pick.round}, Pick {pick.pick} (#{pick.overall} Overall)</span>
                        </div>
                        <div className="player-stat">
                          <FaTrophy size={16} />
                          <span>Pre-Draft Ranking: #{pick.preDraftRanking} Overall, #{pick.preDraftPositionRanking} {pick.position}</span>
                        </div>
                        <div className="draft-grades">
                          <div className="draft-grade">
                            <div className="grade-label">Grade</div>
                            <div className="grade-value" style={{ color: getDraftGradeColor(pick.preDraftGrade) }}>
                              {pick.preDraftGrade}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="player-stat-group">
                        <h4>Physical Profile</h4>
                        <div className="player-stat">
                          <FaRulerVertical size={16} />
                          <span>Height: {formatHeight(pick.height)}</span>
                        </div>
                        <div className="player-stat">
                          <FaWeightHanging size={16} />
                          <span>Weight: {pick.weight} lbs</span>
                        </div>
                      </div>
                      
                      <div className="player-stat-group">
                        <h4>Background</h4>
                        <div className="player-stat">
                          <FaUniversity size={16} />
                          <span>College: {pick.collegeTeam} ({pick.collegeConference})</span>
                        </div>
                        <div className="player-stat">
                          <FaMapMarkerAlt size={16} />
                          <span>Hometown: {pick.hometownInfo.city}, {pick.hometownInfo.state}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DraftNews;