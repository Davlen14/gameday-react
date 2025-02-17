import React, { useState, useRef, useEffect } from "react";
import "../styles/FanHub.css";

// Import FontAwesome icons (ensure you have the proper packages installed)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faCommentAlt, faUsers, faLocationDot, faChartBar, faFire } from "@fortawesome/free-solid-svg-icons";

function FanHub() {
  // State for left sidebar expansion (default collapsed)
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // State for team selection in the sticky header
  const [selectedTeam, setSelectedTeam] = useState("");

  // State for live chat messages in the right sidebar
  const [chatMessages, setChatMessages] = useState([]);
  const chatMessagesEndRef = useRef(null);
  const [chatInput, setChatInput] = useState("");

  // Refs for smooth scrolling to sections
  const homeRef = useRef(null);
  const liveGameChatRef = useRef(null);
  const gameRoomsRef = useRef(null);
  const checkinsRef = useRef(null);
  const pollsRef = useRef(null);
  const hypeTrackerRef = useRef(null);

  // Handle smooth scrolling when a nav item is clicked
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll the chat to the latest message
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle left sidebar expansion on hover
  const handleSidebarMouseEnter = () => setSidebarExpanded(true);
  const handleSidebarMouseLeave = () => setSidebarExpanded(false);

  // Navigation items for the left sidebar
  const navItems = [
    { label: "Home", icon: faHouse, ref: homeRef },
    { label: "Game Chat", icon: faCommentAlt, ref: liveGameChatRef },
    { label: "Chat Rooms", icon: faUsers, ref: gameRoomsRef },
    { label: "Fan Check-Ins", icon: faLocationDot, ref: checkinsRef },
    { label: "Fan Polls", icon: faChartBar, ref: pollsRef },
    { label: "Hype Tracker", icon: faFire, ref: hypeTrackerRef }
  ];

  // Dummy teams for the dropdown selector
  const teams = [
    { id: 1, name: "Team A", logo: "https://via.placeholder.com/20" },
    { id: 2, name: "Team B", logo: "https://via.placeholder.com/20" },
    { id: 3, name: "Team C", logo: "https://via.placeholder.com/20" }
  ];

  // State for the active chat room tab in the Game-Based Chat Rooms section
  const [activeChatTab, setActiveChatTab] = useState("🏟️ Game Day Chat");
  const chatTabs = ["🏟️ Game Day Chat", "📊 Betting & Predictions", "🔔 Breaking News", "👥 Team-Specific Chat"];

  // Handle live chat message submission
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    const newMessage = { id: Date.now(), text: chatInput };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
  };

  return (
    <div className="fan-hub-container">
      {/* LEFT SIDEBAR */}
      <nav
        className={`left-sidebar ${sidebarExpanded ? "expanded" : ""}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <ul>
          {navItems.map((item, index) => (
            <li key={index} onClick={() => scrollToSection(item.ref)}>
              <div className="icon">
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <span className="label">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* Sticky Top Header */}
        <div className="sticky-header" ref={homeRef}>
          <h2>🏟️ Welcome to the Fan Hub!</h2>
          <select
            className="team-selector"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Select Your Team Affiliation 🏈</option>
            {teams.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Game Chat Section */}
        <div className="section" ref={liveGameChatRef}>
          <h3>Live Game Chat</h3>
          <p>
            Select which game’s chat to join. Chat syncs across the site (Fan Hub and Game Pages). Reactions, GIFs, and mentions are supported.
          </p>
          {/* Placeholder for live game chat content */}
          <div style={{ height: "150px", backgroundColor: "#eaeaea", borderRadius: "4px" }}></div>
        </div>

        {/* Game-Based Chat Rooms Section */}
        <div className="section" ref={gameRoomsRef}>
          <h3>Game-Based Chat Rooms</h3>
          <div className="chat-tabs">
            {chatTabs.map((tab, index) => (
              <button
                key={index}
                className={activeChatTab === tab ? "active" : ""}
                onClick={() => setActiveChatTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div>
            <p>{activeChatTab} content goes here.</p>
            {/* Placeholder for chat room content */}
            <div style={{ height: "100px", backgroundColor: "#eaeaea", borderRadius: "4px" }}></div>
          </div>
        </div>

        {/* Fan Check-Ins Section */}
        <div className="section" ref={checkinsRef}>
          <h3>Fan Check-Ins</h3>
          <button>Toggle “Going to Home/Away Game”</button>
          <p>
            List of attendees with profile pictures and team logos will appear here.
          </p>
          {/* Placeholder for check-ins */}
          <div style={{ height: "100px", backgroundColor: "#eaeaea", borderRadius: "4px" }}></div>
        </div>

        {/* Fan Polls Section */}
        <div className="section" ref={pollsRef}>
          <h3>Fan Polls</h3>
          <p>
            Users vote on game outcomes and player performances. Live results update instantly.
          </p>
          {/* Placeholder for polls */}
          <div style={{ height: "100px", backgroundColor: "#eaeaea", borderRadius: "4px" }}></div>
        </div>

        {/* Hype Tracker Section */}
        <div className="section" ref={hypeTrackerRef}>
          <h3>Hype Tracker</h3>
          <p>
            Fans vote on upcoming games. A grid showing matchups, team logos, and ratings will be displayed.
          </p>
          {/* Placeholder for hype tracker */}
          <div style={{ height: "100px", backgroundColor: "#eaeaea", borderRadius: "4px" }}></div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: LIVE CHAT */}
      <aside className="right-sidebar">
        <div className="mini-feed">
          <p><strong>Latest Messages:</strong></p>
          {/* Mini feed placeholder; could be expanded to show a summary */}
          <p>No new messages.</p>
        </div>
        <div className="chat-header">
          <p>Live Game Chat</p>
        </div>
        <div className="chat-messages">
          {chatMessages.map((msg) => (
            <p key={msg.id}>{msg.text}</p>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
        <div className="chat-input">
          <form onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
          </form>
        </div>
      </aside>
    </div>
  );
}

export default FanHub;