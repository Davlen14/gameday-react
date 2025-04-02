// Grading and Player Stats Utility Functions

export const getGradeDescription = (grade) => {
  if (grade >= 90) return "Elite";
  if (grade >= 80) return "Excellent";
  if (grade >= 70) return "Very Good";
  if (grade >= 60) return "Above Average";
  if (grade >= 50) return "Average";
  if (grade >= 40) return "Below Average";
  if (grade >= 30) return "Poor";
  return "Very Poor";
};

export const getGradeColor = (grade) => {
  if (grade >= 90) return "#2ecc71"; // Green
  if (grade >= 80) return "#27ae60"; // Dark Green
  if (grade >= 70) return "#3498db"; // Blue
  if (grade >= 60) return "#2980b9"; // Dark Blue
  if (grade >= 50) return "#f1c40f"; // Yellow
  if (grade >= 40) return "#e67e22"; // Orange
  if (grade >= 30) return "#e74c3c"; // Red
  return "#c0392b"; // Dark Red
};

export const renderPlayerKeyStat = (player) => {
  if (!player.stats) return "No stats";
  
  switch (player.position) {
    case 'QB':
      if (player.stats.passing) {
        let completions, attempts, yards, touchdowns;
        
        if (player.stats.passing.c_att || player.stats.passing['c/att']) {
          const completionString = player.stats.passing.c_att || player.stats.passing['c/att'];
          const parts = completionString.toString().split('/');
          completions = parts[0];
          attempts = parts[1];
        } else {
          completions = player.stats.passing.completions || 0;
          attempts = player.stats.passing.attempts || 0;
        }
        
        yards = player.stats.passing.yards || player.stats.passing.yds || 0;
        touchdowns = player.stats.passing.touchdowns || player.stats.passing.td || 0;
        
        return `${completions}/${attempts}, ${yards} yds, ${touchdowns} TD`;
      }
      return "No passing stats";
      
    case 'RB':
      if (player.stats.rushing) {
        return `${player.stats.rushing.attempts || 0} car, ${player.stats.rushing.yards || 0} yds, ${player.stats.rushing.touchdowns || 0} TD`;
      }
      return "No rushing stats";
      
    case 'WR':
    case 'TE':
      if (player.stats.receiving) {
        return `${player.stats.receiving.receptions || 0} rec, ${player.stats.receiving.yards || 0} yds, ${player.stats.receiving.touchdowns || 0} TD`;
      }
      return "No receiving stats";
      
    case 'DL':
    case 'DE':
    case 'DT':
    case 'LB':
      if (player.stats.defense) {
        return `${player.stats.defense.tackles || 0} tkl, ${player.stats.defense.tacklesForLoss || 0} TFL, ${player.stats.defense.sacks || 0} sacks`;
      }
      return "No defensive stats";
      
    case 'CB':
    case 'S':
    case 'DB':
      if (player.stats.defense) {
        return `${player.stats.defense.tackles || 0} tkl, ${player.stats.defense.interceptions || 0} INT, ${player.stats.defense.passesDefended || 0} PD`;
      }
      return "No defensive stats";
      
    default:
      return "Stats N/A";
  }
};