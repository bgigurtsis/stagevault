import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Video, 
  X, 
  Pause, 
  Play, 
  StopCircle, 
  Save,
  ArrowLeft,
  Upload,
  Check,
  Clock,
  AlertCircle,
  Camera,
  Bug,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { recordingService } from "@/services/recordingService";
import { googleDriveService } from "@/services/googleDriveService";
import { Performance, Rehearsal } from "@/types";
import "./Record.css";

export default function Record() {
  const [title, setTitle] = useState("");
  const [selectedPerformance, setSelectedPerformance] = useState("");
  const [selectedRehearsal, setSelectedRehearsal] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [availableRehearsals, setAvailableRehearsals] = useState<Rehearsal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'preparing' | 'uploading' | 'processing' | 'saving' | 'complete' | 'error'>('preparing');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [cameraAccessTimeout, setCameraAccessTimeout] = useState(10000);
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rehearsalIdParam = searchParams.get('rehearsalId');
  const { toast } = useToast();
  
  const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    console.log(logMessage, data);
    
    if (debugMode) {
      setDebugLogs(prev => [...prev, data ? `${logMessage}: ${JSON.stringify(data)}` : logMessage]);
      
      if (data) {
        setDebugInfo(prev => ({
          ...prev,
          [message]: data
        }));
      }
    }
  };
  
  const enumerateDevices = async () => {
    try {
      logDebug("Enumerating devices");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      logDebug("Available video devices", videoDevices);
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
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
  
  const startRecording = async () => {
    try {
      setCameraAccessError(null);
      setIsInitializingCamera(true);
      setDebugLogs([]);
      
      logDebug("Starting camera initialization");
      
      const timeoutPromise = new Promise<MediaStream>((_, reject) => {
        setTimeout(() => {
          logDebug("Camera access timeout reached", { timeout: cameraAccessTimeout });
          reject(new Error("Camera access timeout - please check your browser settings"));
        }, cameraAccessTimeout);
      });
      
      await enumerateDevices();
      
      const accessPromise = tryAccessCamera(1, selectedCameraId || undefined);
      
      const stream = await Promise.race([accessPromise, timeoutPromise]);
      
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      const trackInfo = {
        videoTrack: videoTrack ? {
          label: videoTrack.label,
          settings: videoTrack.getSettings(),
          constraints: videoTrack.getConstraints(),
          capabilities: videoTrack.getCapabilities ? videoTrack.getCapabilities() : 'Not supported'
        } : null,
        audioTrack: audioTrack ? {
          label: audioTrack.label,
          settings: audioTrack.getSettings(),
          constraints: audioTrack.getConstraints(),
          capabilities: audioTrack.getCapabilities ? audioTrack.getCapabilities() : 'Not supported'
        } : null
      };
      
      logDebug("Camera access granted successfully", trackInfo);
      setIsInitializingCamera(false);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          logDebug("Video metadata loaded");
          videoRef.current?.play().catch(err => {
            logDebug("Error playing video", err);
            setCameraAccessError("Error playing video stream. Please refresh and try again.");
          });
        };
      }
      
      chunksRef.current = [];
      
      const mimeType = getSupportedMimeType();
      logDebug("Using mime type", mimeType);
      
      const options: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          logDebug("Received data chunk", { size: e.data.size, timestamp: new Date().toISOString() });
        }
      };
      
      mediaRecorder.onstop = () => {
        logDebug("Media recorder stopped");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setVideoUrl(url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
      };
      
      mediaRecorder.start(1000);
      logDebug("Media recorder started");
      setIsRecording(true);
      setIsPaused(false);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setIsInitializingCamera(false);
      
      let errorMessage = "Failed to access camera and microphone.";
      
      if (error instanceof Error) {
        logDebug("Camera access error details", { 
          message: error.message, 
          name: error.name, 
          stack: error.stack 
        });
        
        if (error.name === "NotAllowedError" || error.message.includes("Permission denied")) {
          errorMessage = "Camera access denied. Please allow access in your browser settings and try again.";
        } else if (error.name === "NotFoundError" || error.message.includes("Requested device not found")) {
          errorMessage = "No camera detected. Please connect a camera and try again.";
        } else if (error.name === "NotReadableError" || error.message.includes("The device is in use")) {
          errorMessage = "Camera is in use by another application. Please close other apps using your camera.";
        } else if (error.name === "AbortError" || error.message.includes("Timeout")) {
          errorMessage = "Camera access timed out. Try increasing the timeout or check your browser settings.";
        } else if (error.name === "TypeError" || error.message.includes("constraint")) {
          errorMessage = "Your camera doesn't support the required quality settings. Try a different device.";
        } else if (error.name === "SecurityError" || error.message.includes("secure context")) {
          errorMessage = "Camera access requires a secure connection (HTTPS).";
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
      };
      
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
      
      mediaRecorder.start(1000);
      logDebug("Screen recorder started");
      setIsRecording(true);
      setIsPaused(false);
      
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
      const rehearsal = availableRehearsals.find(r => r.id === selectedRehearsal);
      if (!rehearsal) throw new Error("Rehearsal not found");
      
      const performance = performances.find(p => p.id === rehearsal.performanceId);
      if (!performance) throw new Error("Performance not found");
      
      const fileExtension = "webm";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.${fileExtension}`;
      
      setUploadPhase('uploading');
      
      logDebug("Uploading video to Google Drive", {
        rehearsalTitle: rehearsal.title,
        performanceTitle: performance.title,
        driveFolderId: rehearsal.drive_folder_id || "Not set"
      });
      
      const driveFile = await googleDriveService.uploadVideo(
        recordedBlob,
        fileName,
        performance.title,
        rehearsal.title,
        (progress) => {
          setUploadProgress(progress);
        },
        rehearsal.drive_folder_id
      );
      
      if (!driveFile) {
        throw new Error("Failed to upload video to Google Drive");
      }
      
      setUploadPhase('processing');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadPhase('saving');
      
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
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
          {isComplete ? <Check className="h-3 w-3" /> : icon}
        </div>
        <span>{phaseLabel}</span>
      </div>
    );
  };

  const DebugDialog = () => {
    const isMobile = window.innerWidth < 768;
    
    const DebugContent = () => (
      <div className="space-y-4 max-h-[70vh] overflow-auto">
        <div className="space-y-2">
          <h3 className="font-semibold">Camera Information</h3>
          {availableCameras.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm">Detected {availableCameras.length} camera(s):</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {availableCameras.map((camera, i) => (
                  <li key={i} className={selectedCameraId === camera.deviceId ? "font-semibold" : ""}>
                    {camera.label || `Camera ${i+1}`} 
                    {selectedCameraId === camera.deviceId && " (selected)"}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-yellow-600">No cameras detected</p>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Browser Information</h3>
          <div className="text-sm space-y-1">
            <p>Browser: {getBrowserName()}</p>
            <p>User Agent: {navigator.userAgent}</p>
            <p>Is Mobile: {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Yes' : 'No'}</p>
            <p>Secure Context: {window.isSecureContext ? 'Yes' : 'No'}</p>
            <p>MediaDevices API: {navigator.mediaDevices ? 'Available' : 'Not Available'}</p>
            <p>MediaRecorder API: {typeof MediaRecorder !== 'undefined' ? 'Available' : 'Not Available'}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Debug Settings</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="timeout">Camera access timeout (ms):</Label>
              <Input 
                id="timeout" 
                type="number" 
                value={cameraAccessTimeout} 
                onChange={(e) => setCameraAccessTimeout(Number(e.target.value))}
                className="w-24" 
                min={1000} 
                max={60000} 
                step={1000}
              />
            </div>
            
            <Button onClick={() => enumerateDevices()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh device list
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Debug Log</h3>
          <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-md h-40 overflow-y-auto text-xs font-mono">
            {debugLogs.length > 0 ? (
              debugLogs.map((log, i) => (
                <div key={i} className="pb-1">{log}</div>
              ))
            ) : (
              <p className="text-muted-foreground">No logs yet</p>
            )}
          </div>
        </div>
      </div>
    );
    
    if (isMobile) {
      return (
        <Drawer open={showDebugDialog} onOpenChange={setShowDebugDialog}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Camera Debug Information</DrawerTitle>
              <DrawerDescription>
                Technical details to help diagnose camera issues
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <DebugContent />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Camera Debug Information</DialogTitle>
            <DialogDescription>
              Technical details to help diagnose camera issues
            </DialogDescription>
          </DialogHeader>
          <DebugContent />
        </DialogContent>
      </Dialog>
    );
  };

  useEffect(() => {
    checkBrowserCompatibility();
    enumerateDevices();
    
    const fetchData = async () => {
      try {
        const performanceData = await performanceService.getPerformances();
        setPerformances(performanceData);
        
        if (!rehearsalIdParam) {
          const rehearsalData = await rehearsalService.getAllRehearsals();
          setAvailableRehearsals(rehearsalData);
        } else {
          const rehearsal = await rehearsalService.getRehearsalById(rehearsalIdParam);
          if (rehearsal) {
            setSelectedRehearsal(rehearsal.id);
            setSelectedPerformance(rehearsal.performanceId);
            const filteredRehearsals = await rehearsalService.getRehearsalsByPerformance(rehearsal.performanceId);
            setAvailableRehearsals(filteredRehearsals);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        logDebug("Error fetching data", error);
        toast({
          title: "Error",
          description: "Failed to load performances and rehearsals. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [rehearsalIdParam, toast]);
  
  useEffect(() => {
    const updateRehearsals = async () => {
      if (selectedPerformance) {
        try {
          const rehearsals = await rehearsalService.getRehearsalsByPerformance(selectedPerformance);
          setAvailableRehearsals(rehearsals);
          
          if (rehearsals.length > 0 && !selectedRehearsal) {
            setSelectedRehearsal(rehearsals[0].id);
          }
        } catch (error) {
          console.error("Error fetching rehearsals for performance:", error);
          logDebug("Error fetching rehearsals for performance", error);
          toast({
            title: "Error",
            description: "Failed to load rehearsals for this performance.",
            variant: "destructive",
          });
        }
      }
    };

    updateRehearsals();
  }, [selectedPerformance, selectedRehearsal, toast]);
  
  useEffect(() => {
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
  }, [videoUrl]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-destructive" />
            <span>Record Video</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setDebugMode(!debugMode);
              setShowDebugDialog(!debugMode);
            }}
            className="relative"
            title="Debug mode"
          >
            <Bug className="h-4 w-4" />
            {debugMode && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
            )}
          </Button>
          
          {recordedBlob && (
            <>
              <Button variant="outline" onClick={resetRecording} disabled={isUploading}>
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button 
                onClick={saveRecording} 
                disabled={isLoading || isUploading}
                className={uploadComplete ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {uploadComplete ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Recording
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {debugMode && <DebugDialog />}
      
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
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <UploadPhaseIndicator 
              currentPhase={uploadPhase} 
              phaseName="preparing" 
              phaseLabel="Prepare" 
              icon={<Clock className="h-3 w-3" />} 
            />
            <UploadPhaseIndicator 
              currentPhase={uploadPhase} 
              phaseName="uploading" 
              phaseLabel="Upload" 
              icon={<Upload className="h-3 w-3" />} 
            />
            <UploadPhaseIndicator 
              currentPhase={uploadPhase} 
              phaseName="processing" 
              phaseLabel="Process" 
              icon={<Video className="h-3 w-3" />} 
            />
            <UploadPhaseIndicator 
              currentPhase={uploadPhase} 
              phaseName="saving" 
              phaseLabel="Save" 
              icon={<Save className="h-3 w-3" />} 
            />
          </div>
          
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
                  Retry Upload ({retryCount}/3)
                </Button>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            {uploadPhase === 'complete' ? 
              "Upload complete! Redirecting to rehearsal page..." : 
              uploadPhase === 'error' ?
              "There was an error uploading your video. Please try again." :
              "Please do not close this page while the video is uploading."}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-muted rounded-lg overflow-hidden relative aspect-video">
            {!isRecording && !recordedBlob && !cameraAccessError && !isInitializingCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground font-medium">
                  Ready to record your performance
                </p>
                <p className="text-sm text-muted-foreground">
                  Press the record button below to start
                </p>
                
                {availableCameras.length > 0 && (
                  <div className="mt-4">
                    <Select
                      value={selectedCameraId}
                      onValueChange={setSelectedCameraId}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCameras.map((camera) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                  {debugMode && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Timeout: {cameraAccessTimeout/1000}s | 
                      Selected camera: {selectedCameraId ? selectedCameraId.substring(0, 8) + '...' : 'default'}
                    </p>
                  )}
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
                        <Button variant="outline" size="sm" onClick={() => {
                          setCameraAccessTimeout(cameraAccessTimeout + 5000);
                          setCameraAccessError(null);
                        }}>
                          Increase Timeout (+5s)
                        </Button>
                        <Button variant="outline" size="sm" onClick={attemptScreenshareWithCamera}>
                          Try Screen Share
                        </Button>
                        {debugMode && (
                          <Button variant="outline" size="sm" onClick={() => setShowDebugDialog(true)}>
                            <Bug className="h-3 w-3 mr-1" /> Debug Info
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 w-full">
                          Make sure your camera is connected and you've allowed browser permissions
                        </p>
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
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                <span>{formatTime(recordingTime)}</span>
                {usingFallbackMode && <Badge variant="outline" className="ml-1 text-xs">Fallback Mode</Badge>}
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
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
            ) : null}
          </div>
          
          {recordedBlob && !isUploading && (
            <div className="bg-muted/40 border rounded p-3 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Recording length: {formatTime(recordingTime)}</span>
              <Badge variant="outline" className="ml-auto">{Math.round(recordedBlob.size / 1024 / 1024 * 10) / 10} MB</Badge>
              {usingFallbackMode && (
                <Badge variant="secondary">Fallback mode used</Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Recording Title *</Label>
            <Input
              id="title"
              placeholder="Enter a title for this recording"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="performance">Performance</Label>
            <Select
              value={selectedPerformance}
              onValueChange={setSelectedPerformance}
              disabled={!!rehearsalIdParam || isUploading}
            >
              <SelectTrigger id="performance">
                <SelectValue placeholder="Select a performance" />
              </SelectTrigger>
              <SelectContent>
                {performances.map((performance) => (
                  <SelectItem key={performance.id} value={performance.id}>
                    {performance.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rehearsal">Rehearsal *</Label>
            <Select
              value={selectedRehearsal}
              onValueChange={setSelectedRehearsal}
              disabled={!!rehearsalIdParam || isUploading}
            >
              <SelectTrigger id="rehearsal">
                <SelectValue placeholder="Select a rehearsal" />
              </SelectTrigger>
              <SelectContent>
                {availableRehearsals.map((rehearsal) => (
                  <SelectItem key={rehearsal.id} value={rehearsal.id}>
                    {rehearsal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this recording"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Add tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              E.g., solo, group, needs work
            </p>
          </div>
          
          {recordedBlob && !isUploading && (
            <div className="mt-4">
              <Button 
                onClick={saveRecording} 
                className="w-full" 
                disabled={isLoading || !title || !selectedRehearsal}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload to Google Drive
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Your video will be securely stored in your Google Drive account
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
