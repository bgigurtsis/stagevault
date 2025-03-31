
import React from "react";
import { Camera } from "lucide-react";

const CameraInitializing: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white">
      <Camera className="h-16 w-16 animate-pulse text-primary" />
      <p className="font-medium text-xl mt-4">
        Initializing camera...
      </p>
      <p className="text-sm text-white/70 mt-2">
        Please allow camera access when prompted
      </p>
    </div>
  );
};

export default CameraInitializing;
