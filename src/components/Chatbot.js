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
    if (!input.trim() || loading) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "/gemini", prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch response: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        sender: "bot",
        text: data.message || "I'm not sure about that. Try rewording your question.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong. Try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setInput(example);
    handleSend();
  };

  return (
    <div className="chatbot-container">
      {/* Sidebar */}
      <aside className="chatbot-sidebar">
        <h1 className="chatbot-brand">GamedayGPT</h1>

        {/* Example Questions */}
        <section className="chatbot-section">
          <h3>Examples</h3>
          <ul className="examples-list">
            {examples.map((example, idx) => (
              <li key={idx} onClick={() => handleExampleClick(example.text)}>
                <span className="example-icon">{example.icon}</span>
                {example.text}
              </li>
            ))}
          </ul>
        </section>

        {/* Capabilities List */}
        <section className="chatbot-section">
          <h3>Capabilities</h3>
          <ul className="capabilities-list">
            {capabilities.map((capability, idx) => (
              <li key={idx}>{capability}</li>
            ))}
          </ul>
        </section>

        {/* Upgrade Button */}
        <button className="pro-mode-button">🔒 Upgrade to Pro</button>
      </aside>

      {/* Chat Main Section */}
      <main className="chatbot-main">
        {/* Status Bar */}
        <div className="status-bar">
          <div className="connection-status">
            <div className="status-indicator"></div> Live Session
          </div>
          <div className="version-info">
            <span>v2.4.1</span> <span className="status-dot">●</span> Connected
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-area">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender === "user" ? "user" : "bot"}`}>
              {message.text}
            </div>
          ))}
          {loading && <div className="loading-message"><i>Analyzing...</i></div>}
        </div>

        {/* Input Box */}
        <div className="input-container">
          <input
            type="text"
            placeholder="Ask about player stats, strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "Analyzing..." : "Send"}
          </button>
        </div>

        {/* Footer */}
        <footer className="chat-footer">GamedayGPT System | Secure Session 🔐</footer>
      </main>
    </div>
  );
};

export default Chatbot;