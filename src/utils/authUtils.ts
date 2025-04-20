
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/contexts/types";

/**
 * Extract user information from Supabase user object
 * Implemented with thorough error handling to avoid undefined values
 */
export const extractUserInfo = (user: SupabaseUser): User => {
  if (!user) {
    console.error("Cannot extract user info: user object is undefined");
    throw new Error("Invalid user object");
  }
  
  console.log("Extracting user info for user:", user.id);
  
  // Safely get name, ensuring we always have a string even if metadata is incomplete
  const getName = () => {
    try {
      // Check if user metadata exists and contains name information
      if (user.user_metadata) {
        if (typeof user.user_metadata.name === 'string' && user.user_metadata.name) 
          return user.user_metadata.name;
        
        if (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) 
          return user.user_metadata.full_name;
      }
      
      // If no name in metadata, try to extract from email
      if (user.email && typeof user.email === 'string') {
        const emailParts = user.email.split('@');
        if (emailParts[0]) return emailParts[0];
      }
      
      // Fallback to default
      return "User";
    } catch (error) {
      console.error("Error extracting user name:", error);
      return "User";
    }
  };
  
  // Safely get profile picture URL
  const getProfilePicture = () => {
    try {
      if (user.user_metadata) {
        if (typeof user.user_metadata.avatar_url === 'string' && user.user_metadata.avatar_url) 
          return user.user_metadata.avatar_url;
        
        if (typeof user.user_metadata.picture === 'string' && user.user_metadata.picture) 
          return user.user_metadata.picture;
      }
      
      // Create a UI Avatars URL with fallback to "User" if name extraction fails
      const name = getName();
      if (!name || typeof name !== 'string') {
        return `https://ui-avatars.com/api/?name=User&background=random`;
      }
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    } catch (error) {
      console.error("Error extracting profile picture:", error);
      return `https://ui-avatars.com/api/?name=User&background=random`;
    }
  };
  
  // Get role with proper fallback
  const getRole = () => {
    try {
      if (user.user_metadata && user.user_metadata.role) {
        const role = user.user_metadata.role;
        if (role === "performer" || role === "choreographer") {
          return role;
        }
      }
      return "performer"; // Default role
    } catch (error) {
      console.error("Error extracting user role:", error);
      return "performer";
    }
  };
  
  const userInfo = {
    id: user.id,
    name: getName(),
    email: user.email || "",
    profilePicture: getProfilePicture(),
    role: getRole()
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
