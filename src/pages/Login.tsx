
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define an error boundary component for catching render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Login page error boundary caught error:", error);
    console.error("Error details:", errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="mb-4 text-gray-700">The login page encountered an error.</p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto mb-4">
              {this.state.error && this.state.error.toString()}
            </pre>
            <Button 
              onClick={() => {
                console.log("Login page reset attempted");
                window.location.href = '/login';
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  })
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [debugState, setDebugState] = useState({
    hashProcessed: false,
    hashParams: {},
    authStage: "initializing",
  });
  const {
    login,
    loginWithGoogle,
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  console.log("=== Login Component Rendered ===");
  console.log("isAuthenticated:", isAuthenticated);
  console.log("Current URL:", window.location.href);
  console.log("Has hash:", !!window.location.hash);
  console.log("Debug state:", debugState);

  // Handle OAuth redirect and hash parameters
  useEffect(() => {
    try {
      console.log("=== OAuth Redirect Handler useEffect Started ===");
      
      const parseHashParams = (hash: string) => {
        if (!hash || typeof hash !== 'string') {
          console.log("No hash or invalid hash format");
          return {};
        }
        
        try {
          const params = new URLSearchParams(hash.substring(1));
          const result: Record<string, string> = {};
          for (const [key, value] of params.entries()) {
            result[key] = value;
          }
          console.log("Parsed hash params:", result);
          return result;
        } catch (error) {
          console.error("Error parsing hash params:", error);
          return {};
        }
      };

      const hash = window.location.hash;
      console.log("=== Checking URL hash for auth tokens ===");
      console.log("Hash exists:", !!hash);
      console.log("Full URL:", window.location.href);
      
      if (hash) {
        console.log("Full hash string:", hash);

        const hashParams = parseHashParams(hash);
        console.log("Parsed hash parameters:", hashParams);
        setDebugState(prev => ({ ...prev, hashParams, hashProcessed: true }));
        
        if (hashParams.access_token) {
          setDebugState(prev => ({ ...prev, authStage: "access_token_found" }));
          console.log("=== Access token found in hash ===");
          console.log("Access token (first 20 chars):", hashParams.access_token.substring(0, 20) + "...");
          console.log("Token type:", hashParams.token_type);
          console.log("Expires in:", hashParams.expires_in);
          console.log("Refresh token exists:", !!hashParams.refresh_token);

          if (hashParams.provider_token) {
            console.log("Provider token exists (first 20 chars):", hashParams.provider_token.substring(0, 20) + "...");
          } else {
            console.warn("No provider_token in hash! This is needed for Google Drive access");
            console.log("Requested scopes may not have been granted");
          }
          
          if (hashParams.access_token && hashParams.refresh_token) {
            setDebugState(prev => ({ ...prev, authStage: "setting_session" }));
            console.log("Attempting to set session from hash parameters");
            
            // Add a small delay to ensure the auth system is ready
            setTimeout(() => {
              try {
                console.log("Starting setSession with tokens");
                supabase.auth.setSession({
                  access_token: hashParams.access_token,
                  refresh_token: hashParams.refresh_token
                }).then(({
                  data,
                  error
                }) => {
                  if (error) {
                    setDebugState(prev => ({ ...prev, authStage: "session_error", error }));
                    console.error("=== Error setting session ===");
                    console.error("Error object:", error);
                    console.error("Error message:", error.message);
                    console.error("Error status:", error.status);
                    toast({
                      title: "Authentication error",
                      description: "Failed to complete login. Please try again.",
                      variant: "destructive"
                    });
                  } else {
                    setDebugState(prev => ({ ...prev, authStage: "session_set_success" }));
                    console.log("=== Session set successfully ===");
                    console.log("Session exists:", !!data.session);
                    if (data.session) {
                      console.log("User ID:", data.session.user.id);
                      console.log("Session expires at:", new Date(data.session.expires_at * 1000).toISOString());
                      console.log("Provider token exists:", !!data.session.provider_token);
                      console.log("User metadata:", JSON.stringify(data.session.user.user_metadata, null, 2));
                      
                      if (data.session.provider_token) {
                        console.log("Provider token (first 20 chars):", data.session.provider_token.substring(0, 20) + "...");
                      } else {
                        console.warn("No provider token in session - Google Drive API won't work!");
                      }
                      
                      console.log("User authenticated, preparing to redirect to home page");
                      
                      // Ensure state is updated before redirecting
                      setTimeout(() => {
                        setDebugState(prev => ({ ...prev, authStage: "redirecting" }));
                        console.log("Redirecting to home now");
                        navigate("/");
                        toast({
                          title: "Welcome back!",
                          description: "You have successfully logged in."
                        });
                      }, 500);
                    } else {
                      console.error("Session was set but no session object returned");
                    }
                  }
                }).catch(err => {
                  setDebugState(prev => ({ ...prev, authStage: "critical_error", error: err }));
                  console.error("Critical error setting session:", err);
                  console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
                  toast({
                    title: "Authentication error",
                    description: "A critical error occurred. Please try logging in again.",
                    variant: "destructive"
                  });
                });
              } catch (err) {
                setDebugState(prev => ({ ...prev, authStage: "setSession_exception", error: err }));
                console.error("Exception during setSession call:", err);
                console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
              }
            }, 300);
          }

          // Clear the hash from the URL to avoid auth parameters being visible
          try {
            window.history.replaceState(null, document.title, window.location.pathname);
            console.log("URL hash cleared");
          } catch (error) {
            console.error("Error clearing URL hash:", error);
          }
        }
      }

      console.log("Current path:", window.location.pathname);
      console.log("Current full URL:", window.location.href);
      console.log("=== OAuth Redirect Handler useEffect Completed ===");
    } catch (error) {
      setDebugState(prev => ({ ...prev, authStage: "redirect_effect_error", error }));
      console.error("Critical error in hash handling:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
  }, [navigate, toast]);

  // Normal auth check and redirect
  useEffect(() => {
    try {
      console.log("=== Login - auth status check useEffect ===");
      console.log("isAuthenticated:", isAuthenticated);
      if (isAuthenticated) {
        setDebugState(prev => ({ ...prev, authStage: "is_authenticated_true" }));
        console.log("User is authenticated, redirecting to home page");
        navigate("/");
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in."
        });
      }
    } catch (error) {
      setDebugState(prev => ({ ...prev, authStage: "auth_check_error", error }));
      console.error("Error in auth status check:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
  }, [isAuthenticated, navigate, toast]);

  // Google login handler
  const handleGoogleLogin = async () => {
    try {
      console.log("=== Google login button clicked ===");
      setLoading(true);
      setDebugState(prev => ({ ...prev, authStage: "google_login_clicked" }));
      console.log("Calling loginWithGoogle function");
      console.log("Current hostname:", window.location.hostname);
      console.log("Current origin:", window.location.origin);
      await loginWithGoogle();
      setDebugState(prev => ({ ...prev, authStage: "google_login_completed" }));
      console.log("loginWithGoogle function completed - redirect should happen via OAuth");
    } catch (error) {
      setDebugState(prev => ({ ...prev, authStage: "google_login_error", error }));
      console.error("=== Login failed ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Form submission handler
  const onSubmit = async (values: LoginFormValues) => {
    try {
      console.log("=== Email/password login form submitted ===");
      setLoading(true);
      setDebugState(prev => ({ ...prev, authStage: "email_login_started" }));
      
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      
      if (error) {
        setDebugState(prev => ({ ...prev, authStage: "email_login_error", error }));
        console.error("=== Login failed ===");
        console.error("Error object:", error);
        console.error("Error message:", error.message);
        throw error;
      }
      
      setDebugState(prev => ({ ...prev, authStage: "email_login_success" }));
      console.log("=== Login successful ===");
      console.log("User:", data.user);
      console.log("Session:", data.session);
      
      navigate("/");
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="rounded-xl bg-stage-orange p-2 mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">StageVault</h1>
          <p className="text-muted-foreground mt-1">Rehearsal Recording & Management</p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Sign in to your StageVault account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button variant="outline" className="w-full flex gap-2 items-center justify-center py-6" onClick={handleGoogleLogin} disabled={loading}>
              {loading ? <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span> : <>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Sign in with Google
                </>}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({
                field
                }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="password" render={({
                field
                }) => <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span> : "Sign In"}
                </Button>
              </form>
            </Form>
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

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg w-full max-w-md">
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="text-xs font-mono overflow-auto bg-white p-2 rounded border">
              <pre>{JSON.stringify(debugState, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
