
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
  const [isStartingCamera, setIsStartingCamera] = useState(false);
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
  
  // New implementation using video-first strategy
  const acquireMediaStream = async (deviceId?: string): Promise<MediaStream> => {
    logDebug("Using video-first strategy for acquiring media stream", { deviceId });
    
    // Step 1: Try to get video-only stream first
    try {
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      }
      
      const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });
      
      logDebug("Video-only stream acquired successfully");
      
      // Step 2: Try to get audio-only stream and add it to the video stream
      try {
        logDebug("Attempting to add audio track to video stream");
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        
        const audioTrack = audioOnlyStream.getAudioTracks()[0];
        videoOnlyStream.addTrack(audioTrack);
        logDebug("Audio track added to video stream successfully");
        
        return videoOnlyStream;
      } catch (audioError) {
        logDebug("Failed to add audio track, continuing with video-only", audioError);
        // Continue with video-only if audio fails
        return videoOnlyStream;
      }
    } catch (videoError) {
      logDebug("Video-first strategy failed", videoError);
      
      // Fallback: Try the all-in-one approach
      try {
        logDebug("Falling back to combined audio+video request");
        const combinedConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        };
        
        if (deviceId) {
          (combinedConstraints.video as MediaTrackConstraints).deviceId = { exact: deviceId };
        }
        
        const combinedStream = await navigator.mediaDevices.getUserMedia(combinedConstraints);
        logDebug("Combined audio+video stream acquired successfully");
        return combinedStream;
      } catch (combinedError) {
        logDebug("Combined audio+video request failed", combinedError);
        
        // Last resort: Try emergency fallbacks
        const emergencyStream = await emergencyMediaFallback();
        if (emergencyStream) {
          logDebug("Emergency fallback stream acquired");
          return emergencyStream;
        }
        
        throw new Error("Failed to acquire any media stream");
      }
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
  
  const stopCamera = useCallback(() => {
    logDebug("Stopping camera");
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      logDebug(`Stopping ${tracks.length} tracks`);
      
      tracks.forEach(track => {
        logDebug(`Stopping track: ${track.kind}:${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (timeoutRef.current) {
      logDebug("Clearing previous timeout");
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setCameraAccessError(null);
    setIsInitializingCamera(false);
    setIsStartingCamera(false);
    
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
  
  const startCamera = useCallback(async (deviceId?: string) => {
    // Prevent concurrent initialization
    if (isStartingCamera) {
      logDebug("Camera initialization already in progress, ignoring request");
      return;
    }
    
    try {
      logDebug("Starting camera", { deviceId });
      setIsStartingCamera(true);
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      setUsingFallbackMode(false);
      
      if (timeoutRef.current) {
        logDebug("Clearing previous timeout");
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Ensure any existing stream is properly stopped
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
      
      // Small delay to ensure resources are released
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the new video-first strategy
      const stream = await acquireMediaStream(deviceId);
      
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
          errorMessage = "Camera is in use by another application. Please close other apps using your camera and try again.";
        } else if (error.name === "AbortError" || error.message.includes("Timeout")) {
          errorMessage = "Timeout starting video source. Please check your camera connection or try a different camera.";
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
    } finally {
      setIsStartingCamera(false);
    }
  }, [toast, options, checkPermissionStatus, isStartingCamera]);
  
  const switchCamera = useCallback(async () => {
    logDebug("Switching camera");
    
    // Ensure current stream is completely stopped
    stopCamera();
    
    // Wait a moment to allow resources to be released
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
  }, [selectedCameraId, startCamera, enumerateDevices, toast, stopCamera]);
  
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
  
  const attemptScreenshareWithCamera = useCallback(async () => {
    try {
      logDebug("Attempting screenshare fallback");
      
      // Ensure any existing stream is stopped
      stopCamera();
      
      // Wait for resources to be released
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      
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
  }, [toast, stopCamera]);
  
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
