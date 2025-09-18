import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { useAuthInitialization } from "../hooks/useAuthInitialization";
import { detectLanguage, initializeI18n } from "../i18n";
import { pythPriceService } from "../utils";
import { AuthProvider } from "./AuthContext";
import { HomeProvider } from "./HomeContext";
import { MiniGameProvider } from "./MiniGameContext";
import { ProfileProvider } from "./ProfileContext";
import { SolanaProvider } from "./SolanaContext";
import { WalletProvider } from "./WalletContext";

type CompleteProfileFormData = {
  username: string;
  email: string;
  profileImage: string | null;
  enableBiometrics: boolean;
};

type AppContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  i18nReady: boolean;
  currentLanguage: string;
  showCompleteProfileForm: boolean;
  setShowCompleteProfileForm: Dispatch<SetStateAction<boolean>>;
  completeProfileForm: CompleteProfileFormData;
  setCompleteProfileForm: Dispatch<SetStateAction<CompleteProfileFormData>>;
  userProfile: any | null;
  setUserProfile: Dispatch<SetStateAction<any | null>>;
  checkingAuth: boolean;
  requiresBiometric: boolean;
  setRequiresBiometric: Dispatch<SetStateAction<boolean>>;
  hasBreeze: boolean;
  setHasBreeze: Dispatch<SetStateAction<boolean>>;
  authenticateWithBiometrics: () => Promise<boolean>;
  expectingWalletConnection: boolean;
  setExpectingWalletConnection: Dispatch<SetStateAction<boolean>>;
  walletConnectionCallback: (() => void) | null;
  setWalletConnectionCallback: Dispatch<SetStateAction<(() => void) | null>>;
};

export const AppContext = createContext<AppContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => { },
  i18nReady: false,
  currentLanguage: "en",
  showCompleteProfileForm: false,
  setShowCompleteProfileForm: () => { },
  completeProfileForm: {
    username: "",
    email: "",
    profileImage: null,
    enableBiometrics: false,
  },
  setCompleteProfileForm: () => { },
  userProfile: null,
  setUserProfile: () => { },
  checkingAuth: false,
  requiresBiometric: false,
  setRequiresBiometric: () => { },
  hasBreeze: false,
  setHasBreeze: () => { },
  authenticateWithBiometrics: async () => false,
  expectingWalletConnection: false,
  setExpectingWalletConnection: () => { },
  walletConnectionCallback: null,
  setWalletConnectionCallback: () => { },
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [i18nReady, setI18nReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [completeProfileForm, setCompleteProfileForm] = useState<CompleteProfileFormData>({
    username: "",
    email: "",
    profileImage: null,
    enableBiometrics: false,
  });
  const [hasBreeze, setHasBreeze] = useState(false);
  const [expectingWalletConnection, setExpectingWalletConnection] =
    useState(false);
  const [walletConnectionCallback, setWalletConnectionCallback] = useState<
    (() => void) | null
  >(null);

  // Use the new hook for authentication logic
  const {
    isLoggedIn,
    setIsLoggedIn,
    userProfile,
    setUserProfile,
    checkingAuth,
    requiresBiometric,
    setRequiresBiometric,
    showCompleteProfileForm,
    setShowCompleteProfileForm,
    authenticateWithBiometrics,
  } = useAuthInitialization();

  const appState = useRef(AppState.currentState);

  // Watch for userProfile changes and automatically log in when profile is set
  useEffect(() => {
    if (userProfile && !isLoggedIn && !requiresBiometric) {
      setIsLoggedIn(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, isLoggedIn, requiresBiometric]);

  useEffect(() => {
    // Initial i18n load
    initializeI18n().then(() => setI18nReady(true));
    setCurrentLanguage(detectLanguage());

    // Start Pyth price service
    pythPriceService.startStreaming().catch(error => {
      console.error("Failed to start price streaming:", error);
    });

    // Listen for app state changes
    const subscription = AppState.addEventListener(
      "change",
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App has come to the foreground, re-detect language
          const language = detectLanguage();
          setCurrentLanguage(language);
          await initializeI18n();

          // Check for wallet connection race condition
          if (expectingWalletConnection && walletConnectionCallback) {
            // Import persistent wallet state dynamically to avoid circular imports
            const { persistentWalletState } = await import("./WalletContext");

            if (persistentWalletState?.connected) {
              setExpectingWalletConnection(false);
              const callback = walletConnectionCallback;
              setWalletConnectionCallback(null);
              callback();
            }
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
      // Stop price service when app unmounts
      pythPriceService.stopStreaming();
    };
  }, [
    expectingWalletConnection,
    walletConnectionCallback,
    setExpectingWalletConnection,
    setWalletConnectionCallback,
  ]);

  if (!i18nReady || checkingAuth) {
    return null; // or a loading spinner
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        i18nReady,
        currentLanguage,
        showCompleteProfileForm,
        setShowCompleteProfileForm,
        completeProfileForm,
        setCompleteProfileForm,
        userProfile,
        setUserProfile,
        checkingAuth,
        requiresBiometric,
        setRequiresBiometric,
        hasBreeze,
        setHasBreeze,
        authenticateWithBiometrics,
        expectingWalletConnection,
        setExpectingWalletConnection,
        walletConnectionCallback,
        setWalletConnectionCallback,
      }}
    >
      <AuthProvider>
        <SolanaProvider>
          <WalletProvider
            setIsLoggedIn={setIsLoggedIn}
            setUserProfile={setUserProfile}
            setRequiresBiometric={setRequiresBiometric}
            isLoggedIn={isLoggedIn}
            userProfile={userProfile}
          >
            <ProfileProvider userProfile={userProfile}>
              <HomeProvider userProfile={userProfile}>
                <MiniGameProvider>{children}</MiniGameProvider>
              </HomeProvider>
            </ProfileProvider>
          </WalletProvider>
        </SolanaProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
