
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Video, 
  X, 
  Pause, 
  Play, 
  StopCircle, 
  ArrowLeft,
  Clock,
  AlertCircle,
  Camera,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Zap,
  FlipHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { recordingService } from "@/services/recordingService";
import { googleDriveService } from "@/services/googleDriveService";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { Performance } from "@/types";
import { RecordingForm } from "@/components/recording/RecordingForm";
import "./Record.css";

export default function Record() {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // UI state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Camera state
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  
  // Performance context
  const [currentPerformance, setCurrentPerformance] = useState<Performance | null>(null);
  
  // Upload state
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'preparing' | 'uploading' | 'processing' | 'saving' | 'complete' | 'error'>('preparing');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rehearsalIdParam = searchParams.get('rehearsalId');
  const performanceIdParam = searchParams.get('performanceId');
  const { toast } = useToast();
  
  // Detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (isRecording && window.matchMedia("(orientation: landscape)").matches) {
        // Try to enter fullscreen when recording in landscape
        requestFullscreen();
      }
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isRecording]);
  
  // Load performance context
  useEffect(() => {
    const loadPerformanceContext = async () => {
      try {
        if (performanceIdParam) {
          const performance = await performanceService.getPerformanceById(performanceIdParam);
          setCurrentPerformance(performance);
        } else if (rehearsalIdParam) {
          const rehearsal = await rehearsalService.getRehearsalById(rehearsalIdParam);
          if (rehearsal.performanceId) {
            const performance = await performanceService.getPerformanceById(rehearsal.performanceId);
            setCurrentPerformance(performance);
          }
        } else {
          // Load most recent performance if no context
          const performances = await performanceService.getPerformances();
          if (performances.length > 0) {
            setCurrentPerformance(performances[0]);
          }
        }
      } catch (error) {
        console.error("Error loading performance context:", error);
      }
    };
    
    loadPerformanceContext();
  }, [performanceIdParam, rehearsalIdParam]);
  
  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Function to request fullscreen
  const requestFullscreen = () => {
    if (containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };
  
  // Function to exit fullscreen
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.log(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };
  
  // Toggle form visibility (for after recording)
  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };
  
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    console.log(logMessage, data);
  };
  
  // Camera access functions
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
  
  const checkBrowserCompatibility = () => {
    const compatibility = {
      userMediaSupported: !!navigator.mediaDevices?.getUserMedia,
      mediaRecorderSupported: typeof MediaRecorder !== 'undefined',
      enumerateDevicesSupported: !!navigator.mediaDevices?.enumerateDevices,
      screenshareSupported: !!navigator.mediaDevices?.getDisplayMedia,
      browserName: getBrowserName(),
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      secureContext: window.isSecureContext
    };
    
    logDebug("Browser compatibility", compatibility);
    
    if (!compatibility.userMediaSupported || !compatibility.mediaRecorderSupported) {
      setCameraAccessError("Your browser doesn't support media recording. Please try a modern browser like Chrome, Firefox, or Edge.");
    }
    
    if (!compatibility.secureContext) {
      setCameraAccessError("Camera access requires a secure connection (HTTPS). Please ensure you're using a secure connection.");
    }
    
    return compatibility;
  };
  
  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    let browserName;
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
      browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
      browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
      browserName = "Edge";
    } else {
      browserName = "Unknown";
    }
    
    return browserName;
  };
  
  const switchCamera = async () => {
    if (isRecording) return;
    
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
      
      // Use advanced constraints with the torch property only if supported
      await videoTrack.applyConstraints({
        advanced: [{ 
          // Add the torch property only if it's supported
          ...(('torch' in capabilities) && { torch: newFlashState })
        }]
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
      
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      
      chunksRef.current = [];
      
      const mimeType = getSupportedMimeType();
      
      const options: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      };
      
      const mediaRecorder = new MediaRecorder(displayStream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setVideoUrl(url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
        
        setIsFormVisible(true);
      };
      
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
      
      mediaRecorder.start(1000);
      logDebug("Screen recorder started");
      setIsRecording(true);
      setIsPaused(false);
      
      if (isMobile) {
        requestFullscreen();
      }
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Screen sharing mode",
        description: "Recording your screen instead of camera. Click Stop when finished.",
      });
      
    } catch (error) {
      logDebug("Screenshare fallback failed", error);
      setIsInitializingCamera(false);
      setCameraAccessError("Both camera access and screen sharing failed. Please check your browser settings.");
      
      toast({
        title: "Recording failed",
        description: "Unable to access camera or screen. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        logDebug(`Mime type supported: ${type}`);
        return type;
      }
    }
    
    logDebug(`No specific mime type supported, using fallback`);
    return 'video/webm'; // fallback
  };
  
  const startRecording = () => {
    if (isRecording || !streamRef.current) return;
    
    try {
      chunksRef.current = [];
      
      const mimeType = getSupportedMimeType();
      
      const options: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      };
      
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setVideoUrl(url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
        
        setIsFormVisible(true);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      
      if (isMobile) {
        requestFullscreen();
      }
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Unable to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  const resetRecording = () => {
    stopRecording();
    setRecordingTime(0);
    setRecordedBlob(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadComplete(false);
    setCameraAccessError(null);
    setIsFormVisible(false);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
      videoRef.current.controls = false;
    }
  };
  
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setUploadProgress(0);
      setUploadPhase('preparing');
      setUploadError(null);
      saveRecording();
    } else {
      toast({
        title: "Upload failed",
        description: "Maximum retry attempts reached. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const saveRecording = async () => {
    const formElement = document.getElementById("recording-form") as HTMLFormElement;
    if (!formElement) {
      toast({
        title: "Form error",
        description: "Could not access the form data. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(formElement);
    const title = formData.get("title") as string;
    const selectedRehearsal = formData.get("rehearsal") as string;
    const notes = formData.get("notes") as string;
    const tags = formData.get("tags") as string;
    
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a title for your recording.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedRehearsal) {
      toast({
        title: "Rehearsal required",
        description: "Please select a rehearsal for this recording.",
        variant: "destructive",
      });
      return;
    }
    
    if (!recordedBlob) {
      toast({
        title: "No recording",
        description: "Please record a video before saving.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setIsUploading(true);
    setUploadPhase('preparing');
    setUploadError(null);
    
    try {
      const fileExtension = "webm";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.${fileExtension}`;
      
      setUploadPhase('uploading');
      
      logDebug("Uploading video to Google Drive");
      
      const driveFile = await googleDriveService.uploadVideo(
        recordedBlob,
        fileName,
        "Performance", // Will be updated with the actual performance title when saving to the database
        "Rehearsal",   // Will be updated with the actual rehearsal title when saving to the database
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (!driveFile) {
        throw new Error("Failed to upload video to Google Drive");
      }
      
      setUploadPhase('processing');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadPhase('saving');
      
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
      
      await recordingService.createRecording({
        rehearsalId: selectedRehearsal,
        title: title,
        notes: notes || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        duration: recordingTime,
        videoUrl: driveFile.webViewLink,
        thumbnailUrl: driveFile.thumbnailLink,
        googleFileId: driveFile.id
      });
      
      setUploadPhase('complete');
      setUploadComplete(true);
      
      toast({
        title: "Recording saved",
        description: "Your recording has been successfully uploaded to Google Drive and saved.",
      });
      
      navigate(`/rehearsals/${selectedRehearsal}`);
      
    } catch (error) {
      console.error("Error saving recording:", error);
      setUploadPhase('error');
      setIsUploading(false);
      setUploadError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Upload error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const UploadPhaseIndicator = ({ 
    currentPhase, 
    phaseName,
    phaseLabel,
    icon
  }: { 
    currentPhase: string; 
    phaseName: 'preparing' | 'uploading' | 'processing' | 'saving' | 'complete' | 'error';
    phaseLabel: string;
    icon: React.ReactNode;
  }) => {
    const isActive = currentPhase === phaseName;
    const isComplete = (
      (phaseName === 'preparing' && ['uploading', 'processing', 'saving', 'complete'].includes(currentPhase)) ||
      (phaseName === 'uploading' && ['processing', 'saving', 'complete'].includes(currentPhase)) ||
      (phaseName === 'processing' && ['saving', 'complete'].includes(currentPhase)) ||
      (phaseName === 'saving' && ['complete'].includes(currentPhase)) ||
      (phaseName === 'complete' && currentPhase === 'complete')
    );
    
    return (
      <div className="upload-phase">
        <div className={`upload-phase-indicator ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
          {icon}
        </div>
        <span>{phaseLabel}</span>
      </div>
    );
  };

  useEffect(() => {
    checkBrowserCompatibility();
    enumerateDevices();
    
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div 
      className={`container py-6 ${isRecording ? 'max-w-full px-0' : 'max-w-6xl px-4'}`}
      ref={containerRef}
    >
      {!isRecording && !recordedBlob && (
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-destructive" />
            <span>Record Video</span>
          </h1>
        </div>
      )}
      
      {currentPerformance && !isRecording && !recordedBlob && (
        <div className="mb-6">
          <Badge variant="outline" className="text-sm">
            For: {currentPerformance.title}
          </Badge>
        </div>
      )}
      
      <div className="relative">
        <div 
          className={`${isRecording || !recordedBlob ? 'aspect-video' : 'aspect-video lg:aspect-video'} 
                     bg-muted rounded-lg overflow-hidden relative`}
        >
          {!isRecording && !recordedBlob && !cameraAccessError && !isInitializingCamera && !streamRef.current && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Video className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">
                Ready to record your performance
              </p>
              <p className="text-sm text-muted-foreground">
                Press the record button below to start
              </p>
            </div>
          )}
          
          {isInitializingCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <Camera className="h-12 w-12 text-primary mb-2" />
                <p className="text-primary font-medium">
                  Initializing camera...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please allow camera access when prompted
                </p>
              </div>
            </div>
          )}
          
          {cameraAccessError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Camera Access Error</h3>
                    <p className="text-red-700 mt-1 text-sm">{cameraAccessError}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCameraAccessError(null)}>
                        Try Again
                      </Button>
                      <Button variant="outline" size="sm" onClick={attemptScreenshareWithCamera}>
                        Try Screen Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isRecording} // Mute only during recording to prevent feedback
            className="w-full h-full object-cover"
          />
          
          {isRecording && (
            <div className="absolute top-4 left-0 right-0 flex justify-center items-center">
              <div className="bg-black/50 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="font-mono">{formatTime(recordingTime)}</span>
              </div>
            </div>
          )}
          
          {!isRecording && !recordedBlob && streamRef.current && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button 
                variant="secondary" 
                size="icon"
                className="bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
                onClick={switchCamera}
              >
                <FlipHorizontal className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon"
                className={`${flashEnabled ? 'bg-yellow-500/70 hover:bg-yellow-500/90' : 'bg-black/30 hover:bg-black/50'} text-white rounded-full h-10 w-10`}
                onClick={toggleFlash}
              >
                <Zap className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center my-6">
        {!isRecording && !recordedBlob ? (
          <button 
            onClick={startRecording} 
            className="record-btn"
            aria-label="Start recording"
            disabled={isInitializingCamera}
          >
            <div className="record-btn-inner" />
          </button>
        ) : isRecording ? (
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              onClick={pauseRecording}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? (
                <Play className="h-6 w-6" />
              ) : (
                <Pause className="h-6 w-6" />
              )}
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-14 w-14 rounded-full"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <StopCircle className="h-8 w-8" />
            </Button>
          </div>
        ) : recordedBlob ? (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={resetRecording}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Record Again
            </Button>
          </div>
        ) : null}
      </div>
      
      {recordedBlob && !isUploading && (
        <div className="bg-muted/40 border rounded p-3 text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Recording length: {formatTime(recordingTime)}</span>
          <Badge variant="outline" className="ml-auto">{Math.round(recordedBlob.size / 1024 / 1024 * 10) / 10} MB</Badge>
        </div>
      )}
      
      {isUploading && (
        <div className="bg-background border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {uploadPhase === 'preparing' && 'Preparing upload...'}
              {uploadPhase === 'uploading' && 'Uploading to Google Drive...'}
              {uploadPhase === 'processing' && 'Processing video...'}
              {uploadPhase === 'saving' && 'Saving recording details...'}
              {uploadPhase === 'complete' && 'Upload complete!'}
              {uploadPhase === 'error' && 'Upload failed'}
            </span>
            <span className="text-sm text-muted-foreground">
              {uploadPhase === 'uploading' ? `${Math.round(uploadProgress)}%` : ''}
            </span>
          </div>
          
          <Progress 
            value={uploadPhase === 'uploading' ? uploadProgress : 
                  uploadPhase === 'preparing' ? 10 : 
                  uploadPhase === 'processing' ? 80 : 
                  uploadPhase === 'saving' ? 95 : 
                  uploadPhase === 'complete' ? 100 : 0} 
            className="h-2" 
          />
          
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Upload failed</p>
                <p className="text-red-700">{uploadError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={handleRetry}
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Upload ({retryCount}/3)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {recordedBlob && (
        <div className="mt-6">
          <form id="recording-form" className="space-y-4">
            <RecordingForm 
              isVisible={true}
              recordingTime={recordingTime} 
              onSaveRecording={saveRecording}
              isUploading={isUploading}
              uploadComplete={uploadComplete}
              isMobile={isMobile}
              onToggleVisibility={toggleFormVisibility}
              rehearsalId={rehearsalIdParam || undefined}
              performanceId={performanceIdParam || currentPerformance?.id || undefined}
            />
          </form>
        </div>
      )}
    </div>
  );
}
