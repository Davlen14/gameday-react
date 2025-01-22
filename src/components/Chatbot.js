import React, { useState } from "react";
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = { sender: "bot", text: `You asked about "${input}". Let me fetch some data.` };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);

    setInput("");
  };

  const handleExampleClick = (example) => {
    const userMessage = { sender: "user", text: example };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response for the example
    setTimeout(() => {
      const botResponse = { sender: "bot", text: `Great! Here's more about "${example}".` };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div className="chatbot-fullscreen">
      <div className="chatbot-header">
        <h1>GamedayGPT</h1>
      </div>
      <div className="chatbot-sections">
        <div className="chatbot-section examples">
          <h2>Examples</h2>
          <button onClick={() => handleExampleClick("Who has the best rushing yards?")}>
            Who has the best rushing yards? →
          </button>
          <button onClick={() => handleExampleClick("Show me today's spread analysis.")}>
            Show me today's spread analysis. →
          </button>
          <button onClick={() => handleExampleClick("What are the betting suggestions?")}>
            What are the betting suggestions? →
          </button>
        </div>
        <div className="chatbot-section capabilities">
          <h2>Capabilities</h2>
          <ul>
            <li>Understands predefined football statistics queries.</li>
            <li>Provides insights into teams, players, and rankings.</li>
            <li>Suggests betting odds based on analytics.</li>
          </ul>
        </div>
        <div className="chatbot-section limitations">
          <h2>Limitations</h2>
          <ul>
            <li>May not have real-time updates for every game.</li>
            <li>Responses depend on the available API data.</li>
            <li>Not a substitute for professional betting advice.</li>
          </ul>
        </div>
      </div>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chatbot-message ${message.sender === "user" ? "user-message" : "bot-message"}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;