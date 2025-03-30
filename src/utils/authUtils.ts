
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/contexts/types";

/**
 * Extract user information from Supabase user object
 */
export const extractUserInfo = (user: SupabaseUser): User => {
  console.log("Extracting user info for user:", user.id);
  const userInfo = {
    id: user.id,
    name: user.user_metadata.name || user.user_metadata.full_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    profilePicture: user.user_metadata.avatar_url || user.user_metadata.picture || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata.name || user.email?.split("@")[0] || "User")}&background=random`,
    role: user.user_metadata.role || "performer"
  };
  console.log("User info extracted:", userInfo);
  return userInfo;
};

/**
 * Mock users for development
 */
export const mockUsers: User[] = [
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
