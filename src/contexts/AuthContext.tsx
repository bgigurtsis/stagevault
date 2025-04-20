
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
  logout: async () => {},
  user: null // Added for backward compatibility
});

// Export the useAuth hook from the hook file
export { useAuth } from "@/hooks/useAuthContext";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [authState, setAuthState] = useState({
    stage: "initializing",
    lastEvent: null,
    error: null
  });
  // We'll use this array to store all users we've encountered, including the current user
  const [knownUsers, setKnownUsers] = useState<User[]>(mockUsers);

  // Global unhandled error tracking
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error("=== UNHANDLED ERROR in AuthContext ===", event.error);
      console.error("Error message:", event.error?.message);
      console.error("Error stack:", event.error?.stack);
      setAuthState(prev => ({
        ...prev, 
        error: event.error,
        stage: "global_error_caught"
      }));
    };

    window.addEventListener('error', handleUnhandledError);
    
    return () => {
      window.removeEventListener('error', handleUnhandledError);
    };
  }, []);

  useEffect(() => {
    console.log("=== AuthProvider Initialization Started ===");
    console.log("Initial state - isLoading:", isLoading);
    console.log("Window location:", window.location.href);
    setAuthState(prev => ({ ...prev, stage: "setting_up_auth_listener" }));
    
    // Set up auth state listener FIRST before checking for existing session
    console.log("Setting up auth state change listener...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        try {
          console.log("=== Auth State Change Event ===");
          console.log("Event type:", event);
          console.log("Session exists:", !!session);
          setAuthState(prev => ({ 
            ...prev, 
            stage: "auth_state_changed", 
            lastEvent: event 
          }));
          
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
                setAuthState(prev => ({ ...prev, stage: "checking_drive_connection" }));
                checkDriveConnection().then(connected => {
                  console.log("Drive connection checked:", connected);
                  setAuthState(prev => ({ 
                    ...prev, 
                    stage: connected ? "drive_connected" : "drive_not_connected" 
                  }));
                });
              }, 0);
            } else {
              console.warn("No provider token in session - Google Drive API won't work!");
              console.log("Full session object:", JSON.stringify(session, null, 2));
              setIsDriveConnected(false);
              setAuthState(prev => ({ ...prev, stage: "no_provider_token" }));
            }
            
            // Adding a delay here to try to avoid race conditions
            setTimeout(() => {
              try {
                setAuthState(prev => ({ ...prev, stage: "extracting_user_info" }));
                console.log("User object before extraction:", JSON.stringify(session.user, null, 2));
                
                // Safe extraction with detailed error logging
                let userInfo: User;
                try {
                  userInfo = extractUserInfo(session.user);
                  console.log("Extracted user info:", JSON.stringify(userInfo, null, 2));
                  setAuthState(prev => ({ ...prev, stage: "user_info_extracted" }));
                } catch (extractError) {
                  console.error("Error in extractUserInfo:", extractError);
                  console.error("Failed user object:", JSON.stringify(session.user, null, 2));
                  
                  // Create a fallback user object with safe defaults
                  userInfo = {
                    id: session.user.id,
                    name: session.user.email?.split('@')[0] || "User",
                    email: session.user.email || "",
                    profilePicture: `https://ui-avatars.com/api/?name=User&background=random`,
                    role: "performer"
                  };
                  console.log("Created fallback user info:", userInfo);
                  setAuthState(prev => ({ 
                    ...prev, 
                    stage: "fallback_user_info_created",
                    error: extractError
                  }));
                }
                
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
                setAuthState(prev => ({ ...prev, stage: "auth_state_updated" }));
              } catch (error) {
                console.error("Error in session handling after auth state change:", error);
                setAuthState(prev => ({ 
                  ...prev, 
                  stage: "error_in_auth_state_change",
                  error
                }));
              }
            }, 0);
          } else {
            console.log("No user in session, setting currentUser to null");
            setCurrentUser(null);
            setSession(null);
            setIsDriveConnected(false);
            setAuthState(prev => ({ ...prev, stage: "no_user_in_session" }));
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error("Critical error in auth state change handler:", error);
          setAuthState(prev => ({ 
            ...prev, 
            stage: "critical_error_in_auth_change",
            error
          }));
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    setAuthState(prev => ({ ...prev, stage: "checking_initial_session" }));
    console.log("Checking for existing session...");
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("=== Initial Session Check ===");
      if (error) {
        console.error("Error getting session:", error);
        setAuthState(prev => ({ 
          ...prev, 
          stage: "error_getting_initial_session",
          error
        }));
      }
      
      console.log("Initial session check:", session ? "Session exists" : "No session");
      if (session?.user) {
        console.log("Initial user found:", session.user.id);
        console.log("Initial user email:", session.user.email);
        console.log("Initial user metadata:", JSON.stringify(session.user.user_metadata));
        setAuthState(prev => ({ ...prev, stage: "initial_session_exists" }));
        
        // If we have a session, check if Drive is connected
        if (session.provider_token) {
          setTimeout(() => {
            setAuthState(prev => ({ ...prev, stage: "checking_initial_drive_connection" }));
            checkDriveConnection().then(connected => {
              console.log("Initial drive connection:", connected);
              setAuthState(prev => ({ 
                ...prev, 
                stage: connected ? "initial_drive_connected" : "initial_drive_not_connected" 
              }));
            });
          }, 0);
        } else {
          setIsDriveConnected(false);
          setAuthState(prev => ({ ...prev, stage: "no_initial_provider_token" }));
        }
        
        try {
          console.log("User object for initial extraction:", JSON.stringify(session.user, null, 2));
          setAuthState(prev => ({ ...prev, stage: "extracting_initial_user_info" }));
          
          // Safe extraction with detailed error logging
          let userInfo: User;
          try {
            userInfo = extractUserInfo(session.user);
            console.log("Initial extracted user info:", JSON.stringify(userInfo, null, 2));
            setAuthState(prev => ({ ...prev, stage: "initial_user_info_extracted" }));
          } catch (extractError) {
            console.error("Error in initial extractUserInfo:", extractError);
            console.error("Failed initial user object:", JSON.stringify(session.user, null, 2));
            
            // Create a fallback user object with safe defaults
            userInfo = {
              id: session.user.id,
              name: session.user.email?.split('@')[0] || "User",
              email: session.user.email || "",
              profilePicture: `https://ui-avatars.com/api/?name=User&background=random`,
              role: "performer"
            };
            console.log("Created initial fallback user info:", userInfo);
            setAuthState(prev => ({ 
              ...prev, 
              stage: "initial_fallback_user_info_created",
              error: extractError
            }));
          }
          
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
          setAuthState(prev => ({ ...prev, stage: "initial_auth_state_updated" }));
        } catch (error) {
          console.error("Error extracting initial user info:", error);
          setAuthState(prev => ({ 
            ...prev, 
            stage: "error_extracting_initial_user_info",
            error
          }));
        }
      } else {
        console.log("No initial session found");
        setAuthState(prev => ({ ...prev, stage: "no_initial_session" }));
      }
      
      setIsLoading(false);
      console.log("=== AuthProvider Initialization Completed ===");
      setAuthState(prev => ({ ...prev, stage: "initialization_completed" }));
    }).catch(error => {
      console.error("Critical error getting initial session:", error);
      setAuthState(prev => ({ 
        ...prev, 
        stage: "critical_error_getting_initial_session",
        error
      }));
      setIsLoading(false);
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
    setAuthState(prev => ({ ...prev, stage: "login_started" }));
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      setAuthState(prev => ({ ...prev, stage: "login_successful" }));
      
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
      setAuthState(prev => ({ ...prev, stage: "login_error", error }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    console.log("loginWithGoogle method called");
    setAuthState(prev => ({ ...prev, stage: "google_login_started" }));
    try {
      console.log("Current hostname:", window.location.hostname);
      console.log("Current origin:", window.location.origin);
      await authService.loginWithGoogle();
      setAuthState(prev => ({ ...prev, stage: "google_login_redirect_initiated" }));
      console.log("Google login method completed, redirect should happen");
      // The actual auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("Google login error in context:", error);
      setAuthState(prev => ({ ...prev, stage: "google_login_error", error }));
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role?: "performer" | "choreographer") => {
    console.log("Signup method called with name:", name, "email:", email, "role:", role);
    setIsLoading(true);
    setAuthState(prev => ({ ...prev, stage: "signup_started" }));
    try {
      const newUser = await authService.signup(name, email, password, role);
      setCurrentUser(newUser);
      setAuthState(prev => ({ ...prev, stage: "signup_successful" }));
      
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
      setAuthState(prev => ({ ...prev, stage: "signup_error", error }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logout method called");
    setAuthState(prev => ({ ...prev, stage: "logout_started" }));
    try {
      await authService.logout();
      setAuthState(prev => ({ ...prev, stage: "logout_completed" }));
      console.log("Logout completed");
      // The auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("Logout error:", error);
      setAuthState(prev => ({ ...prev, stage: "logout_error", error }));
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
    logout,
    user: currentUser // Added for backward compatibility
  };

  // Debug current authentication state on each render
  console.log("Current auth state:", {
    isAuthenticated: !!currentUser,
    hasSession: !!session,
    isLoading,
    isDriveConnected,
    sessionExpiration: session ? new Date(session.expires_at * 1000).toISOString() : "No session",
    usersList: allUsers.map(u => u.name),
    authStage: authState.stage
  });

  return (
    <AuthContext.Provider value={value}>
      {process.env.NODE_ENV === 'development' && authState.error && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          zIndex: 9999,
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Auth error: {authState.stage} - {authState.error?.message || 'Unknown error'}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};
