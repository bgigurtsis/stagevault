
import React from "react";
import { Camera } from "lucide-react";

const CameraInitializing: React.FC = () => {
  return (
    <div className="camera-initializing">
      <Camera className="h-16 w-16 animate-pulse" />
      <p className="font-medium text-xl">
        Initializing camera...
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Please allow camera access when prompted
      </p>
    </div>
  );
};

export default CameraInitializing;
