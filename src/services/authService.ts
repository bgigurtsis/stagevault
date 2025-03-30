
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/contexts/types";
import { mockUsers, extractUserInfo } from "@/utils/authUtils";

/**
 * Service for authentication-related operations
 */
export class AuthService {
  /**
   * Log in with email and password (mock implementation)
   */
  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
      return user;
    } else {
      throw new Error("Invalid credentials");
    }
  }

  /**
   * Log in with Google
   */
  async loginWithGoogle(): Promise<void> {
    try {
      const currentUrl = window.location.origin;
      const redirectTo = `${currentUrl}/login`;
      
      console.log("=== Google OAuth Flow Initiated ===");
      console.log("Current URL:", currentUrl);
      console.log("Redirect URL:", redirectTo);
      
      // Log the current session before attempting login
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current session before Google login:", sessionData);
      
      // Detailed scopes logging
      const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/drive.file",
        "openid"
      ];
      
      console.log("Requesting the following scopes:", scopes);
      console.log("Scope string:", scopes.join(" "));
      
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
      
      if (error) {
        console.error("=== Google OAuth Error ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        console.error("Error status:", error.status);
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
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  /**
   * Sign up a new user (mock implementation)
   */
  async signup(name: string, email: string, password: string, role?: "performer" | "choreographer"): Promise<User> {
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
    
    return newUser;
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
