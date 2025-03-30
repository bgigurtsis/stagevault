
import { Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role?: "performer" | "choreographer";
}

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string, role?: "performer" | "choreographer") => Promise<void>;
  logout: () => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
