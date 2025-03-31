
import React from "react";
import { FlipHorizontal, Zap, Grid } from "lucide-react";

interface CameraControlsProps {
  onSwitchCamera: () => void;
  onToggleFlash: () => void;
  flashEnabled: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  onSwitchCamera,
  onToggleFlash,
  flashEnabled
}) => {
  return (
    <div className="flex items-center gap-4">
      <button 
        className={`camera-control-btn ${flashEnabled ? 'active' : ''}`}
        onClick={onToggleFlash}
        aria-label={flashEnabled ? "Disable flash" : "Enable flash"}
      >
        <Zap className="h-5 w-5" />
      </button>
      
      <button 
        className="camera-control-btn"
        onClick={onSwitchCamera}
        aria-label="Switch camera"
      >
        <FlipHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
};

export default CameraControls;
