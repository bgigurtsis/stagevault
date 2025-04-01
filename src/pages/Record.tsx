
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Video, ArrowLeft } from "lucide-react";
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
    isPermissionPermanentlyDenied,
    startCamera,
    switchCamera,
    toggleFlash,
    attemptScreenshareWithCamera,
    setCameraAccessError,
    resetPermissions,
    checkPermissionStatus,
    stopCamera
  } = useCamera({
    onCameraError: (error) => {
      console.log("Camera error handler called:", error);
    }
  });
  
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
  
  // Toggle form visibility function
  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };
  
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
  
  // Handle orientation changes and fullscreen behavior
  useEffect(() => {
    const handleOrientationChange = () => {
      if (isRecording && window.matchMedia("(orientation: landscape)").matches) {
        // Try to enter fullscreen when recording in landscape
        requestFullscreen();
      }
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Add class to body when recording to prevent scrolling
    if (isRecording) {
      document.body.classList.add('recording-active');
    } else {
      document.body.classList.remove('recording-active');
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.body.classList.remove('recording-active');
    };
  }, [isRecording, requestFullscreen]);
  
  // Initialize camera and check browser compatibility
  useEffect(() => {
    checkBrowserCompatibility();
    let initTimer: number;
    
    // Use a timeout to allow the component to fully mount
    initTimer = window.setTimeout(() => {
      startCamera();
      checkPermissionStatus();
    }, 500);
    
    // Force fullscreen mode on mobile
    if (isMobile) {
      const rootElement = document.documentElement;
      rootElement.style.height = '100vh';
      rootElement.style.overflow = 'hidden';
    }
    
    // Cleanup function to ensure resources are properly released
    return () => {
      if (initTimer) {
        window.clearTimeout(initTimer);
      }
      stopCamera();
      
      if (isMobile) {
        const rootElement = document.documentElement;
        rootElement.style.height = '';
        rootElement.style.overflow = '';
      }
    };
  }, [isMobile, startCamera, checkPermissionStatus, stopCamera]);
  
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

  // Handle retry camera access
  const handleRetryCamera = () => {
    setCameraAccessError(null);
    startCamera();
  };
  
  // Handle "go back" navigation
  const handleGoBack = () => {
    stopCamera(); // Make sure to release camera resources
    navigate(-1);
  };
  
  return (
    <div 
      className={`record-container ${isRecording || recordedBlob ? 'fullscreen-recording' : ''}`}
      ref={containerRef}
    >
      {!isRecording && !recordedBlob && (
        <div className="top-nav">
          <button 
            className="bg-black/30 text-white p-2 rounded-full"
            onClick={handleGoBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="ml-3 text-xl font-bold flex items-center gap-2 text-white">
            <Video className="h-5 w-5 text-red-500" />
            <span>Record Video</span>
          </h1>
        </div>
      )}
      
      {currentPerformance && !isRecording && !recordedBlob && (
        <div className="performance-badge">
          <Badge className="bg-primary/90 text-white px-3 py-1">
            For: {currentPerformance.title}
          </Badge>
        </div>
      )}
      
      <div className="camera-preview-container">
        <div className="camera-view">
          {!isRecording && !recordedBlob && !cameraAccessError && !isInitializingCamera && !streamRef.current && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Video className="h-12 w-12 text-white/50 mb-2" />
              <p className="text-white font-medium">
                Ready to record your performance
              </p>
              <p className="text-sm text-white/70">
                Press the record button below to start
              </p>
            </div>
          )}
          
          {isInitializingCamera && <CameraInitializing />}
          
          {cameraAccessError && (
            <CameraError 
              errorMessage={cameraAccessError}
              onRetry={handleRetryCamera}
              onScreenShare={attemptScreenshareWithCamera}
              onResetPermissions={resetPermissions}
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
        </div>
        
        {!isFormVisible && (
          <div className="control-bar">
            {!isRecording && !recordedBlob && streamRef.current && (
              <div className="camera-controls">
                <CameraControls 
                  onSwitchCamera={switchCamera}
                  onToggleFlash={toggleFlash}
                  flashEnabled={flashEnabled}
                />
                
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
              </div>
            )}
            
            {isRecording && (
              <div className="camera-controls">
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
                
                <CameraControls 
                  onSwitchCamera={switchCamera}
                  onToggleFlash={toggleFlash}
                  flashEnabled={flashEnabled}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
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
        <div className={`recording-form-container ${!isFormVisible ? 'hidden' : ''}`}>
          <div className="recording-form-handle" onClick={toggleFormVisibility}></div>
          <form id="recording-form" className="space-y-4">
            <RecordingForm 
              isVisible={isFormVisible}
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
