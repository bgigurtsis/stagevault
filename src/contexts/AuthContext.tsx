
import React, { createContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AuthContextType, User, AuthProviderProps } from "./types";
import { mockUsers, extractUserInfo } from "@/utils/authUtils";
import { authService } from "@/services/authService";
import { googleDriveService } from "@/services/googleDriveService";

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  isLoading: true,
  isAuthenticated: false,
  isDriveConnected: false,
  checkDriveConnection: async () => false,
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
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  // We'll use this array to store all users we've encountered, including the current user
  const [knownUsers, setKnownUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    console.log("=== AuthProvider Initialization Started ===");
    console.log("Initial state - isLoading:", isLoading);
    
    // Set up auth state listener FIRST before checking for existing session
    console.log("Setting up auth state change listener...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("=== Auth State Change Event ===");
        console.log("Event type:", event);
        console.log("Session exists:", !!session);
        
        if (session?.user) {
          console.log("User ID:", session.user.id);
          console.log("User email:", session.user.email);
          console.log("User metadata:", JSON.stringify(session.user.user_metadata));
          console.log("Session expires at:", new Date(session.expires_at * 1000).toISOString());
          console.log("Access token (first 20 chars):", session.access_token.substring(0, 20) + "...");
          console.log("Refresh token exists:", !!session.refresh_token);
          
          // Check for provider token (needed for Google Drive API)
          if (session.provider_token) {
            console.log("Provider token exists (first 20 chars):", session.provider_token.substring(0, 20) + "...");
            console.log("Provider refresh token exists:", !!session.provider_refresh_token);
            
            // If we have a provider token, check if Drive is connected
            setTimeout(() => {
              checkDriveConnection();
            }, 0);
          } else {
            console.warn("No provider token in session - Google Drive API won't work!");
            console.log("Full session object:", JSON.stringify(session, null, 2));
            setIsDriveConnected(false);
          }
          
          // Adding a delay here to try to avoid race conditions
          setTimeout(() => {
            try {
              const userInfo = extractUserInfo(session.user);
              console.log("Extracted user info:", userInfo);
              
              // Update current user
              setCurrentUser(userInfo);
              
              // Add to known users if not already present
              setKnownUsers(prevUsers => {
                if (!prevUsers.some(u => u.id === userInfo.id)) {
                  return [...prevUsers, userInfo];
                }
                return prevUsers;
              });
              
              setSession(session);
              console.log("Authentication state updated after auth state change");
            } catch (error) {
              console.error("Error extracting user info:", error);
            }
          }, 0);
        } else {
          console.log("No user in session, setting currentUser to null");
          setCurrentUser(null);
          setSession(null);
          setIsDriveConnected(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    console.log("Checking for existing session...");
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("=== Initial Session Check ===");
      if (error) {
        console.error("Error getting session:", error);
      }
      
      console.log("Initial session check:", session ? "Session exists" : "No session");
      if (session?.user) {
        console.log("Initial user found:", session.user.id);
        console.log("Initial user email:", session.user.email);
        console.log("Initial user metadata:", JSON.stringify(session.user.user_metadata));
        
        // If we have a session, check if Drive is connected
        if (session.provider_token) {
          setTimeout(() => {
            checkDriveConnection();
          }, 0);
        } else {
          setIsDriveConnected(false);
        }
        
        try {
          const userInfo = extractUserInfo(session.user);
          console.log("Initial extracted user info:", userInfo);
          
          // Update current user
          setCurrentUser(userInfo);
          
          // Add to known users if not already present
          setKnownUsers(prevUsers => {
            if (!prevUsers.some(u => u.id === userInfo.id)) {
              return [...prevUsers, userInfo];
            }
            return prevUsers;
          });
          
          setSession(session);
          console.log("Authentication state updated after initial session check");
        } catch (error) {
          console.error("Error extracting initial user info:", error);
        }
      } else {
        console.log("No initial session found");
      }
      
      setIsLoading(false);
      console.log("=== AuthProvider Initialization Completed ===");
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  // Check if Google Drive is connected
  const checkDriveConnection = async (): Promise<boolean> => {
    console.log("Checking Google Drive connection...");
    try {
      const result = await googleDriveService.testDriveAccess();
      console.log("Drive connection test result:", result);
      setIsDriveConnected(result.success);
      return result.success;
    } catch (error) {
      console.error("Error checking Drive connection:", error);
      setIsDriveConnected(false);
      return false;
    }
  };

  // Auth methods that utilize our service layer
  const login = async (email: string, password: string) => {
    console.log("Login method called with email:", email);
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      
      // Add to known users if not already present
      setKnownUsers(prevUsers => {
        if (!prevUsers.some(u => u.id === user.id)) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
      
      console.log("User logged in successfully:", user);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    console.log("loginWithGoogle method called");
    try {
      await authService.loginWithGoogle();
      console.log("Google login method completed, redirect should happen");
      // The actual auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("Google login error in context:", error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role?: "performer" | "choreographer") => {
    console.log("Signup method called with name:", name, "email:", email, "role:", role);
    setIsLoading(true);
    try {
      const newUser = await authService.signup(name, email, password, role);
      setCurrentUser(newUser);
      
      // Add to known users if not already present
      setKnownUsers(prevUsers => {
        if (!prevUsers.some(u => u.id === newUser.id)) {
          return [...prevUsers, newUser];
        }
        return prevUsers;
      });
      
      console.log("User signed up successfully:", newUser);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logout method called");
    try {
      await authService.logout();
      console.log("Logout completed");
      // The auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Combine mock users with current user for the users array
  const allUsers = currentUser 
    ? [...knownUsers.filter(u => u.id !== currentUser.id), currentUser] 
    : knownUsers;

  const value = {
    currentUser,
    users: allUsers,
    isLoading,
    isAuthenticated: !!currentUser,
    isDriveConnected,
    checkDriveConnection,
    login,
    loginWithGoogle,
    signup,
    logout
  };

  // Debug current authentication state on each render
  console.log("Current auth state:", {
    isAuthenticated: !!currentUser,
    hasSession: !!session,
    isLoading,
    isDriveConnected,
    sessionExpiration: session ? new Date(session.expires_at * 1000).toISOString() : "No session",
    usersList: allUsers.map(u => u.name)
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
