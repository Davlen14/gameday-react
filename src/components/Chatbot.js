import React, { useState } from "react";
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Example questions with icons
  const examples = [
    { text: "Who has the best rushing yards?", icon: "🏈" },
    { text: "Show me today's spread analysis", icon: "📊" },
    { text: "What are the betting suggestions?", icon: "💰" }
  ];

  const capabilities = [
    "Real-time predictions",
    "Injury risk assessment",
    "Opponent analysis"
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Your existing API logic
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/gemini",
          prompt: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch response: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text: data.message || "I'm not sure about that. Please try asking differently.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = async (example) => {
    setInput(example);
    await handleSend();
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-sidebar">
        <h1 className="chatbot-brand">GamedayGPT</h1>
        
        <div className="chatbot-section">
          <h3>Examples</h3>
          <ul className="examples-list">
            {examples.map((example, idx) => (
              <li key={idx} onClick={() => handleExampleClick(example.text)}>
                <span className="example-icon">{example.icon}</span>
                {example.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="chatbot-section">
          <h3>Capabilities</h3>
          <ul className="capabilities-list">
            {capabilities.map((capability, idx) => (
              <li key={idx}>{capability}</li>
            ))}
          </ul>
        </div>

        <button className="pro-mode-button">
          🔒 Pro Mode
        </button>
      </div>

      <div className="chatbot-main">
        <div className="status-bar">
          <div className="connection-status">
            <div className="status-indicator"></div>
            Live Session
          </div>
          <div className="version-info">
            <span>v2.4.1</span>
            <span className="status-dot">●</span>
            Connected
          </div>
        </div>

        <div className="chat-area">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.sender === "user" ? "user" : "bot"}`}
            >
              {message.text}
            </div>
          ))}
          {loading && (
            <div className="loading-message">
              <i>Fetching response...</i>
            </div>
          )}
        </div>

        <div className="input-container">
          <input
            type="text"
            placeholder="Ask about player formations, stats, or strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "Analyzing..." : "Send"}
          </button>
        </div>

        <div className="chat-footer">
          GamedayGPT System | Secure Session 🔐
        </div>
      </div>
    </div>
  );
};

export default Chatbot;