
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role?: "performer" | "choreographer";
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string, role?: "performer" | "choreographer") => Promise<void>;
  logout: () => void;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@example.com",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
    role: "choreographer"
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@example.com",
    profilePicture: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
    role: "performer"
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
    role: "performer"
  }
];

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider initialized");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        if (session?.user) {
          console.log("User found in session:", session.user.id);
          console.log("User metadata:", JSON.stringify(session.user.user_metadata));
        }
        setSession(session);
        
        if (session?.user) {
          const userInfo = extractUserInfo(session.user);
          console.log("Extracted user info:", userInfo);
          setCurrentUser(userInfo);
        } else {
          console.log("No user in session, setting currentUser to null");
          setCurrentUser(null);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      if (session?.user) {
        console.log("Initial user found:", session.user.id);
        console.log("Initial user metadata:", JSON.stringify(session.user.user_metadata));
      }
      setSession(session);
      
      if (session?.user) {
        const userInfo = extractUserInfo(session.user);
        console.log("Initial extracted user info:", userInfo);
        setCurrentUser(userInfo);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  const extractUserInfo = (user: SupabaseUser): User => {
    console.log("Extracting user info for user:", user.id);
    return {
      id: user.id,
      name: user.user_metadata.name || user.user_metadata.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      profilePicture: user.user_metadata.avatar_url || user.user_metadata.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata.name || user.email?.split("@")[0] || "User")}&background=random`,
      role: user.user_metadata.role || "performer"
    };
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
      setCurrentUser(user);
    } else {
      throw new Error("Invalid credentials");
    }
    
    setIsLoading(false);
  };

  const loginWithGoogle = async () => {
    try {
      const currentUrl = window.location.origin;
      const redirectTo = `${currentUrl}/login`;
      console.log("Google login initiated");
      console.log("Current URL:", currentUrl);
      console.log("Redirecting to:", redirectTo);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            prompt: 'select_account',
          }
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        throw error;
      }
      
      console.log("Google OAuth response:", data);
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role?: "performer" | "choreographer") => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mockUsers.some(u => u.email === email)) {
      throw new Error("Email already in use");
    }
    
    const newUser: User = {
      id: String(mockUsers.length + 1),
      name,
      email,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      role: role || "performer"
    };
    
    setCurrentUser(newUser);
    
    setIsLoading(false);
  };

  const logout = async () => {
    console.log("Logging out user");
    await supabase.auth.signOut();
    console.log("User logged out, setting currentUser to null");
    setCurrentUser(null);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
