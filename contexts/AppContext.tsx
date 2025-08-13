import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { detectLanguage, initializeI18n } from '../i18n';
import { getUserByProfileId } from '../utils/backendApi';
import { supabase } from '../utils/supabase';
import { AuthProvider } from './AuthContext';
import { HomeProvider } from './HomeContext';
import { MiniGameProvider } from './MiniGameContext';
import { ProfileProvider } from './ProfileContext';
import { SolanaProvider } from './SolanaContext';
import { WalletProvider } from './WalletContext';
import * as LocalAuthentication from 'expo-local-authentication';

type SignUpFormData = {
  username: string;
  email: string;
  password: string;
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
  requiresBiometric: boolean;
  setRequiresBiometric: Dispatch<SetStateAction<boolean>>;
  hasBreeze: boolean;
  setHasBreeze: Dispatch<SetStateAction<boolean>>;
  authenticateWithBiometrics: () => Promise<boolean>;
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
    password: '',
    profileImage: null,
    enableBiometrics: false,
  },
  setSignUpForm: () => {},
  userProfile: null,
  setUserProfile: () => {},
  checkingAuth: false,
  requiresBiometric: false,
  setRequiresBiometric: () => {},
  hasBreeze: false,
  setHasBreeze: () => {},
  authenticateWithBiometrics: async () => false,
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [signUpForm, setSignUpForm] = useState<SignUpFormData>({
    username: '',
    email: '',
    password: '',
    profileImage: null,
    enableBiometrics: false,
  });
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [hasBreeze, setHasBreeze] = useState(false);
  const appState = useRef(AppState.currentState);

  // Check for existing Supabase session and handle biometric authentication
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Check if we have a valid Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // We have a valid Supabase session, fetch user profile
          try {
            const user = await getUserByProfileId(session.user.id);
            if (user) {
              setUserProfile(user);

              // Check if biometrics are enabled for this user
              const biometricEnabled = await AsyncStorage.getItem(
                'biometric_enabled'
              );

              if (biometricEnabled === 'true') {
                // Check if biometrics are available on device
                const isSupported =
                  await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (isSupported && isEnrolled) {
                  // Skip biometrics on Android due to dialog dismissal issues
                  if (Platform.OS === 'android') {
                    setRequiresBiometric(false);
                    setIsLoggedIn(true);
                  } else {
                    setRequiresBiometric(true);
                  }
                } else {
                  // Biometrics not available, log in directly
                  setIsLoggedIn(true);
                }
              } else {
                // Biometrics not enabled, log in directly
                setIsLoggedIn(true);
              }
            } else {
              // User profile not found - this means the user needs to complete signup
              console.log(
                '📝 User authenticated but profile not found - showing signup form'
              );
              setShowSignUpForm(true);
              setCheckingAuth(false);
              return; // Exit early since we're showing signup form
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);

            // If we get a 404 or other error fetching profile, show signup form
            if (error instanceof Error && error.message.includes('404')) {
              console.log(
                '📝 User profile not found (404) - showing signup form'
              );
              setShowSignUpForm(true);
              setCheckingAuth(false);
              return; // Exit early since we're showing signup form
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, []);

  // Watch for userProfile changes and automatically log in when profile is set
  useEffect(() => {
    if (userProfile && !isLoggedIn) {
      console.log('✅ User profile set, automatically logging in');
      setIsLoggedIn(true);
    }
  }, [userProfile, isLoggedIn]);

  // Biometric authentication function
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        setRequiresBiometric(false);
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 100);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

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
        requiresBiometric,
        setRequiresBiometric,
        hasBreeze,
        setHasBreeze,
        authenticateWithBiometrics,
      }}
    >
      <AuthProvider>
        <SolanaProvider>
          <WalletProvider
            setIsLoggedIn={setIsLoggedIn}
            setUserProfile={setUserProfile}
            setRequiresBiometric={setRequiresBiometric}
          >
            <ProfileProvider userProfile={userProfile}>
              <HomeProvider>
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
