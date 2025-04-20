
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/contexts/types";
import { mockUsers, extractUserInfo } from "@/utils/authUtils";

/**
 * Service for authentication-related operations
 */
export class AuthService {
  /**
   * Log in with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      console.log("=== Email/password login started ===");
      console.log("Email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Auth error:", error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error("User not found");
      }
      
      console.log("Login successful for user:", data.user.id);
      return extractUserInfo(data.user);
    } catch (error) {
      console.error("Login error in service:", error);
      
      // Fallback to mock users for development (will be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log("Attempting fallback to mock users for development");
        const mockUser = mockUsers.find(u => u.email === email);
        if (mockUser) {
          console.log("Found mock user:", mockUser);
          return mockUser;
        }
      }
      
      throw error;
    }
  }

  /**
   * Log in with Google
   */
  async loginWithGoogle(): Promise<void> {
    try {
      // Get the current URL for proper redirect handling
      const currentUrl = window.location.origin;
      const hostname = window.location.hostname;
      let redirectTo = `${currentUrl}/login`;
      
      // Add more logging for debugging
      console.log("=== Google OAuth Flow Initiated ===");
      console.log("Current URL:", currentUrl);
      console.log("Current hostname:", hostname);
      console.log("Redirect URL:", redirectTo);
      
      // Log the current session before attempting login
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current session before Google login:", sessionData);
      
      // Define the scopes we need - being explicit here helps with debugging
      const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/drive.file",
        "openid"
      ];
      
      console.log("Requesting the following scopes:", scopes);
      console.log("Scope string:", scopes.join(" "));
      
      // Initiate the OAuth flow with the properly configured options
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            prompt: 'consent', // Force consent screen to show every time
            access_type: 'offline', // Request refresh token
            scope: scopes.join(" ")
          }
        }
      });
      
      // Handle any errors that occur during OAuth initialization
      if (error) {
        console.error("=== Google OAuth Error ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        console.error("Error status:", error.status);
        console.error("Full error:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log("=== Google OAuth Response ===");
      console.log("Auth data:", data);
      console.log("Provider:", data?.provider);
      console.log("URL:", data?.url);
      
      // This won't execute as the user will be redirected
      console.log("OAuth flow redirecting user...");
    } catch (error) {
      console.error("=== Google OAuth Exception ===");
      console.error("Exception type:", error.constructor.name);
      console.error("Exception details:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
    }
  }

  /**
   * Sign up a new user
   */
  async signup(name: string, email: string, password: string, role?: "performer" | "choreographer"): Promise<User> {
    try {
      console.log("=== Signup started ===");
      console.log("Email:", email);
      console.log("Name:", name);
      console.log("Role:", role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: role || "performer"
          }
        }
      });
      
      if (error) {
        console.error("Signup error:", error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error("Failed to create user");
      }
      
      console.log("Signup successful for user:", data.user.id);
      return extractUserInfo(data.user);
    } catch (error) {
      console.error("Signup error in service:", error);
      
      // Fallback to mock users for development (will be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log("Using mock signup for development");
        
        // Check if email already exists in mock data
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
        
        console.log("Created mock user:", newUser);
        return newUser;
      }
      
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    console.log("=== Logout Initiated ===");
    
    // Log the current session before logout
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Current session before logout:", sessionData);
    
    const result = await supabase.auth.signOut();
    console.log("Logout result:", result);
    
    // Check if session was actually cleared
    const { data: postLogoutSession } = await supabase.auth.getSession();
    console.log("Session after logout:", postLogoutSession);
    
    console.log("=== Logout Completed ===");
  }
}

export const authService = new AuthService();
