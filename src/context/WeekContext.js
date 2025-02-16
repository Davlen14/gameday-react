import { createContext, useContext, useState } from "react";

// Create a new context
const WeekContext = createContext();

// Provider component to wrap the app
export const WeekProvider = ({ children }) => {
  const [week, setWeek] = useState(1); // Default week is 1

  return (
    <WeekContext.Provider value={{ week, setWeek }}>
      {children}
    </WeekContext.Provider>
  );
};

// Custom hook to access the context
export const useWeek = () => useContext(WeekContext);
