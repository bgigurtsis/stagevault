
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
  console.log("Full user object:", JSON.stringify(user, null, 2));
  
  // Safely get name, ensuring we always have a string even if metadata is incomplete
  const getName = () => {
    try {
      // Check if user metadata exists and contains name information
      if (user.user_metadata) {
        console.log("User metadata available:", JSON.stringify(user.user_metadata, null, 2));
        
        if (typeof user.user_metadata.name === 'string' && user.user_metadata.name) {
          console.log("Using name from user_metadata.name:", user.user_metadata.name);
          return user.user_metadata.name;
        }
        
        if (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) {
          console.log("Using name from user_metadata.full_name:", user.user_metadata.full_name);
          return user.user_metadata.full_name;
        }
        
        // Google specific fields
        if (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) {
          console.log("Using name from user_metadata.full_name:", user.user_metadata.full_name);
          return user.user_metadata.full_name;
        }
      }
      
      // If no name in metadata, try to extract from email
      if (user.email && typeof user.email === 'string') {
        console.log("No name in metadata, extracting from email:", user.email);
        try {
          const emailParts = user.email.split('@');
          if (emailParts[0]) {
            console.log("Using name from email:", emailParts[0]);
            return emailParts[0];
          }
        } catch (error) {
          console.error("Error extracting name from email:", error);
          console.error("Email that caused error:", user.email);
        }
      }
      
      // Fallback to default
      console.log("No valid name found, using default: 'User'");
      return "User";
    } catch (error) {
      console.error("Error extracting user name:", error);
      console.error("User object that caused error:", JSON.stringify(user, null, 2));
      return "User";
    }
  };
  
  // Safely get profile picture URL
  const getProfilePicture = () => {
    try {
      if (user.user_metadata) {
        console.log("Checking user_metadata for profile picture");
        
        if (typeof user.user_metadata.avatar_url === 'string' && user.user_metadata.avatar_url) {
          console.log("Using avatar_url from metadata:", user.user_metadata.avatar_url);
          return user.user_metadata.avatar_url;
        }
        
        if (typeof user.user_metadata.picture === 'string' && user.user_metadata.picture) {
          console.log("Using picture from metadata:", user.user_metadata.picture);
          return user.user_metadata.picture;
        }
      }
      
      // Create a UI Avatars URL with fallback to "User" if name extraction fails
      console.log("No profile picture in metadata, creating UI Avatar");
      let name;
      try {
        name = getName();
        if (!name || typeof name !== 'string') {
          console.log("Name is invalid for UI Avatar, using 'User'");
          name = "User";
        }
      } catch (error) {
        console.error("Error getting name for UI Avatar:", error);
        name = "User";
      }
      
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
      console.log("Created UI Avatar URL:", avatarUrl);
      return avatarUrl;
    } catch (error) {
      console.error("Error extracting profile picture:", error);
      console.error("User object that caused error:", JSON.stringify(user, null, 2));
      return `https://ui-avatars.com/api/?name=User&background=random`;
    }
  };
  
  // Get role with proper fallback
  const getRole = () => {
    try {
      if (user.user_metadata && user.user_metadata.role) {
        const role = user.user_metadata.role;
        console.log("Role from metadata:", role);
        if (role === "performer" || role === "choreographer") {
          return role;
        }
      }
      console.log("No valid role in metadata, using default: 'performer'");
      return "performer"; // Default role
    } catch (error) {
      console.error("Error extracting user role:", error);
      return "performer";
    }
  };
  
  try {
    const userName = getName();
    const profilePic = getProfilePicture();
    const userRole = getRole();
    
    const userInfo = {
      id: user.id,
      name: userName,
      email: user.email || "",
      profilePicture: profilePic,
      role: userRole
    };
    
    console.log("User info extracted:", userInfo);
    return userInfo;
  } catch (error) {
    console.error("Fatal error in extractUserInfo:", error);
    console.error("User object that caused error:", JSON.stringify(user, null, 2));
    
    // Create an emergency fallback user to prevent app crash
    const fallbackUser = {
      id: user.id,
      name: "User",
      email: user.email || "",
      profilePicture: `https://ui-avatars.com/api/?name=User&background=random`,
      role: "performer" as "performer" | "choreographer"
    };
    
    console.log("Created emergency fallback user:", fallbackUser);
    return fallbackUser;
  }
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
