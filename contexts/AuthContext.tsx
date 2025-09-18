import { createContext, useContext, useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { getApiBaseUrl } from "@/constants/config";
import { supabase, supabaseSignInWithSolana } from "@/utils/supabase";
import { router } from "expo-router";
// Initialize Supabase client


interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  // OTP Authentication methods
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  // Solana Authentication methods
  signInWithSolana: (
    publicKey: string,
    message: string,
    signature: string
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser; isNewUser?: boolean }>;
  // Legacy methods (deprecated but kept for compatibility)
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        };
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        };
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
        };
        setUser(authUser);
        return { success: true, user: authUser };
      }

      return { success: false, error: "Sign up failed" };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
        };
        setUser(authUser);
        return { success: true, user: authUser };
      }

      return { success: false, error: "Sign in failed" };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.replace("/");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "rektreactnative://reset-password",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Send Code error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
        };
        setUser(authUser);
        return { success: true, user: authUser };
      }

      return { success: false, error: "OTP verification failed" };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const signInWithSolana = async (publicKey: string, message: string, signature: string) => {
    try {
      setLoading(true);

      // First, check if user exists by calling our backend
      const BASE_URL = getApiBaseUrl();
      const response = await fetch(`${BASE_URL}/api/auth/solana/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_key: publicKey, // Only need public key to check user existence
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error || 'Authentication failed' };
      }

      if (!result.success) {
        return { success: false, error: result.error || 'Authentication failed' };
      }

      const userExists = !!result?.data?.user_exists;
      // Make direct POST request to Supabase token endpoint
      const supabaseResponse = await supabaseSignInWithSolana(publicKey, message, signature);

      const authData = await supabaseResponse.json();

      if (!supabaseResponse.ok || authData.error) {
        console.error("Supabase Web3 auth error:", authData.error);
        return { success: false, error: authData.error?.message || 'Web3 authentication failed' };
      }

      // Set the session in Supabase
      if (authData.access_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          return { success: false, error: sessionError.message };
        }

        if (sessionData.user) {
          const authUser: AuthUser = {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            created_at: sessionData.user.created_at,
          };
          return { success: true, user: authUser, isNewUser: !userExists };
        }
      }


      return { success: false, error: "Authentication failed" };
    } catch (error) {
      console.error("Solana authentication error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    sendOTP,
    verifyOTP,
    signInWithSolana,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
