import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { detectLanguage, initializeI18n } from '../i18n';
import { HomeProvider } from './HomeContext';
import { ProfileProvider } from './ProfileContext';

type AppContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  i18nReady: boolean;
  currentLanguage: string;
};

export const AppContext = createContext<AppContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  i18nReady: false,
  currentLanguage: 'en',
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initial i18n load
    initializeI18n().then(() => setI18nReady(true));
    setCurrentLanguage(detectLanguage());

    // Listen for app state changes
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App has come to the foreground, re-detect language
          const language = detectLanguage();
          setCurrentLanguage(language);
          await initializeI18n();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (!i18nReady) {
    return null; // or a loading spinner
  }

  return (
    <AppContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, i18nReady, currentLanguage }}
    >
      <ProfileProvider>
        <HomeProvider>{children}</HomeProvider>
      </ProfileProvider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
