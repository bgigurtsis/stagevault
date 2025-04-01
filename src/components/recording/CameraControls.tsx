
import React, { useEffect, useState } from "react";
import { FlipHorizontal, Zap, Grid, Smartphone } from "lucide-react";
import { getCameraControlsSupport } from "@/utils/cameraUtils";

interface CameraControlsProps {
  onSwitchCamera: () => void;
  onToggleFlash: () => void;
  flashEnabled: boolean;
  stream?: MediaStream;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  onSwitchCamera,
  onToggleFlash,
  flashEnabled,
  stream
}) => {
  const [flashSupported, setFlashSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log('[CAMERA-DEBUG] Device is mobile:', mobile);
    };
    
    // Check for flash support if stream is available
    const checkFlashSupport = async () => {
      if (!stream) return;
      
      try {
        const { flashSupported } = await getCameraControlsSupport(stream);
        console.log('[CAMERA-DEBUG] Flash support detected:', flashSupported);
        setFlashSupported(flashSupported);
      } catch (error) {
        console.error('[CAMERA-DEBUG] Error checking camera capabilities:', error);
        setFlashSupported(false);
      }
    };
    
    checkMobile();
    checkFlashSupport();
  }, [stream]);

  return (
    <div className="flex items-center gap-4">
      {flashSupported && (
        <button 
          className={`camera-control-btn ${flashEnabled ? 'active' : ''}`}
          onClick={onToggleFlash}
          aria-label={flashEnabled ? "Disable flash" : "Enable flash"}
          title={flashEnabled ? "Disable flash" : "Enable flash"}
        >
          <Zap className={`h-5 w-5 ${flashEnabled ? 'text-yellow-400' : ''}`} />
        </button>
      )}
      
      <button 
        className="camera-control-btn"
        onClick={onSwitchCamera}
        aria-label="Switch camera"
        title="Switch camera"
      >
        <FlipHorizontal className="h-5 w-5" />
      </button>
      
      {isMobile && (
        <div className="ml-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default CameraControls;
