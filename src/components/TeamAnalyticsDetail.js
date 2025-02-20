import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams, useLocation } from "react-router-dom";

const TeamAnalyticsDetail = () => {
  // ... [keep all the existing state and data fetching logic] ...

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Game Header Section */}
      <div className="bg-gray-900 text-white py-2 text-center">
        <h1 className="text-xl font-bold">{game.tournament || "College Football Classic"}</h1>
        <p className="text-sm">{game.venue} • {gameDate}</p>
      </div>

      {/* Teams Display Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-8">
          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <img
              src={awayLogo}
              alt={game.awayTeam}
              className="w-32 h-32 object-contain mb-4"
            />
            <h2 className="text-2xl font-bold text-center">{game.awayTeam}</h2>
            <div className="text-4xl font-bold text-gray-800 mt-2">
              {game.awayPoints}
            </div>
            <span className="text-sm text-gray-500">Overall: 8-2</span>
          </div>

          {/* Game Status */}
          <div className="flex flex-col items-center mx-4">
            <div className="text-2xl font-bold text-gray-500">VS</div>
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold">{gameTime}</div>
              <div className="text-sm text-gray-500 mt-1">{game.venue}</div>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
                Follow Game
              </button>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <img
              src={homeLogo}
              alt={game.homeTeam}
              className="w-32 h-32 object-contain mb-4"
            />
            <h2 className="text-2xl font-bold text-center">{game.homeTeam}</h2>
            <div className="text-4xl font-bold text-gray-800 mt-2">
              {game.homePoints}
            </div>
            <span className="text-sm text-gray-500">Overall: 7-3</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-8 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Team Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Yards</span>
                <span>415 - 392</span>
              </div>
              <div className="flex justify-between">
                <span>Passing Yards</span>
                <span>289 - 256</span>
              </div>
              <div className="flex justify-between">
                <span>Rushing Yards</span>
                <span>126 - 136</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Key Players</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Passing Leader</span>
                <span>J. Smith: 289 yds</span>
              </div>
              <div className="flex justify-between">
                <span>Rushing Leader</span>
                <span>M. Johnson: 98 yds</span>
              </div>
              <div className="flex justify-between">
                <span>Receiving Leader</span>
                <span>T. Williams: 132 yds</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Game Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Attendance</span>
                <span>54,872</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span>3:24</span>
              </div>
              <div className="flex justify-between">
                <span>Weather</span>
                <span>72° • Clear</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Game Recap</h3>
          <p className="text-gray-600">
            In a thrilling matchup between conference rivals, {game.homeTeam} secured 
            a victory over {game.awayTeam} with a strong fourth-quarter performance...
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsDetail;





