import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaSearch, FaFilter, FaSpinner, FaInfoCircle, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaTrophy, FaRulerVertical, FaWeightHanging, FaUniversity, FaListOl, FaLongArrowAltRight, FaUser } from 'react-icons/fa';
import teamsService from '../services/teamsService';

const DraftNews = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collegeTeams, setCollegeTeams] = useState([]);
  const [nflTeams, setNflTeams] = useState([]);
  const [positionFilter, setPositionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlayers, setExpandedPlayers] = useState([]);
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
  
  // Toggle player details - modified to allow multiple dropdowns open at once
  const togglePlayerDetails = (pickId) => {
    if (expandedPlayers.includes(pickId)) {
      setExpandedPlayers(expandedPlayers.filter(id => id !== pickId));
    } else {
      setExpandedPlayers([...expandedPlayers, pickId]);
    }
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

  // Get draft grade color using updated color scheme
  const getDraftGradeColor = (grade) => {
    if (!grade) return "#4b4b6a"; 
    if (grade >= 90) return "#22c55e"; // Green for 90+
    if (grade >= 80) return "#f59e0b"; // Yellow for 80-89
    if (grade >= 70) return "#f59e0b"; // Yellow for 70-79
    return "#ef4444"; // Red for 69 and below
  };

  // Get pick color class based on overall pick number
  const getPickNumberColorClass = (overall) => {
    if (overall <= 5) return "dn-pick-number-top5";
    if (overall <= 10) return "dn-pick-number-top10";
    if (overall <= 20) return "dn-pick-number-top20";
    if (overall <= 32) return "dn-pick-number-first";
    return "dn-pick-number-later";
  };

  // Get grade text based on grade value
  const getGradeText = (grade) => {
    if (!grade) return "N/A";
    if (grade >= 90) return "Excellent";
    if (grade >= 80) return "Great";
    if (grade >= 70) return "Good";
    if (grade >= 60) return "Average";
    return "Below Average";
  };

  return (
    <div className="mock-draft-container">
      {/* CSS Styles */}
      <style>
        {`
          @font-face {
            font-family: 'Orbitron';
            src: url('/fonts/Orbitron-Regular.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'Orbitron';
            src: url('/fonts/Orbitron-Bold.woff2') format('woff2');
            font-weight: bold;
            font-style: normal;
          }
          
          .mock-draft-container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            font-family: 'Inter', 'Roboto', sans-serif;
            background-color: #f8f9fa;
            color: #333;
          }
          
          .mock-draft-header {
            background-color: #d4001c;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .gameday-logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: white;
          }
          
          .mock-draft-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.8rem;
            font-weight: 700;
            text-transform: uppercase;
            color: white;
          }
          
          .mock-draft-controls {
            background-color: white;
            padding: 1rem;
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-bottom: 1px solid #eee;
          }
          
          .search-input {
            flex: 1;
            min-width: 200px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            color: #333;
            display: flex;
            align-items: center;
          }
          
          .search-input input {
            background: transparent;
            border: none;
            color: #333;
            margin-left: 0.5rem;
            flex: 1;
          }
          
          .search-input input:focus {
            outline: none;
          }
          
          .filter-select {
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            color: #333;
            display: flex;
            align-items: center;
            min-width: 120px;
          }
          
          .filter-select select {
            background: transparent;
            border: none;
            color: #333;
            margin-left: 0.5rem;
            appearance: none;
          }
          
          .filter-select select:focus {
            outline: none;
          }
          
          .mock-draft-picks-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            padding: 1rem;
            background-color: #f8f9fa;
          }
          
          .draft-pick-card {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .draft-pick-main {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 0.75rem;
            padding: 1rem;
            align-items: center;
            cursor: pointer;
          }
          
          .pick-number {
            width: 2.2rem;
            height: 2.2rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
            color: white;
          }
          
          .dn-pick-number-top5 { background-color: #d4001c; }
          .dn-pick-number-top10 { background-color: #e63946; }
          .dn-pick-number-top20 { background-color: #f77f00; }
          .dn-pick-number-first { background-color: #457b9d; }
          .dn-pick-number-later { background-color: #5c677d; }
          
          .player-info {
            display: flex;
            flex-direction: column;
          }
          
          .player-main-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .player-name {
            font-weight: 700;
            font-size: 1.15rem;
            color: #333;
          }
          
          .player-position {
            background-color: #f0f0f0;
            color: #333;
            padding: 0.15rem 0.4rem;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: 600;
          }
          
          .player-college {
            color: #666;
            font-size: 0.9rem;
          }
          
          .player-grade {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.9rem;
          }
          
          .teams-container {
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
          
          .team-logo {
            width: 2.2rem;
            height: 2.2rem;
            border-radius: 50%;
            background-color: white;
            padding: 0.15rem;
            object-fit: contain;
            border: 1px solid #ddd;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .player-icon {
            width: 2.2rem;
            height: 2.2rem;
            border-radius: 50%;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            border: 1px solid #ddd;
          }
          
          .arrow-icon {
            color: #d4001c;
            margin: 0 0.2rem;
          }
          
          .player-expanded-details {
            background-color: #f8f9fa;
            padding: 1rem;
            border-top: 1px solid #eee;
            animation: slideDown 0.3s ease;
          }
          
          .player-stat-group {
            margin-bottom: 1rem;
          }
          
          .player-stat-group h4 {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.25rem;
            font-weight: 600;
          }
          
          .player-stat {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
            font-size: 0.9rem;
            color: #333;
          }
          
          .player-stat svg {
            color: #d4001c;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .loading-error-container {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            color: #333;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .loading-spinner {
            color: #d4001c;
            font-size: 2rem;
            margin-bottom: 1rem;
            animation: spin 1s infinite linear;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .mock-draft-picks-grid {
              grid-template-columns: 1fr;
            }
            
            .mock-draft-header {
              flex-direction: column;
              gap: 0.5rem;
              text-align: center;
            }
            
            .gameday-logo {
              font-size: 2rem;
            }
            
            .mock-draft-title {
              font-size: 1.5rem;
            }
          }
        `}
      </style>

      <div className="mock-draft-header">
        <div className="gameday-logo">GAMEDAY+</div>
        <div className="mock-draft-title">MY 1ST ROUND MOCK DRAFT</div>
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
          <div>
            <FaInfoCircle />
          </div>
          <h3>Error loading draft data</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="mock-draft-controls">
            <div className="search-input">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by name, team, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-select">
              <FaFilter />
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
              <FaListOl />
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

          <div className="mock-draft-picks-grid">
            {filteredPicks.length === 0 ? (
              <div className="loading-error-container" style={{ gridColumn: "1 / -1" }}>
                <h3>No draft picks match your search criteria</h3>
                <p>Try adjusting your filters or search term</p>
              </div>
            ) : (
              filteredPicks.map((pick) => (
                <div key={pick.overall} className="draft-pick-card">
                  <div 
                    className="draft-pick-main"
                    onClick={() => togglePlayerDetails(pick.overall)}
                  >
                    <div className={`pick-number ${getPickNumberColorClass(pick.overall)}`}>
                      <span>{pick.overall}</span>
                    </div>
                    
                    <div className="player-info">
                      <div className="player-main-row">
                        <div className="player-icon">
                          <FaUser />
                        </div>
                        <div>
                          <div className="player-name">{pick.name}</div>
                          <div className="player-college">
                            <span className="player-position">{pick.position}</span> {pick.collegeTeam}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="teams-container">
                      <img 
                        src={getCollegeLogo(pick.collegeTeam)} 
                        alt={`${pick.collegeTeam} logo`} 
                        className="team-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/default_team.png";
                        }} 
                      />
                      <div className="arrow-icon">
                        <FaLongArrowAltRight />
                      </div>
                      <img 
                        src={getNflTeamLogo(pick.nflTeam)} 
                        alt={`${pick.nflTeam} logo`} 
                        className="team-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/nfl/default.png";
                        }}
                      />
                      <div 
                        className="player-grade" 
                        style={{ 
                          backgroundColor: "transparent",
                          border: `2px solid ${getDraftGradeColor(pick.preDraftGrade)}`,
                          color: getDraftGradeColor(pick.preDraftGrade) 
                        }}
                      >
                        {pick.preDraftGrade?.toFixed(1) || "N/A"}
                      </div>
                    </div>
                  </div>
                  
                  {expandedPlayers.includes(pick.overall) && (
                    <div className="player-expanded-details">
                      <div className="player-stat-group">
                        <h4>Draft Information</h4>
                        <div className="player-stat">
                          <FaListOl />
                          <span>Round {pick.round}, Pick {pick.pick} (#{pick.overall} Overall)</span>
                        </div>
                        <div className="player-stat">
                          <FaTrophy />
                          <span>Pre-Draft Ranking: #{pick.preDraftRanking} Overall</span>
                        </div>
                        <div className="player-stat">
                          <FaUserGraduate />
                          <span>#{pick.preDraftPositionRanking} {pick.position}</span>
                        </div>
                      </div>
                      
                      <div className="player-stat-group">
                        <h4>Physical Profile</h4>
                        <div className="player-stat">
                          <FaRulerVertical />
                          <span>Height: {formatHeight(pick.height)}</span>
                        </div>
                        <div className="player-stat">
                          <FaWeightHanging />
                          <span>Weight: {pick.weight} lbs</span>
                        </div>
                      </div>
                      
                      <div className="player-stat-group">
                        <h4>Background</h4>
                        <div className="player-stat">
                          <FaUniversity />
                          <span>College: {pick.collegeTeam}</span>
                        </div>
                        <div className="player-stat">
                          <FaListOl />
                          <span>Conference: {pick.collegeConference}</span>
                        </div>
                        <div className="player-stat">
                          <FaMapMarkerAlt />
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