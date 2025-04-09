const TeamPlayerModal = ({
    isOpen,
    onClose,
    player = {},
    teamColor = "",  // Expect a team-specific primary color from the parent
    altColor = "",   // Expect a team-specific alternate color; fallback if not provided
    teamLogo = "",   // Single team logo used in two places
  }) => {
    // Fallback: if no altColor is provided, use teamColor
    const effectiveAltColor = altColor || teamColor;
  
    // Convert numeric year to text and determine draft eligibility
    const playerClass = convertYearToText(player.year);
    const isDraftEligible = player.year >= 3;
  
    /*****************************************************************
     * MOCK DATA (Season Grades, Career Grades, etc.)
     * Replace with your real data as needed.
     *****************************************************************/
    const seasonGrades = [
      { label: "OFFENSE GRADE", value: 92.9 },
      { label: "PASS GRADE", value: 91.7 },
      { label: "RUSH GRADE", value: 88.2 },
      { label: "RATING", value: 77.8 },
    ];
  
    const careerGrades = [
      { label: "2019", value: 89.5 },
      { label: "2020", value: 91.2 },
      { label: "2021", value: 93.0 },
      { label: "2022", value: 92.4 },
    ];
  
    // Doughnut data (e.g., passing vs. running snaps)
    const snapsData = {
      passSnaps: 540,
      runSnaps: 360,
    };
    const doughnutData = {
      labels: ["Passing Snaps", "Running Snaps"],
      datasets: [
        {
          data: [snapsData.passSnaps, snapsData.runSnaps],
          backgroundColor: [teamColor, effectiveAltColor],
          hoverBackgroundColor: [teamColor, effectiveAltColor],
          borderWidth: 0,
        },
      ],
    };
  
    // Weekly stacked bar data
    const weeklySnaps = [
      { week: 1, pass: 40, run: 10 },
      { week: 2, pass: 35, run: 15 },
      { week: 3, pass: 50, run: 8  },
      { week: 4, pass: 45, run: 12 },
      { week: 5, pass: 38, run: 17 },
      { week: 6, pass: 42, run: 15 },
      { week: 7, pass: 55, run: 5  },
      { week: 8, pass: 50, run: 10 },
      { week: 9, pass: 44, run: 12 },
      { week: 10, pass: 48, run: 10 },
      { week: 11, pass: 36, run: 14 },
      { week: 12, pass: 52, run: 6  },
    ];
    const barData = {
      labels: weeklySnaps.map((d) => `${d.week}`),
      datasets: [
        {
          label: "Passing Snaps",
          data: weeklySnaps.map((d) => d.pass),
          backgroundColor: teamColor,
        },
        {
          label: "Running Snaps",
          data: weeklySnaps.map((d) => d.run),
          backgroundColor: effectiveAltColor,
        },
      ],
    };
    const barOptions = {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          title: { display: true, text: "WEEK", color: "#444", font: { size: 12, family: "Arial" } },
          ticks: { font: { size: 12, family: "Arial" } },
        },
        y: {
          stacked: true,
          grid: { color: "#eee" },
          ticks: { font: { size: 12, family: "Arial" } },
        },
      },
    };
  
    /***************************************
     * Render the Modal Layout
     ***************************************/
    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Team Player Modal"
        style={{
          content: {
            width: "90%",
            maxWidth: "1200px",
            margin: "auto",
            borderRadius: "6px",
            padding: 0,
            border: "none",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            position: "relative",
            backgroundColor: "#fff",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
          },
        }}
      >
        {/* Inline CSS block */}
        <style>
          {`
            .modal-container {
              display: flex;
              flex-direction: column;
              background: #fff;
            }
            /*********************************************
             * HEADER: angled background + logos + player info
             *********************************************/
            .modal-header {
              position: relative;
              padding: 1.5rem 1.5rem 1rem 1.5rem;
              overflow: hidden;
              background-color: #fafafa;
            }
            .angled-block-main {
              position: absolute;
              top: 0;
              left: 0;
              width: 220px;
              height: 100%;
              background-color: ${teamColor};
              transform: skewX(-20deg);
              transform-origin: top left;
            }
            .angled-block-secondary {
              position: absolute;
              top: 0;
              left: 170px;
              width: 220px;
              height: 100%;
              background-color: ${effectiveAltColor};
              transform: skewX(-20deg);
              transform-origin: top left;
            }
            /* Big team logo on the left */
            .big-team-logo {
              position: relative;
              width: 110px;
              height: auto;
              object-fit: contain;
              margin-right: 1rem;
              z-index: 2;
            }
            /* Same logo in top-right corner, sized smaller */
            .top-right-team-logo {
              position: absolute;
              top: 1.5rem;
              right: 1.5rem;
              width: 70px;
              height: auto;
              object-fit: contain;
              z-index: 2;
            }
            /* Player info next to the big logo */
            .player-header-content {
              margin-left: 120px;
              z-index: 2;
              position: relative;
            }
            .player-name {
              font-size: 1.8rem;
              font-weight: bold;
              margin: 0;
              color: #333;
            }
            .player-info-row {
              display: flex;
              flex-wrap: wrap;
              gap: 1.5rem;
              margin-top: 0.5rem;
              font-size: 0.95rem;
              color: #666;
            }
            .player-info-row strong {
              color: #333;
            }
  
            /*********************************************
             * BODY: Grades columns, doughnut, weekly bar
             *********************************************/
            .modal-body {
              display: flex;
              padding: 1.5rem;
              gap: 2rem;
            }
            .grades-column {
              flex: 0 0 250px;
              display: flex;
              flex-direction: column;
              gap: 2rem;
            }
            .grades-section h3 {
              margin: 0 0 0.5rem;
              font-size: 1.1rem;
              color: #333;
              font-weight: 600;
            }
            .grade-list {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .grade-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 0.9rem;
              gap: 8px;
            }
            .grade-item .label {
              flex: 0 0 100px;
              color: #444;
            }
            .grade-bar-container {
              flex: 1;
              background-color: #eeeeee;
              height: 8px;
              border-radius: 4px;
              position: relative;
              margin-right: 8px;
            }
            .grade-bar-fill {
              position: absolute;
              top: 0;
              left: 0;
              height: 8px;
              border-radius: 4px;
              background-color: ${teamColor};
            }
            .grade-value {
              flex: 0 0 auto;
              width: 40px;
              text-align: right;
              color: #333;
            }
  
            /* Doughnut Chart column */
            .snaps-column {
              flex: 0 0 220px;
              text-align: center;
            }
            .snaps-column h3 {
              font-size: 1.1rem;
              margin-bottom: 1rem;
            }
            .snaps-total {
              margin-top: 1rem;
              font-size: 0.95rem;
              color: #444;
            }
  
            /* Weekly Bar chart column */
            .weekly-column {
              flex: 1 1 auto;
            }
            .weekly-column h3 {
              font-size: 1.1rem;
              margin-bottom: 1rem;
            }
  
            /*********************************************
             * CLOSE BUTTON
             *********************************************/
            .close-button {
              position: absolute;
              top: 1rem;
              right: 1rem;
              background-color: ${teamColor};
              border: none;
              color: #fff;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.85rem;
              z-index: 10;
            }
            .close-button:hover {
              opacity: 0.8;
            }
          `}
        </style>
  
        <div className="modal-container">
          {/* Close Button */}
          <button className="close-button" onClick={onClose}>
            Close
          </button>
  
          {/* HEADER */}
          <div className="modal-header">
            <div className="angled-block-main"></div>
            <div className="angled-block-secondary"></div>
  
            {/* Big logo on the left */}
            {teamLogo ? (
              <img src={teamLogo} alt="Team Logo" className="big-team-logo" />
            ) : (
              <img
                src="https://via.placeholder.com/100"
                alt="Team Logo"
                className="big-team-logo"
              />
            )}
  
            {/* Same logo, smaller, in the top-right */}
            {teamLogo ? (
              <img src={teamLogo} alt="Team Logo" className="top-right-team-logo" />
            ) : (
              <img
                src="https://via.placeholder.com/70"
                alt="Team Logo"
                className="top-right-team-logo"
              />
            )}
  
            {/* Player Info */}
            <div className="player-header-content">
              <h2 className="player-name">{player.fullName || "Player Name"}</h2>
              <div className="player-info-row">
                <div><strong>Height:</strong> {player.height || "N/A"}</div>
                <div><strong>Weight:</strong> {player.weight || "N/A"} lbs</div>
                <div><strong>Class:</strong> {playerClass}</div>
                <div><strong>Draft Eligible:</strong> {isDraftEligible ? "Yes" : "Not Yet"}</div>
              </div>
            </div>
          </div>
  
          {/* BODY */}
          <div className="modal-body">
            {/* Grades Column */}
            <div className="grades-column">
              {/* 2026 Season Grades */}
              <div className="grades-section">
                <h3>2026 Season Grades</h3>
                <div className="grade-list">
                  {seasonGrades.map(({ label, value }, idx) => {
                    const fillPercent = (value / 100) * 100;
                    return (
                      <div className="grade-item" key={idx}>
                        <div className="label">{label}</div>
                        <div className="grade-bar-container">
                          <div className="grade-bar-fill" style={{ width: `${fillPercent}%` }}></div>
                        </div>
                        <div className="grade-value">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Career Grades */}
              <div className="grades-section">
                <h3>Career Grades</h3>
                <div className="grade-list">
                  {careerGrades.map(({ label, value }, idx) => {
                    const fillPercent = (value / 100) * 100;
                    return (
                      <div className="grade-item" key={idx}>
                        <div className="label">{label}</div>
                        <div className="grade-bar-container">
                          <div className="grade-bar-fill" style={{ width: `${fillPercent}%` }}></div>
                        </div>
                        <div className="grade-value">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
  
            {/* Doughnut (Snaps) */}
            <div className="snaps-column">
              <h3>2026 Snaps</h3>
              <Doughnut data={doughnutData} />
              <div className="snaps-total">
                <strong>Total Snaps:</strong> {snapsData.passSnaps + snapsData.runSnaps}
              </div>
            </div>
  
            {/* Weekly Stacked Bar */}
            <div className="weekly-column">
              <h3>Weekly</h3>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </Modal>
    );
  };
  
  export default TeamPlayerModal;