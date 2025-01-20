import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import Teams from "./components/Teams";
import Games from "./components/Games";
import Stats from "./components/Stats";
import More from "./components/More";
import "./App.css"; // Correct path for App.css in /src directory

function App() {
    return (
        <Router>
            <div className="app">
                {/* Header */}
                <header className="app-header">
                    <h1>Gameday</h1>
                </header>

                {/* Navigation Bar */}
                <nav className="app-nav">
                    <Link to="/" className="nav-item">
                        <i className="fas fa-home"></i> Home
                    </Link>
                    <Link to="/teams" className="nav-item">
                        <i className="fas fa-list"></i> Teams
                    </Link>
                    <Link to="/games" className="nav-item">
                        <i className="fas fa-calendar-alt"></i> Games
                    </Link>
                    <Link to="/stats" className="nav-item">
                        <i className="fas fa-chart-bar"></i> Stats
                    </Link>
                    <Link to="/more" className="nav-item">
                        <i className="fas fa-ellipsis-h"></i> More
                    </Link>
                </nav>

                {/* Main Content */}
                <main className="app-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/games" element={<Games />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/more" element={<More />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
