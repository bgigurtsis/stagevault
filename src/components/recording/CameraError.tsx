
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onScreenShare: () => void;
}

const CameraError: React.FC<CameraErrorProps> = ({ 
  errorMessage, 
  onRetry, 
  onScreenShare 
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
        <div className="flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Camera Access Error</h3>
            <p className="text-red-700 mt-1 text-sm">{errorMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try Again
              </Button>
              <Button variant="outline" size="sm" onClick={onScreenShare}>
                Try Screen Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraError;
