
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Login component rendered, isAuthenticated:", isAuthenticated);

  // Handle authentication hash params in URL
  useEffect(() => {
    // Check for hash parameters (access_token, etc.) which indicates a successful OAuth redirect
    const hash = window.location.hash;
    console.log("Checking URL hash for auth tokens:", hash ? "Hash exists" : "No hash");
    
    if (hash) {
      console.log("Full hash string:", hash);
      
      if (hash.includes("access_token")) {
        console.log("Access token found in hash");
        
        // Log all parameters in the hash for debugging
        const hashParams = new URLSearchParams(hash.substring(1));
        for (const [key, value] of hashParams.entries()) {
          console.log(`Hash parameter: ${key} = ${value.substring(0, 10)}...`);
        }
        
        // Get the session from the hash
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresAt = hashParams.get('expires_at');
        
        if (accessToken && refreshToken) {
          console.log("Attempting to set session from hash parameters");
          
          // Try to set the session manually
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).then(({ data, error }) => {
            if (error) {
              console.error("Error setting session:", error);
              toast({
                title: "Authentication error",
                description: "Failed to complete login. Please try again.",
                variant: "destructive",
              });
            } else {
              console.log("Session set successfully:", data.session ? "Session exists" : "No session");
              if (data.session) {
                console.log("User authenticated, redirecting to home page");
                navigate("/");
                toast({
                  title: "Welcome back!",
                  description: "You have successfully logged in.",
                });
              }
            }
          });
        }
        
        // Clear the hash from the URL to avoid issues on refresh
        window.history.replaceState(null, document.title, window.location.pathname);
        console.log("URL hash cleared");
      }
    }
    
    // Log the current path
    console.log("Current path:", window.location.pathname);
    console.log("Current full URL:", window.location.href);
  }, [navigate, toast]);

  // Check for existing session and redirect if authenticated
  useEffect(() => {
    console.log("Login - auth status check useEffect, isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting to home page");
      navigate("/");
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    }
  }, [isAuthenticated, navigate, toast]);

  const handleGoogleLogin = async () => {
    console.log("Google login button clicked");
    setLoading(true);
    
    try {
      console.log("Calling loginWithGoogle function");
      await loginWithGoogle();
      console.log("loginWithGoogle function completed - redirect should happen via OAuth");
      // No need to navigate here as the OAuth redirect will handle this
    } catch (error) {
      console.error("Login failed with error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="rounded-xl bg-stage-purple p-2 mb-4">
          <Video className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">StageVault</h1>
        <p className="text-muted-foreground mt-1">Dance Rehearsal Recording & Management</p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in to your StageVault account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex gap-2 items-center justify-center py-6" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
