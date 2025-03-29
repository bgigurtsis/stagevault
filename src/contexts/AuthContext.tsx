
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Fake users data
const mockUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@example.com",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80"
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@example.com",
    profilePicture: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80"
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80"
  }
];

// Creating the context with a default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading user data on mount
  useEffect(() => {
    const loadUser = async () => {
      // In a real app, you would check for a stored token or session
      // and possibly make an API request to get the current user data
      setTimeout(() => {
        // Simulate logged in user (first user in our mock data)
        setCurrentUser(mockUsers[0]);
        setIsLoading(false);
      }, 1000);
    };

    loadUser();
  }, []);

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

  const signup = async (name: string, email: string, password: string) => {
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
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    
    // In a real app, you would add the user to the database
    // For our mock, we'll simulate success and log the user in
    setCurrentUser(newUser);
    
    setIsLoading(false);
  };

  const logout = () => {
    // In a real app, you would clear the token/session
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    users: mockUsers,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
