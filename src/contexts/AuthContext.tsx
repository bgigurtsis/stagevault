
import React, { createContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AuthContextType, User, AuthProviderProps } from "./types";
import { mockUsers, extractUserInfo } from "@/utils/authUtils";
import { authService } from "@/services/authService";

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  logout: async () => {}
});

// Export the useAuth hook from the hook file
export { useAuth } from "@/hooks/useAuthContext";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider initialized");
    
    // Set up auth state listener FIRST before checking for existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        if (session?.user) {
          console.log("User found in session:", session.user.id);
          console.log("User metadata:", JSON.stringify(session.user.user_metadata));
          
          // Adding a delay here to try to avoid race conditions
          setTimeout(() => {
            const userInfo = extractUserInfo(session.user);
            console.log("Extracted user info:", userInfo);
            setCurrentUser(userInfo);
            setSession(session);
            console.log("Authentication state updated after auth state change");
          }, 0);
        } else {
          console.log("No user in session, setting currentUser to null");
          setCurrentUser(null);
          setSession(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    console.log("Checking for existing session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      if (session?.user) {
        console.log("Initial user found:", session.user.id);
        console.log("Initial user metadata:", JSON.stringify(session.user.user_metadata));
        
        const userInfo = extractUserInfo(session.user);
        console.log("Initial extracted user info:", userInfo);
        setCurrentUser(userInfo);
        setSession(session);
        console.log("Authentication state updated after initial session check");
      } else {
        console.log("No initial session found");
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods that utilize our service layer
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await authService.loginWithGoogle();
      // The actual auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role?: "performer" | "choreographer") => {
    setIsLoading(true);
    try {
      const newUser = await authService.signup(name, email, password, role);
      setCurrentUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    // The auth state will be updated by the onAuthStateChange listener
  };

  const value = {
    currentUser,
    users: mockUsers,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    loginWithGoogle,
    signup,
    logout
  };

  // Debug current authentication state on each render
  console.log("Current auth state:", {
    isAuthenticated: !!currentUser,
    hasSession: !!session,
    isLoading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
