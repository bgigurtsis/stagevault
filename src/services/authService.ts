
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
      console.log("Google login initiated");
      console.log("Current URL:", currentUrl);
      console.log("Redirecting to:", redirectTo);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file openid',
          }
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        throw error;
      }
      
      console.log("Google OAuth response:", data);
    } catch (error) {
      console.error("Google login error:", error);
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
    console.log("Logging out user");
    await supabase.auth.signOut();
    console.log("User logged out");
  }
}

export const authService = new AuthService();
