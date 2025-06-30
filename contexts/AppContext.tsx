import { createContext, useContext, useState } from 'react';

export const AppContext = createContext({});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
