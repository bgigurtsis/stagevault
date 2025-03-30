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

// Fake users data
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

// Creating the context with a default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const userInfo = extractUserInfo(session.user);
          setCurrentUser(userInfo);
        } else {
          setCurrentUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const userInfo = extractUserInfo(session.user);
        setCurrentUser(userInfo);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to extract user info from Supabase user
  const extractUserInfo = (user: SupabaseUser): User => {
    return {
      id: user.id,
      name: user.user_metadata.name || user.user_metadata.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      profilePicture: user.user_metadata.avatar_url || user.user_metadata.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata.name || user.email?.split("@")[0] || "User")}&background=random`,
      role: user.user_metadata.role || "performer"
    };
  };

  const login = async (email: string, password: string) => {
    // In a real app, you would make an API request to validate credentials
    // and retrieve a token or session identifier
    
    setIsLoading(true);
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user with matching email
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
      setCurrentUser(user);
      // In a real app, you would store the token/session in localStorage or cookies
    } else {
      throw new Error("Invalid credentials");
    }
    
    setIsLoading(false);
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role?: "performer" | "choreographer") => {
    // In a real app, you would make an API request to create a new user
    
    setIsLoading(true);
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if email already exists
    if (mockUsers.some(u => u.email === email)) {
      throw new Error("Email already in use");
    }
    
    // Create new user
    const newUser: User = {
      id: String(mockUsers.length + 1), // Simple ID generation for mock data
      name,
      email,
      // Default profile picture
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      role: role || "performer" // Default to performer if no role is provided
    };
    
    // In a real app, you would add the user to the database
    // For our mock, we'll simulate success and log the user in
    setCurrentUser(newUser);
    
    setIsLoading(false);
  };

  const logout = () => {
    // In a real app, you would clear the token/session
    supabase.auth.signOut();
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
