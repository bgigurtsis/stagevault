
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
        <div className="flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="w-full">
            <h3 className="font-semibold text-red-900">Camera Access Error</h3>
            <p className="text-red-700 mt-1 text-sm">{errorMessage}</p>
            
            {isPermissionDenied && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                <p className="font-medium">To fix this issue:</p>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Click the camera icon in your address bar</li>
                  <li>Select "Allow" for camera and microphone</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            )}
            
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onRetry} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" size="sm" onClick={onScreenShare} className="flex-1">
                Try Screen Share
              </Button>
              {onResetPermissions && (
                <Button variant="destructive" size="sm" onClick={onResetPermissions} className="w-full mt-2">
                  Reset Permissions
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraError;
