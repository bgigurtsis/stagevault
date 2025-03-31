
import React from "react";
import { FlipHorizontal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="absolute bottom-4 right-4 flex gap-2">
      <Button 
        variant="secondary" 
        size="icon"
        className="bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
        onClick={onSwitchCamera}
      >
        <FlipHorizontal className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="secondary" 
        size="icon"
        className={`${flashEnabled ? 'bg-yellow-500/70 hover:bg-yellow-500/90' : 'bg-black/30 hover:bg-black/50'} text-white rounded-full h-10 w-10`}
        onClick={onToggleFlash}
      >
        <Zap className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CameraControls;
