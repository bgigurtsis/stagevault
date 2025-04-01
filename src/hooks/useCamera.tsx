import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  checkBrowserCompatibility, 
  isCameraPermissionPersistentlyDenied,
  openBrowserPermissionSettings,
  isProbablyPermanentlyBlocked,
  handleCameraTimeout,
  getUserMediaWithTimeout,
  getMobileStreamWithTimeout,
  tryMediaWithFallback,
  getScreenShareWithAudio,
  emergencyMediaFallback,
  getVideoOnlyStream
} from "@/utils/cameraUtils";

interface UseCameraOptions {
  onCameraError?: (error: string) => void;
  timeoutDuration?: number;
  enableDebugLogging?: boolean;
}

export const useCamera = (options?: UseCameraOptions) => {
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isPermissionPermanentlyDenied, setIsPermissionPermanentlyDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  const debug = options?.enableDebugLogging !== false;
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log('[CAMERA-DEBUG] Device is mobile:', mobile);
    };
    checkMobile();
  }, []);
  
  const logDebug = (message: string, data?: any) => {
    if (!debug) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    console.log(logMessage, data);
  };

  const checkPermissionStatus = async () => {
    try {
      logDebug("Checking camera permission status");
      
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(cameraPermission.state);
        
        logDebug(`Permission state: ${cameraPermission.state}`);
        
        setIsPermissionPermanentlyDenied(cameraPermission.state === 'denied');
        
        cameraPermission.addEventListener('change', () => {
          logDebug(`Permission state changed to: ${cameraPermission.state}`);
          setPermissionState(cameraPermission.state);
          setIsPermissionPermanentlyDenied(cameraPermission.state === 'denied');
          
          if (cameraPermission.state === 'granted') {
            logDebug("Permission newly granted, starting camera");
            setCameraAccessError(null);
            startCamera();
          }
        });
        
        return cameraPermission.state;
      }
    } catch (error) {
      logDebug("Error checking permission status", error);
    }
    return null;
  };
  
  const enumerateDevices = async () => {
    try {
      logDebug("Enumerating devices");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      logDebug(`Found ${videoDevices.length} video devices`);
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCameraId) {
        const defaultCamera = videoDevices[0];
        setSelectedCameraId(defaultCamera.deviceId || defaultCamera.groupId || "default-camera");
        logDebug("Selected default camera", defaultCamera);
      }
      
      return videoDevices;
    } catch (error) {
      logDebug("Error enumerating devices", error);
      return [];
    }
  };
  
  const tryAccessCamera = async (attemptNumber = 1, deviceId?: string): Promise<MediaStream> => {
    logDebug(`Camera access attempt #${attemptNumber}`, { deviceId });
    
    try {
      logDebug("Using video-only strategy as primary method");
      return await getVideoOnlyStream();
    } catch (error) {
      logDebug(`Video-only strategy failed`, error);
      
      if (attemptNumber < 2) {
        logDebug(`Trying again with attempt #${attemptNumber + 1}`);
        setRetryCount(attemptNumber);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return tryAccessCamera(attemptNumber + 1, deviceId);
      }
      
      logDebug("Falling back to emergency strategies");
      const emergencyStream = await emergencyMediaFallback();
      if (emergencyStream) {
        setUsingFallbackMode(true);
        toast({
          title: "Camera access successful",
          description: "Using simplified video mode.",
          duration: 2000,
        });
        return emergencyStream;
      }
      
      throw error;
    }
  };
  
  const resetPermissions = useCallback(() => {
    logDebug("Resetting permissions manually");
    openBrowserPermissionSettings();
    
    toast({
      title: "Permission Reset Instructions",
      description: "Please check your browser settings to reset camera permissions, then refresh this page.",
      duration: 6000,
    });
  }, [toast]);
  
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      logDebug("Starting camera", { deviceId });
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      setUsingFallbackMode(false);
      
      if (timeoutRef.current) {
        logDebug("Clearing previous timeout");
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (streamRef.current) {
        logDebug("Stopping existing stream");
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logDebug(`Stopped track: ${track.kind}:${track.label}`);
        });
        streamRef.current = null;
      }
      
      const permissionState = await checkPermissionStatus();
      logDebug("Permission state", permissionState);
      
      if (permissionState === 'denied') {
        logDebug("Permission already denied");
        setIsPermissionPermanentlyDenied(true);
        throw new Error("Camera access is permanently denied. Please update your browser settings.");
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const stream = await tryAccessCamera(1, deviceId);
      
      setIsInitializingCamera(false);
      streamRef.current = stream;
      
      if (videoRef.current) {
        logDebug("Setting video source");
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          logDebug("Video metadata loaded, playing video");
          videoRef.current?.play().catch(err => {
            logDebug("Error playing video stream", err);
            setCameraAccessError("Error playing video stream. Please refresh and try again.");
          });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      logDebug("Camera access error", error);
      setIsInitializingCamera(false);
      
      let errorMessage = "Failed to access camera and microphone.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow access in your browser settings and try again.";
          await checkPermissionStatus();
          
          const isPermanent = await isCameraPermissionPersistentlyDenied();
          setIsPermissionPermanentlyDenied(isPermanent);
          
          if (isPermanent) {
            errorMessage = "Camera access is permanently denied by your browser. Please update your settings to allow access.";
          }
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera detected. Please connect a camera and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is in use by another application. Please close other apps using your camera.";
        } else if (error.message.includes("Timeout")) {
          errorMessage = "Timeout starting video source. Please try again or use a different camera.";
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
  }, [toast, options, checkPermissionStatus]);
  
  const switchCamera = useCallback(async () => {
    logDebug("Switching camera");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    const cameras = await enumerateDevices();
    if (cameras.length <= 1) {
      logDebug("Only one camera available, can't switch");
      toast({
        title: "Camera switching failed",
        description: "Only one camera is available.",
        variant: "destructive",
      });
      return;
    }
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    
    logDebug(`Switching from camera ${currentIndex} to camera ${nextIndex}`);
    setSelectedCameraId(nextCamera.deviceId);
    startCamera(nextCamera.deviceId);
  }, [selectedCameraId, startCamera, enumerateDevices, toast]);
  
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) {
      logDebug("No stream available, can't toggle flash");
      return;
    }
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        logDebug("No video track, can't toggle flash");
        return;
      }
      
      const capabilities = videoTrack.getCapabilities();
      logDebug("Track capabilities", capabilities);
      
      if (!capabilities || typeof capabilities === 'undefined' || !('torch' in capabilities)) {
        logDebug("Flash not supported by this camera");
        toast({
          title: "Flash not supported",
          description: "Your camera does not support flash/torch mode",
          variant: "destructive",
        });
        return;
      }
      
      const newFlashState = !flashEnabled;
      logDebug(`Setting flash to ${newFlashState}`);
      
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
      logDebug("Error toggling flash", error);
      toast({
        title: "Flash control failed",
        description: "Unable to control flash. Your device may not support this feature.",
        variant: "destructive",
      });
    }
  }, [flashEnabled, toast]);
  
  const stopCamera = useCallback(() => {
    logDebug("Stopping camera");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        logDebug(`Stopping track: ${track.kind}:${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setCameraAccessError(null);
    setIsInitializingCamera(false);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
      
      try {
        videoRef.current.load();
      } catch (e) {
        // Ignore errors from load()
      }
    }
  }, []);
  
  const attemptScreenshareWithCamera = useCallback(async () => {
    try {
      logDebug("Attempting screenshare fallback");
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      
      if (streamRef.current) {
        logDebug("Stopping existing stream before screen share");
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const displayStream = await getScreenShareWithAudio();
      
      logDebug("Screen sharing initialized", {
        videoTracks: displayStream.getVideoTracks().length,
        audioTracks: displayStream.getAudioTracks().length
      });
      
      setUsingFallbackMode(true);
      setIsInitializingCamera(false);
      streamRef.current = displayStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        videoRef.current.onloadedmetadata = () => {
          logDebug("Screen share video metadata loaded, playing");
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
  }, [toast]);
  
  useEffect(() => {
    logDebug("Running camera initialization and compatibility check");
    const compatibility = checkBrowserCompatibility();
    
    enumerateDevices();
    
    return () => {
      logDebug("Cleaning up camera resources");
      stopCamera();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [stopCamera]);
  
  return {
    videoRef,
    streamRef,
    isInitializingCamera,
    cameraAccessError,
    selectedCameraId,
    availableCameras,
    flashEnabled,
    usingFallbackMode,
    permissionState,
    isPermissionPermanentlyDenied,
    startCamera,
    stopCamera,
    switchCamera,
    toggleFlash,
    enumerateDevices,
    attemptScreenshareWithCamera,
    setCameraAccessError,
    resetPermissions,
    checkPermissionStatus,
    retryCount,
    isMobile
  };
};
