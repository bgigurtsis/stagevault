
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Video, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { Performance } from "@/types";
import { RecordingForm } from "@/components/recording/RecordingForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCamera } from "@/hooks/useCamera";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { useUpload } from "@/hooks/useUpload";
import { checkBrowserCompatibility } from "@/utils/cameraUtils";
import CameraInitializing from "@/components/recording/CameraInitializing";
import CameraError from "@/components/recording/CameraError";
import CameraControls from "@/components/recording/CameraControls";
import RecordingControls from "@/components/recording/RecordingControls";
import RecordingTimer from "@/components/recording/RecordingTimer";
import UploadProgress from "@/components/recording/UploadProgress";
import "./Record.css";

export default function Record() {
  // UI state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const isMobile = useIsMobile();
  
  // Performance context
  const [currentPerformance, setCurrentPerformance] = useState<Performance | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rehearsalIdParam = searchParams.get('rehearsalId');
  const performanceIdParam = searchParams.get('performanceId');
  const { toast } = useToast();
  
  // Custom hooks
  const {
    videoRef,
    streamRef,
    isInitializingCamera,
    cameraAccessError,
    flashEnabled,
    startCamera,
    switchCamera,
    toggleFlash,
    attemptScreenshareWithCamera,
    setCameraAccessError
  } = useCamera();
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    recordedBlob,
    videoUrl,
    containerRef,
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    requestFullscreen
  } = useMediaRecorder({
    onStopRecording: (blob, url) => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.controls = true;
      }
      setIsFormVisible(true);
    }
  });
  
  const {
    isLoading,
    isUploading,
    uploadProgress,
    uploadComplete,
    uploadPhase,
    uploadError,
    retryCount,
    saveRecording,
    handleRetry
  } = useUpload({ recordingTime });
  
  // Load performance context
  useEffect(() => {
    const loadPerformanceContext = async () => {
      try {
        if (performanceIdParam) {
          const performance = await performanceService.getPerformanceById(performanceIdParam);
          setCurrentPerformance(performance);
        } else if (rehearsalIdParam) {
          const rehearsal = await rehearsalService.getRehearsalById(rehearsalIdParam);
          if (rehearsal && rehearsal.performanceId) {
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
  }, [isRecording, requestFullscreen]);
  
  // Initialize camera and check browser compatibility
  useEffect(() => {
    checkBrowserCompatibility();
    startCamera();
  }, []);
  
  // Toggle form visibility (for after recording)
  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };
  
  // Handle recording start
  const handleStartRecording = () => {
    if (streamRef.current) {
      startRecording(streamRef.current);
      if (isMobile) {
        requestFullscreen();
      }
    } else {
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize or try refreshing the page.",
        variant: "destructive",
      });
    }
  };
  
  // Handle upload retry
  const handleUploadRetry = () => {
    const formElement = document.getElementById("recording-form") as HTMLFormElement;
    if (recordedBlob && formElement) {
      handleRetry(() => saveRecording(recordedBlob, formElement));
    }
  };
  
  // Handle form submission
  const handleSaveRecording = () => {
    const formElement = document.getElementById("recording-form") as HTMLFormElement;
    if (recordedBlob && formElement) {
      saveRecording(recordedBlob, formElement);
    }
  };
  
  return (
    <div 
      className={`record-container ${isRecording ? 'fullscreen-recording' : ''}`}
      ref={containerRef}
    >
      {!isRecording && !recordedBlob && (
        <div className="flex items-center gap-2 mb-4 px-4 pt-6">
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
        <div className="mb-4 px-4">
          <Badge variant="outline" className="text-sm">
            For: {currentPerformance.title}
          </Badge>
        </div>
      )}
      
      <div className={`camera-preview-container ${isRecording ? 'h-full' : ''}`}>
        <div 
          className={`${isRecording ? 'h-full' : 'aspect-video'} 
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
          
          {isInitializingCamera && <CameraInitializing />}
          
          {cameraAccessError && (
            <CameraError 
              errorMessage={cameraAccessError}
              onRetry={() => startCamera()}
              onScreenShare={attemptScreenshareWithCamera}
            />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isRecording} // Mute only during recording to prevent feedback
            className="w-full h-full object-cover"
          />
          
          {isRecording && (
            <RecordingTimer 
              recordingTime={recordingTime}
              isPaused={isPaused}
            />
          )}
          
          {!isRecording && !recordedBlob && streamRef.current && (
            <CameraControls 
              onSwitchCamera={switchCamera}
              onToggleFlash={toggleFlash}
              flashEnabled={flashEnabled}
            />
          )}
        </div>
      </div>
      
      <RecordingControls 
        isRecording={isRecording}
        isPaused={isPaused}
        recordedBlob={recordedBlob}
        recordingTime={recordingTime}
        onStartRecording={handleStartRecording}
        onPauseRecording={pauseRecording}
        onStopRecording={stopRecording}
        onResetRecording={resetRecording}
      />
      
      <UploadProgress 
        isUploading={isUploading}
        uploadPhase={uploadPhase}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        retryCount={retryCount}
        recordingTime={recordingTime}
        recordedBlob={recordedBlob}
        onRetry={handleUploadRetry}
      />
      
      {recordedBlob && (
        <div className="mt-6 px-4">
          <form id="recording-form" className="space-y-4">
            <RecordingForm 
              isVisible={true}
              recordingTime={recordingTime} 
              onSaveRecording={handleSaveRecording}
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
