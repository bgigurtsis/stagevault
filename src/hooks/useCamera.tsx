
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  checkBrowserCompatibility, 
  isCameraPermissionPersistentlyDenied,
  openBrowserPermissionSettings,
  isProbablyPermanentlyBlocked,
  handleCameraTimeout,
  getUserMediaWithTimeout,
  getScreenShareWithAudio,
  getMobileStreamWithTimeout,
  isLowPowerMode,
  getDeviceInfo,
  hasExceededRetryLimit,
  resetRetryCounter,
  clearSiteData
} from "@/utils/cameraUtils";

interface UseCameraOptions {
  onCameraError?: (error: string) => void;
  timeoutDuration?: number;
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  
  const { toast } = useToast();
  
  // Logging utility
  const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[CAMERA-HOOK] ${timestamp} - ${message}`;
    console.log(logMessage, data);
  };

  // Check permission status
  const checkPermissionStatus = async () => {
    try {
      logDebug("Checking camera permission status");
      // Check if the browser supports permissions API
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        logDebug(`Permission status: ${cameraPermission.state}`);
        setPermissionState(cameraPermission.state);
        
        // Update permanent denial status
        setIsPermissionPermanentlyDenied(cameraPermission.state === 'denied');
        
        // Listen for permission changes
        cameraPermission.addEventListener('change', () => {
          logDebug(`Permission state changed to: ${cameraPermission.state}`);
          setPermissionState(cameraPermission.state);
          setIsPermissionPermanentlyDenied(cameraPermission.state === 'denied');
          
          if (cameraPermission.state === 'granted') {
            logDebug("Permission granted, attempting to start camera");
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
    
    try {
      // Use the deviceId if provided, otherwise use progressive fallbacks
      let stream: MediaStream;
      
      if (deviceId) {
        const constraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        };
        
        logDebug("Using exact device ID constraints", constraints);
        stream = await getUserMediaWithTimeout(constraints, options?.timeoutDuration || 10000);
      } else {
        // Check if we're on a mobile device and use optimized constraints
        const deviceInfo = getDeviceInfo();
        if (deviceInfo.isMobile) {
          logDebug("Mobile device detected, using mobile-optimized stream");
          stream = await getMobileStreamWithTimeout();
        } else {
          // Use our handler with progressive fallbacks
          logDebug("Desktop device detected, using progressive fallbacks");
          stream = await handleCameraTimeout(attemptNumber);
        }
      }
      
      logDebug("Camera access successful, got stream:", stream.id);
      return stream;
    } catch (error) {
      logDebug(`Attempt #${attemptNumber} failed`, error);
      
      if (attemptNumber < 3) {
        logDebug(`Trying again with more permissive constraints (attempt ${attemptNumber + 1})`);
        return tryAccessCamera(attemptNumber + 1, deviceId);
      }
      
