import React, { useState } from "react";
import "../styles/Chatbot.css";
import { FaFootballBall, FaChartBar, FaMoneyBillWave, FaQuestionCircle } from "react-icons/fa";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm your Gameday Assistant. How can I help you?" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = { sender: "bot", text: `I see you're interested in "${input}". Here's what I found.` };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);

    setInput("");
  };

  const handleSuggestionClick = (suggestion) => {
    const userMessage = { sender: "user", text: suggestion };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response for suggestion
    setTimeout(() => {
      const botResponse = {
        sender: "bot",
        text: `Great! Let me pull some data for "${suggestion}".`,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>GamedayGPT</h2>
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
      <div className="chatbot-suggestions">
        <button
          className="chatbot-suggestion"
          onClick={() => handleSuggestionClick("Who has the best rushing yards?")}
        >
          <FaFootballBall /> Best Rushing Yards
        </button>
        <button
          className="chatbot-suggestion"
          onClick={() => handleSuggestionClick("Spread analysis for today's games.")}
        >
          <FaChartBar /> Spread Analysis
        </button>
        <button
          className="chatbot-suggestion"
          onClick={() => handleSuggestionClick("Betting suggestions.")}
        >
          <FaMoneyBillWave /> Betting Suggestions
        </button>
        <button
          className="chatbot-suggestion"
          onClick={() => handleSuggestionClick("How do rankings look for this week?")}
        >
          <FaQuestionCircle /> Rankings
        </button>
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