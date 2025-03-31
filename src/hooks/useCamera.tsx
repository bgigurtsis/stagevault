
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseCameraOptions {
  onCameraError?: (error: string) => void;
}

export const useCamera = (options?: UseCameraOptions) => {
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  
  // Logging utility
  const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    console.log(logMessage, data);
  };
  
  const enumerateDevices = async () => {
    try {
      logDebug("Enumerating devices");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      logDebug("Available video devices", videoDevices);
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId || videoDevices[0].groupId || "default-camera");
        logDebug("Selected default camera", videoDevices[0].deviceId);
      }
      
      return videoDevices;
    } catch (error) {
      logDebug("Error enumerating devices", error);
      return [];
    }
  };
  
  const tryAccessCamera = async (attemptNumber = 1, deviceId?: string): Promise<MediaStream> => {
    logDebug(`Camera access attempt #${attemptNumber}`, { deviceId });
    
    let constraints: MediaStreamConstraints;
    
    if (attemptNumber === 1 && deviceId) {
      constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };
    } else if (attemptNumber === 1) {
      constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };
    } else if (attemptNumber === 2) {
      constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: true
      };
    } else {
      constraints = {
        video: true,
        audio: true
      };
      setUsingFallbackMode(true);
    }
    
    logDebug("Using constraints", constraints);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      logDebug(`Attempt #${attemptNumber} failed`, error);
      
      if (attemptNumber < 3) {
        return tryAccessCamera(attemptNumber + 1, deviceId);
      }
      
      throw error;
    }
  };
  
  const startCamera = async (deviceId?: string) => {
    try {
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      
      const stream = await tryAccessCamera(1, deviceId);
      
      setIsInitializingCamera(false);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            setCameraAccessError("Error playing video stream. Please refresh and try again.");
          });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsInitializingCamera(false);
      
      let errorMessage = "Failed to access camera and microphone.";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow access in your browser settings and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera detected. Please connect a camera and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is in use by another application. Please close other apps using your camera.";
        }
      }
      
      setCameraAccessError(errorMessage);
      if (options?.onCameraError) {
        options.onCameraError(errorMessage);
      }
      
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const switchCamera = async () => {
    // Stop existing camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Update camera selection to next available camera
    const cameras = await enumerateDevices();
    if (cameras.length <= 1) return;
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    
    setSelectedCameraId(nextCamera.deviceId);
    startCamera(nextCamera.deviceId);
  };
  
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;
      
      const capabilities = videoTrack.getCapabilities();
      // Check if the torch capability exists before accessing it
      if (!capabilities || typeof capabilities === 'undefined' || !('torch' in capabilities)) {
        toast({
          title: "Flash not supported",
          description: "Your camera does not support flash/torch mode",
          variant: "destructive",
        });
        return;
      }
      
      const newFlashState = !flashEnabled;
      
      // Use type assertion to avoid TypeScript error for the torch property
      const advancedConstraints = [{} as MediaTrackConstraintSet];
      (advancedConstraints[0] as any).torch = newFlashState;
      
      await videoTrack.applyConstraints({
        advanced: advancedConstraints
      });
      
      setFlashEnabled(newFlashState);
      
      toast({
        title: newFlashState ? "Flash enabled" : "Flash disabled",
        duration: 1500,
      });
    } catch (error) {
      console.error("Error toggling flash:", error);
      toast({
        title: "Flash control failed",
        description: "Unable to control flash. Your device may not support this feature.",
        variant: "destructive",
      });
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const attemptScreenshareWithCamera = async () => {
    try {
      logDebug("Attempting screenshare with camera fallback");
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      logDebug("Screen sharing initialized");
      setUsingFallbackMode(true);
      setIsInitializingCamera(false);
      streamRef.current = displayStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            logDebug("Error playing screenshare video", err);
            setCameraAccessError("Error playing video stream. Please refresh and try again.");
          });
        };
      }
      
      toast({
        title: "Screen sharing mode",
        description: "Recording your screen instead of camera. Click Stop when finished.",
      });
      
      return displayStream;
    } catch (error) {
      logDebug("Screenshare fallback failed", error);
      setIsInitializingCamera(false);
      setCameraAccessError("Both camera access and screen sharing failed. Please check your browser settings.");
      
      toast({
        title: "Recording failed",
        description: "Unable to access camera or screen. Please check permissions.",
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  return {
    videoRef,
    streamRef,
    isInitializingCamera,
    cameraAccessError,
    selectedCameraId,
    availableCameras,
    flashEnabled,
    usingFallbackMode,
    startCamera,
    stopCamera,
    switchCamera,
    toggleFlash,
    enumerateDevices,
    attemptScreenshareWithCamera,
    setCameraAccessError
  };
};
