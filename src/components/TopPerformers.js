// TopPerformers.js
import React from "react";

const TopPerformers = ({
  game,
  topPerformersPassing,
  topPerformersRushing,
  topPerformersReceiving,
  getTeamAbbreviation,
}) => {
  return (
    <div
      className="top-performers"
      style={{
        width: "96%",
        margin: "2% auto",
        background: "#fff",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
        Top Performers
      </h2>
      <div
        className="top-performers__container"
        style={{ display: "flex", flexWrap: "wrap", gap: "2%" }}
      >
        {[
          { team: game.homeTeam, label: getTeamAbbreviation(game.homeTeam) },
          { team: game.awayTeam, label: getTeamAbbreviation(game.awayTeam) },
        ].map((side) => {
          const passingCategory =
            topPerformersPassing &&
            topPerformersPassing[0]?.teams.find(
              (t) => t.team.toLowerCase() === side.team.toLowerCase()
            )?.categories.find((cat) => cat.name === "passing");
          const rushingCategory =
            topPerformersRushing &&
            topPerformersRushing[0]?.teams.find(
              (t) => t.team.toLowerCase() === side.team.toLowerCase()
            )?.categories.find((cat) => cat.name === "rushing");
          const receivingCategory =
            topPerformersReceiving &&
            topPerformersReceiving[0]?.teams.find(
              (t) => t.team.toLowerCase() === side.team.toLowerCase()
            )?.categories.find((cat) => cat.name === "receiving");

          return (
            <div
              key={side.team}
              className="top-performers__team"
              style={{
                flex: "1 1 48%",
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "10px",
              }}
            >
              <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
                {side.label}
              </h3>
              {/* Passing Section */}
              <div className="top-performers__category">
                <h4>Passing</h4>
                {passingCategory &&
                  passingCategory.types
                    .filter((type) =>
                      ["YDS", "C/ATT", "QBR", "TD"].includes(type.name)
                    )
                    .map((statType) => (
                      <div key={statType.name} style={{ marginBottom: "5px" }}>
                        <strong>{statType.name}:</strong>{" "}
                        {statType.athletes.slice(0, 2).map((athlete, i) => (
                          <span key={athlete.id}>
                            {athlete.name} ({athlete.stat})
                            {i === 0 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    ))}
              </div>
              {/* Rushing Section */}
              <div className="top-performers__category">
                <h4>Rushing</h4>
                {rushingCategory &&
                  rushingCategory.types
                    .filter((type) => ["YDS", "CAR", "TD"].includes(type.name))
                    .map((statType) => (
                      <div key={statType.name} style={{ marginBottom: "5px" }}>
                        <strong>{statType.name}:</strong>{" "}
                        {statType.athletes.slice(0, 2).map((athlete, i) => (
                          <span key={athlete.id}>
                            {athlete.name} ({athlete.stat})
                            {i === 0 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    ))}
              </div>
              {/* Receiving Section */}
              <div className="top-performers__category">
                <h4>Receiving</h4>
                {receivingCategory &&
                  receivingCategory.types
                    .filter((type) => ["YDS", "REC", "TD"].includes(type.name))
                    .map((statType) => (
                      <div key={statType.name} style={{ marginBottom: "5px" }}>
                        <strong>{statType.name}:</strong>{" "}
                        {statType.athletes.slice(0, 2).map((athlete, i) => (
                          <span key={athlete.id}>
                            {athlete.name} ({athlete.stat})
                            {i === 0 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopPerformers;