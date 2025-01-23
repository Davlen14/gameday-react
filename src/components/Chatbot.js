import React, { useState } from "react";
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]); // Add user's message
    setInput(""); // Clear input field
    setLoading(true); // Show loading indicator

    try {
      // Send user input to the proxy API
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/gemini", // Use the Gemini endpoint
          prompt: input, // User's input
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch response: ${response.status}`);
      }

      const data = await response.json();

      // Extract and display Gemini's response
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
      setLoading(false); // Stop loading indicator
    }
  };

  const handleExampleClick = async (example) => {
    setInput(example); // Pre-fill input field with example
    await handleSend(); // Automatically send the example
  };

  return (
    <div className="chatbot-fullscreen">
      <div className="chatbot-header">
        <h1>GamedayGPT</h1>
      </div>
      <div className="chatbot-sections">
        <div className="chatbot-section examples">
          <h2>Examples</h2>
          {[
            "Who has the best rushing yards?",
            "Show me today's spread analysis.",
            "What are the betting suggestions?",
          ].map((example, idx) => (
            <button key={idx} onClick={() => handleExampleClick(example)}>
              {example} →
            </button>
          ))}
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
        {loading && (
          <div className="chatbot-message bot-message">
            <i>Fetching a response...</i>
          </div>
        )}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading} // Disable input while loading
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;