
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/contexts/types";

/**
 * Extract user information from Supabase user object
 * Implemented with thorough error handling to avoid undefined values
 */
export const extractUserInfo = (user: SupabaseUser | null | undefined): User => {
  // Added additional null check at the beginning
  if (!user) {
    console.error("Cannot extract user info: user object is undefined or null");
    throw new Error("Invalid user object");
  }
  
  console.log("Extracting user info for user:", user.id);
  const safeUser = { ...user }; // Create a safe copy to work with
  
  try {
    console.log("Full user object:", JSON.stringify(safeUser, null, 2));
  } catch (error) {
    console.error("Error stringifying user object:", error);
    console.log("User object cannot be stringified, attempting to log properties individually");
    console.log("User ID:", safeUser.id);
    console.log("User email:", safeUser.email);
    console.log("User metadata exists:", !!safeUser.user_metadata);
  }
  
  // Safely get name, ensuring we always have a string even if metadata is incomplete
  const getName = () => {
    try {
      // Check if user metadata exists and contains name information
      if (safeUser.user_metadata) {
        console.log("User metadata available:", JSON.stringify(safeUser.user_metadata, null, 2));
        
        if (typeof safeUser.user_metadata.name === 'string' && safeUser.user_metadata.name) {
          console.log("Using name from user_metadata.name:", safeUser.user_metadata.name);
          return safeUser.user_metadata.name;
        }
        
        if (typeof safeUser.user_metadata.full_name === 'string' && safeUser.user_metadata.full_name) {
          console.log("Using name from user_metadata.full_name:", safeUser.user_metadata.full_name);
          return safeUser.user_metadata.full_name;
        }
      }
      
      // If no name in metadata, try to extract from email
      if (safeUser.email && typeof safeUser.email === 'string') {
        console.log("No name in metadata, extracting from email:", safeUser.email);
        try {
          const emailParts = safeUser.email.split('@');
          if (emailParts[0]) {
            console.log("Using name from email:", emailParts[0]);
            return emailParts[0];
          }
        } catch (error) {
          console.error("Error extracting name from email:", error);
          console.error("Email that caused error:", safeUser.email);
        }
      }
      
      // Fallback to default
      console.log("No valid name found, using default: 'User'");
      return "User";
    } catch (error) {
      console.error("Error extracting user name:", error);
      try {
        console.error("User object that caused error:", JSON.stringify(safeUser, null, 2));
      } catch (jsonError) {
        console.error("Could not stringify user object:", jsonError);
      }
      return "User";
    }
  };
  
  // Safely get profile picture URL
  const getProfilePicture = () => {
    try {
      if (safeUser.user_metadata) {
        console.log("Checking user_metadata for profile picture");
        
        if (typeof safeUser.user_metadata.avatar_url === 'string' && safeUser.user_metadata.avatar_url) {
          console.log("Using avatar_url from metadata:", safeUser.user_metadata.avatar_url);
          return safeUser.user_metadata.avatar_url;
        }
        
        if (typeof safeUser.user_metadata.picture === 'string' && safeUser.user_metadata.picture) {
          console.log("Using picture from metadata:", safeUser.user_metadata.picture);
          return safeUser.user_metadata.picture;
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
      try {
        console.error("User object that caused error:", JSON.stringify(safeUser, null, 2));
      } catch (jsonError) {
        console.error("Could not stringify user object:", jsonError);
      }
      return `https://ui-avatars.com/api/?name=User&background=random`;
    }
  };
  
  // Get role with proper fallback
  const getRole = () => {
    try {
      if (safeUser.user_metadata && safeUser.user_metadata.role) {
        const role = safeUser.user_metadata.role;
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
      id: safeUser.id,
      name: userName,
      email: safeUser.email || "",
      profilePicture: profilePic,
      role: userRole as "performer" | "choreographer"  // Add type assertion for clarity
    };
    
    console.log("User info extracted:", userInfo);
    return userInfo;
  } catch (error) {
    console.error("Fatal error in extractUserInfo:", error);
    try {
      console.error("User object that caused error:", JSON.stringify(safeUser, null, 2));
    } catch (jsonError) {
      console.error("Could not stringify user object:", jsonError);
    }
    
    // Create an emergency fallback user to prevent app crash
    const fallbackUser = {
      id: safeUser.id,
      name: "User",
      email: safeUser.email || "",
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
