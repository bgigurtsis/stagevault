
import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'performer' | 'choreographer';
  profilePicture?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: User['role']) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password123",
    role: "admin",
    profilePicture: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@example.com",
    password: "password123",
    role: "performer",
    profilePicture: "https://i.pravatar.cc/150?img=2",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, this would be an API call
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );
      
      if (!user) {
        throw new Error("Invalid email or password");
      }
      
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword as User);
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: User['role']) => {
    // In a real app, this would be an API call
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (MOCK_USERS.some((u) => u.email === email)) {
        throw new Error("User already exists");
      }
      
      // Create new user
      const newUser = {
        id: String(MOCK_USERS.length + 1),
        name,
        email,
        role,
        profilePicture: `https://i.pravatar.cc/150?img=${MOCK_USERS.length + 3}`,
      };
      
      setCurrentUser(newUser);
      localStorage.setItem("currentUser", JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: currentUser !== null,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