      throw error;
    }
  };
  
  const resetPermissions = useCallback(() => {
    logDebug("Resetting permissions");
    // We can only guide the user to reset permissions manually
    openBrowserPermissionSettings();
    
    // Also clear any site data related to permissions
    clearSiteData();
    
    toast({
      title: "Permission Reset Instructions",
      description: "Please check your browser settings to reset camera permissions, then refresh this page.",
      duration: 6000,
    });
  }, [toast]);
  
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      logDebug(`Starting camera ${deviceId ? `with device ID: ${deviceId}` : 'with default device'}`);
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      
      // Clear any existing timeouts
      if (timeoutRef.current) {
        logDebug("Clearing existing timeout");
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset fallback mode if we're explicitly starting camera
      setUsingFallbackMode(false);
      
      // Check permission status first
      const permissionState = await checkPermissionStatus();
      logDebug(`Current permission state: ${permissionState}`);
      
      // If permissions are already denied, show helpful message
      if (permissionState === 'denied') {
        logDebug("Permission permanently denied");
        setIsPermissionPermanentlyDenied(true);
        throw new Error("Camera access is permanently denied. Please update your browser settings.");
      }
      
      const stream = await tryAccessCamera(1, deviceId);
      
      setIsInitializingCamera(false);
      
      // Clean up any previous stream before assigning new one
      if (streamRef.current) {
        logDebug("Stopping previous stream");
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      streamRef.current = stream;
      
      // Reset retry counter on success
      retryCountRef.current = 0;
      resetRetryCounter('camera_init_retries');
      
      if (videoRef.current) {
        logDebug("Setting stream to video element");
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          logDebug("Video metadata loaded, attempting to play");
          videoRef.current?.play().catch(err => {
            logDebug("Error playing video stream", err);
            setCameraAccessError("Error playing video stream. Please refresh and try again.");
          });
        };
      } else {
        logDebug("Video element ref is null");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      logDebug("Camera access error", error);
      setIsInitializingCamera(false);
      
      let errorMessage = "Failed to access camera and microphone.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.name === "NotAllowedError") {
          logDebug("NotAllowedError detected");
          errorMessage = "Camera access denied. Please allow access in your browser settings and try again.";
          await checkPermissionStatus(); // Update permission state
          
          // Check if this is likely a permanent denial
          const isPermanent = await isCameraPermissionPersistentlyDenied();
          logDebug(`Is permission permanently denied: ${isPermanent}`);
          setIsPermissionPermanentlyDenied(isPermanent);
          
          if (isPermanent) {
            errorMessage = "Camera access is permanently denied by your browser. Please update your settings to allow access.";
          }
        } else if (error.name === "NotFoundError") {
          logDebug("NotFoundError detected");
          errorMessage = "No camera detected. Please connect a camera and try again.";
        } else if (error.name === "NotReadableError") {
          logDebug("NotReadableError detected");
          errorMessage = "Camera is in use by another application. Please close other apps using your camera.";
        } else if (error.message.includes("Timeout")) {
          logDebug("Timeout error detected");
          errorMessage = "Timeout starting video source. Please try again or use a different camera.";
        }
      }
      
      setCameraAccessError(errorMessage);
      if (options?.onCameraError) {
        logDebug("Calling onCameraError callback");
        options.onCameraError(errorMessage);
      }
      
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Increment retry counter
      retryCountRef.current += 1;
    }
  }, [toast, options, checkPermissionStatus]);
  
  const switchCamera = useCallback(async () => {
    logDebug("Switching camera");
    // Stop existing camera stream
    if (streamRef.current) {
      logDebug("Stopping current stream");
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Update camera selection to next available camera
    const cameras = await enumerateDevices();
    if (cameras.length <= 1) {
      logDebug("Only one camera available, cannot switch");
      return;
    }
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    
    logDebug(`Switching from camera index ${currentIndex} to ${nextIndex}`);
    setSelectedCameraId(nextCamera.deviceId);
    startCamera(nextCamera.deviceId);
  }, [selectedCameraId, startCamera]);
  
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) {
      logDebug("No stream available for flash toggle");
      return;
    }
    
    try {
      logDebug("Attempting to toggle flash");
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        logDebug("No video track available");
        return;
      }
      
      const capabilities = videoTrack.getCapabilities();
      // Check if the torch capability exists before accessing it
      if (!capabilities || typeof capabilities === 'undefined' || !('torch' in capabilities)) {
        logDebug("Torch not supported in this device");
        toast({
          title: "Flash not supported",
          description: "Your camera does not support flash/torch mode",
          variant: "destructive",
        });
        return;
      }
      
      const newFlashState = !flashEnabled;
      logDebug(`Setting flash to: ${newFlashState}`);
      
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
      logDebug("Flash toggle error", error);
      toast({
        title: "Flash control failed",
        description: "Unable to control flash. Your device may not support this feature.",
        variant: "destructive",
      });
    }
  }, [flashEnabled, toast]);
  
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      logDebug("Stopping camera stream");
      streamRef.current.getTracks().forEach(track => {
        logDebug(`Stopping track: ${track.kind}/${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);
  
  const attemptScreenshareWithCamera = useCallback(async () => {
    try {
      logDebug("Attempting screenshare with camera fallback");
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      
      // Try to get display media with improved method
      logDebug("Using enhanced screen sharing method");
      const displayStream = await getScreenShareWithAudio();
      
      logDebug("Screen sharing initialized successfully");
      setUsingFallbackMode(true);
      setIsInitializingCamera(false);
      
      // Clean up any previous stream
      if (streamRef.current) {
        logDebug("Stopping previous stream before setting screen share");
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      streamRef.current = displayStream;
      
      // Add listener for when user ends screen sharing
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        logDebug("Screen sharing stopped by user");
        setUsingFallbackMode(false);
        // Don't automatically restart camera - this can be confusing
        setCameraAccessError("Screen sharing ended. Click 'Try Again' to use camera.");
      });
      
      if (videoRef.current) {
        logDebug("Setting screen share stream to video element");
        videoRef.current.srcObject = displayStream;
        videoRef.current.onloadedmetadata = () => {
          logDebug("Screen share video metadata loaded, attempting to play");
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
  
  // Clean up on unmount
  useEffect(() => {
    logDebug("useCamera hook initialized");
    const compatibility = checkBrowserCompatibility();
    logDebug("Browser compatibility check completed", compatibility);
    
    return () => {
      logDebug("useCamera hook cleanup");
      stopCamera();
      // Clear any pending timeouts
      if (timeoutRef.current) {
        logDebug("Clearing timeout during cleanup");
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
    checkPermissionStatus
  };
};
