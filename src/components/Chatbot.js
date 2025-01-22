import React, { useState } from "react";
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]); // Add user's message
    setInput(""); // Clear input field
    setLoading(true); // Show loading indicator

    try {
      // Send the user input to the backend
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
        throw new Error("Failed to fetch response from the API");
      }

      const data = await response.json();
      const botMessage = {
        sender: "bot",
        text: data.message || "Sorry, I couldn't understand that.",
      };

      setMessages((prev) => [...prev, botMessage]); // Add bot's response
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        sender: "bot",
        text: "Oops! Something went wrong. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]); // Add error message
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  const handleExampleClick = async (example) => {
    setInput(example); // Populate input field with example
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
            <i>Loading...</i>
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
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;