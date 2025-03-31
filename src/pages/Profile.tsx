
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Check, AlertCircle, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { googleDriveService } from "@/services/googleDriveService";

export default function Profile() {
  const { currentUser, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean | null>(null);

  // Check Google Drive connection status when the page loads
  useState(() => {
    checkDriveConnection();
  });

  const checkDriveConnection = async () => {
    setIsCheckingDrive(true);
    try {
      const result = await googleDriveService.testDriveAccess();
      setIsDriveConnected(result.success);
    } catch (error) {
      console.error("Error checking Drive connection:", error);
      setIsDriveConnected(false);
    } finally {
      setIsCheckingDrive(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      toast({
        title: "Connecting to Google Drive",
        description: "You'll be redirected to Google to authorize access."
      });
      await googleDriveService.connectGoogleDrive();
    } catch (error) {
      console.error("Error connecting to Drive:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Drive. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="container py-8">Loading profile...</div>;
  }

  if (!currentUser) {
    return <div className="container py-8">Please log in to view your profile.</div>;
  }

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-7 w-7" />
          <span>Profile Settings</span>
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Name</p>
            <p className="text-lg">{currentUser.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Email</p>
            <p className="text-lg">{currentUser.email}</p>
          </div>
          {currentUser.role && (
            <div>
              <p className="text-sm font-medium mb-1">Role</p>
              <p className="text-lg capitalize">{currentUser.role}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Drive Connection
          </CardTitle>
          <CardDescription>
            Connect your Google Drive account to store recordings, create performance folders, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCheckingDrive ? (
            <div className="py-4">Checking connection status...</div>
          ) : isDriveConnected ? (
            <div className="flex items-center gap-2 py-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Connected to Google Drive</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 py-2 text-amber-600">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <span className="font-medium block">Google Drive Not Connected</span>
                  <span className="text-sm text-muted-foreground">
                    You need to connect Google Drive to create performances with folders and store recordings.
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isDriveConnected ? (
            <Button variant="outline" onClick={checkDriveConnection}>
              Check Connection
            </Button>
          ) : (
            <Button onClick={handleConnectDrive}>
              Connect Google Drive
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
