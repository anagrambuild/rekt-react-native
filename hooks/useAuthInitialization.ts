import { useEffect, useState } from "react";
import { Platform } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { queryClient } from "../utils/queryClient";
import { queryKeys } from "../utils/queryKeys";
import { useUserByUserIdQuery } from "../utils/queryUtils";
import { supabase } from "../utils/supabase";
import * as LocalAuthentication from "expo-local-authentication";

export const useAuthInitialization = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [showCompleteProfileForm, setShowCompleteProfileForm] = useState(false);

  // Check for existing Supabase session
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);

        // If we have a new session, invalidate user queries to force refetch
        if (currentSession?.user?.id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.userProfile(currentSession.user.id),
          });
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    getSession();

    // Listen for auth state changes to handle login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 [DEBUG] Auth state change in useAuthInitialization:",
        event
      );

      if (event === "SIGNED_IN" && session?.user?.id) {
        // User just signed in, invalidate user profile cache to force fresh fetch
        queryClient.invalidateQueries({
          queryKey: queryKeys.userProfile(session.user.id),
        });

        setSession(session);
      } else if (event === "SIGNED_OUT") {
        // User signed out, clear session
        setSession(null);
        setUserProfile(null);
        setIsLoggedIn(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Use React Query to fetch user data when session is available
  const {
    data: user,
    error,
    isLoading,
  } = useUserByUserIdQuery(session?.user?.id || "", {
    enabled: !!session?.user?.id,
  });

  // Handle user data changes and gate on profile completeness
  useEffect(() => {
    if (user) {
      // If profile exists but is incomplete (e.g., missing username), show completion form
      if (!user.username || user.username.trim().length === 0) {
        setShowCompleteProfileForm(true);
        setUserProfile(null);
        return;
      }

      setUserProfile(user);
      handleUserProfileSuccess();
      return;
    }
    // If we have a session but no user record yet, require completion
    if (session?.user?.id && !isLoading) {
      setShowCompleteProfileForm(true);
      setUserProfile(null);
    }
  }, [user, session, isLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching user profile:", error);

      // If we get a 404 or other error fetching profile, show signup form
      if (error instanceof Error && error.message.includes("404")) {
        console.log("📝 User profile not found (404) - showing signup form");
        setShowCompleteProfileForm(true);
        setCheckingAuth(false);
      }
    }
  }, [error]);

  const handleUserProfileSuccess = async () => {
    try {
      // Check if biometrics are enabled for this user
      const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");

      if (biometricEnabled === "true") {
        // Check if biometrics are available on device
        const isSupported = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (isSupported && isEnrolled) {
          // Skip biometrics on Android due to dialog dismissal issues
          if (Platform.OS === "android") {
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
    } catch (error) {
      console.error("Error checking biometrics:", error);
      // Fallback to direct login
      setIsLoggedIn(true);
    }
  };

  // Watch for userProfile changes and automatically log in when profile is set
  useEffect(() => {
    if (userProfile && !isLoggedIn && !requiresBiometric) {
      setIsLoggedIn(true);
    }
  }, [userProfile, isLoggedIn, requiresBiometric]);

  // Biometric authentication function
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your account",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Passcode",
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
      console.error("Error during biometric authentication:", error);
      return false;
    }
  };

  return {
    isLoggedIn,
    setIsLoggedIn,
    userProfile,
    setUserProfile,
    checkingAuth: checkingAuth || isLoading,
    requiresBiometric,
    setRequiresBiometric,
    showCompleteProfileForm,
    setShowCompleteProfileForm,
    authenticateWithBiometrics,
  };
};
