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
import { getUserByProfileId } from '../utils/backendApi';
import { getSecureAuth } from '../utils/secureAuth';
import { HomeProvider } from './HomeContext';
import { ProfileProvider } from './ProfileContext';
import { SolanaProvider } from './SolanaContext';
import { WalletProvider } from './WalletContext';

type SignUpFormData = {
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
  showSignUpForm: boolean;
  setShowSignUpForm: Dispatch<SetStateAction<boolean>>;
  signUpForm: SignUpFormData;
  setSignUpForm: Dispatch<SetStateAction<SignUpFormData>>;
  userProfile: any | null;
  setUserProfile: Dispatch<SetStateAction<any | null>>;
  checkingAuth: boolean;
};

export const AppContext = createContext<AppContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  i18nReady: false,
  currentLanguage: 'en',
  showSignUpForm: false,
  setShowSignUpForm: () => {},
  signUpForm: {
    username: '',
    email: '',
    profileImage: null,
    enableBiometrics: false,
  },
  setSignUpForm: () => {},
  userProfile: null,
  setUserProfile: () => {},
  checkingAuth: false,
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [signUpForm, setSignUpForm] = useState<SignUpFormData>({
    username: 'tim_ios_phantom',
    email: 'tim_ios_phantom@email.com',
    profileImage: null,
    enableBiometrics: false,
  });
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const appState = useRef(AppState.currentState);

  // Check for existing authentication on app startup
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log('Checking for existing authentication...');
        const authResult = await getSecureAuth();

        if (authResult.isValid && authResult.data) {
          console.log('Valid auth data found, fetching user profile...');
          const user = await getUserByProfileId(authResult.data.profileId);

          if (user) {
            console.log(
              '✓ User profile found, auto-logging in:',
              user.username
            );
            setUserProfile(user);
            setIsLoggedIn(true);
          } else {
            console.log('⚠️ User profile not found in database');
          }
        } else {
          console.log('No valid auth data found:', authResult.reason);
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, []);

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
        showSignUpForm,
        setShowSignUpForm,
        signUpForm,
        setSignUpForm,
        userProfile,
        setUserProfile,
        checkingAuth,
      }}
    >
      <SolanaProvider>
        <WalletProvider>
          <ProfileProvider>
            <HomeProvider>{children}</HomeProvider>
          </ProfileProvider>
        </WalletProvider>
      </SolanaProvider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
