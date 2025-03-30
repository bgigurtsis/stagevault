
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { AuthContextType } from "@/contexts/types";

/**
 * Hook to access the auth context
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  
  return context;
};

// Export with alias for backward compatibility
export const useAuth = useAuthContext;
