import React, { useState, useRef, useEffect } from "react";
import "../styles/FanHub.css";

// Import FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHouse, 
  faCommentAlt, 
  faUsers, 
  faLocationDot, 
  faChartBar, 
  faFire, 
  faFootball,
  faChartLine,
  faBell,
  faPeopleGroup,
  faMessage
} from "@fortawesome/free-solid-svg-icons";

function FanHub({ scoreboardVisible = true }) {
  // Local state to track actual scoreboard visibility
  const [actualScoreboardVisible, setActualScoreboardVisible] = useState(scoreboardVisible);
  
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

  // Function to check for scoreboard visibility and adjust layout
  const adjustLayoutForScoreboard = () => {
    // Expanded set of selectors to find scoreboard
    const scoreboardSelectors = [
      '.scoreboard-bar', 
      '.div-scoreboard-bar', 
      '.scoreboard', 
      '[class*="scoreboard"]', 
      '[data-testid="scoreboard"]',
      '.gameday-scoreboard',
      'header + div'
    ];

    let scoreboardElement = null;
    
    // Try each selector until we find a matching element
    for (const selector of scoreboardSelectors) {
      scoreboardElement = document.querySelector(selector);
      if (scoreboardElement) {
        console.log('Scoreboard element found:', {
          selector,
          element: scoreboardElement,
          display: window.getComputedStyle(scoreboardElement).display,
          visibility: window.getComputedStyle(scoreboardElement).visibility,
          opacity: window.getComputedStyle(scoreboardElement).opacity,
          height: scoreboardElement.offsetHeight
        });
        break;
      }
    }

    if (scoreboardElement) {
      const computedStyle = window.getComputedStyle(scoreboardElement);
      const isVisible = 
        computedStyle.display !== 'none' && 
        computedStyle.visibility !== 'hidden' && 
        parseFloat(computedStyle.opacity) > 0 &&
        scoreboardElement.offsetHeight > 0;

      console.log('Scoreboard visibility determined:', isVisible);
      
      setActualScoreboardVisible(isVisible);
      
      // Update CSS variable for scoreboard height
      document.documentElement.style.setProperty(
        '--scoreboard-height', 
        isVisible ? `${scoreboardElement.offsetHeight}px` : '0px'
      );
    } else {
      console.warn('No scoreboard element found. Falling back to prop value.');
      setActualScoreboardVisible(scoreboardVisible);
    }
  };

  // Detect if scoreboard is visible in the DOM
  useEffect(() => {
    // Delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      adjustLayoutForScoreboard();
    }, 250);
    
    // Resize observer to adjust layout on window size changes
    const resizeObserver = new ResizeObserver(() => {
      adjustLayoutForScoreboard();
    });
    
    resizeObserver.observe(document.body);
    window.addEventListener('resize', adjustLayoutForScoreboard);
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', adjustLayoutForScoreboard);
    };
  }, [scoreboardVisible]);

  // When the left sidebar is expanded, force the scoreboard to hide
  useEffect(() => {
    if (sidebarExpanded) {
      setActualScoreboardVisible(false);
      // Also update the CSS variable so container uses zero height for scoreboard
      document.documentElement.style.setProperty('--scoreboard-height', '0px');
    } else {
      // Re-check the scoreboard visibility when sidebar collapses
      adjustLayoutForScoreboard();
    }
  }, [sidebarExpanded]);

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
  const [activeChatTab, setActiveChatTab] = useState("Game Day Chat");
  const chatTabs = [
    { label: "Game Day Chat", icon: faFootball },
    { label: "Betting & Predictions", icon: faChartLine },
    { label: "Breaking News", icon: faBell },
    { label: "Team-Specific Chat", icon: faPeopleGroup }
  ];

  // Handle live chat message submission
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    const newMessage = { id: Date.now(), text: chatInput };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
  };

  return (
    <div className={`fan-hub-container ${!actualScoreboardVisible ? "scoreboard-hidden" : ""}`}>
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
          <div className="header-content">
            <h2>
              <FontAwesomeIcon icon={faFootball} className="header-icon" />
              Welcome to the Fan Hub!
            </h2>
            <select
              className="team-selector"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">
                Select Your Team Affiliation <FontAwesomeIcon icon={faFootball} />
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Game Chat Section */}
        <div className="section" ref={liveGameChatRef}>
          <div className="section-header">
            <FontAwesomeIcon icon={faMessage} className="section-icon" />
            <h3>Live Game Chat</h3>
          </div>
          <p>
            Select which game's chat to join. Chat syncs across the site (Fan Hub and Game Pages). Reactions, GIFs, and mentions are supported.
          </p>
          <div className="content-placeholder"></div>
        </div>

        {/* Game-Based Chat Rooms Section */}
        <div className="section" ref={gameRoomsRef}>
          <div className="section-header">
            <FontAwesomeIcon icon={faUsers} className="section-icon" />
            <h3>Game-Based Chat Rooms</h3>
          </div>
          <div className="chat-tabs">
            {chatTabs.map((tab, index) => (
              <button
                key={index}
                className={activeChatTab === tab.label ? "active" : ""}
                onClick={() => setActiveChatTab(tab.label)}
              >
                <FontAwesomeIcon icon={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div>
            <p>{activeChatTab} content goes here.</p>
            <div className="content-placeholder"></div>
          </div>
        </div>

        {/* Fan Check-Ins Section */}
        <div className="section" ref={checkinsRef}>
          <div className="section-header">
            <FontAwesomeIcon icon={faLocationDot} className="section-icon" />
            <h3>Fan Check-Ins</h3>
          </div>
          <button className="action-button">
            <FontAwesomeIcon icon={faFootball} /> Toggle "Going to Home/Away Game"
          </button>
          <p>
            List of attendees with profile pictures and team logos will appear here.
          </p>
          <div className="content-placeholder"></div>
        </div>

        {/* Fan Polls Section */}
        <div className="section" ref={pollsRef}>
          <div className="section-header">
            <FontAwesomeIcon icon={faChartBar} className="section-icon" />
            <h3>Fan Polls</h3>
          </div>
          <p>
            Users vote on game outcomes and player performances. Live results update instantly.
          </p>
          <div className="content-placeholder"></div>
        </div>

        {/* Hype Tracker Section */}
        <div className="section" ref={hypeTrackerRef}>
          <div className="section-header">
            <FontAwesomeIcon icon={faFire} className="section-icon" />
            <h3>Hype Tracker</h3>
          </div>
          <p>
            Fans vote on upcoming games. A grid showing matchups, team logos, and ratings will be displayed.
          </p>
          <div className="content-placeholder"></div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: LIVE CHAT */}
      <aside className="right-sidebar">
        <div className="mini-feed">
          <p><strong>Latest Messages:</strong></p>
          <p className="no-messages">No new messages.</p>
        </div>
        <div className="chat-header">
          <FontAwesomeIcon icon={faMessage} className="chat-icon" />
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