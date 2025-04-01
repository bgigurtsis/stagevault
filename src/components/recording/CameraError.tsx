
import React from "react";
import { AlertCircle, RefreshCw, ScreenShare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CameraErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onScreenShare: () => void;
  onResetPermissions?: () => void;
}

const CameraError: React.FC<CameraErrorProps> = ({ 
  errorMessage, 
  onRetry, 
  onScreenShare,
  onResetPermissions
}) => {
  const isPermissionDenied = errorMessage.includes('denied') || errorMessage.includes('NotAllowedError');
  const isPermanentlyDenied = isPermissionDenied && errorMessage.includes('Permission denied');
  
  // Wrap handlers in explicit function to improve event handling
  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("CameraError: Try Again button clicked");
    onRetry();
  };
  
  const handleScreenShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("CameraError: Screen Share button clicked");
    onScreenShare();
  };
  
  // Function to handle manual browser permission reset instructions
  const handleManualReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("CameraError: Reset Permissions button clicked");
    
    // Open a new window with instructions if available
    if (window.open) {
      const browserName = navigator.userAgent.indexOf("Chrome") > -1 ? "Chrome" : 
                         navigator.userAgent.indexOf("Firefox") > -1 ? "Firefox" : 
                         navigator.userAgent.indexOf("Safari") > -1 ? "Safari" : "your browser";
      
      try {
        window.open(`https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform%3DDesktop`, 
                   'browser_permissions', 
                   'width=800,height=600');
      } catch (err) {
        console.error("Failed to open browser settings window:", err);
      }
    }
    
    // Also trigger the reset permissions callback if available
    if (onResetPermissions) {
      onResetPermissions();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 z-20">
      <div className="bg-background border rounded-lg p-6 max-w-md w-full shadow-lg">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Camera Access Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        
        {isPermanentlyDenied ? (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            <p className="font-medium mb-2">Your browser has permanently blocked camera access</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click the camera/lock icon in your browser's address bar</li>
              <li>Select "Allow" for camera and microphone</li>
              <li>Refresh this page</li>
              <li>If that doesn't work, try clearing site data or using incognito mode</li>
            </ol>
          </div>
        ) : isPermissionDenied ? (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            <p className="font-medium mb-2">To fix this issue:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click the camera icon in your address bar</li>
              <li>Select "Allow" for camera and microphone</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        ) : null}
        
        <div className="mt-6 flex flex-col gap-3">
          <Button 
            variant="default" 
            size="lg" 
            onClick={handleRetry} 
            className="w-full justify-start"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={handleScreenShare} 
            className="w-full justify-start"
          >
            <ScreenShare className="mr-2 h-4 w-4" />
            Use Screen Share Instead
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleManualReset} 
            className="w-full justify-start"
          >
            <Settings className="mr-2 h-4 w-4" />
            Reset Permissions in Browser
          </Button>
        </div>
        
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Note: If you continue to experience issues, try refreshing the page or using a different browser.
        </p>
      </div>
    </div>
  );
};

export default CameraError;
