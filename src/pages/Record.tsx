
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Video, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import MobileSwipeGesture from "@/components/MobileSwipeGesture";
import "./Record.css";

export default function Record() {
  // UI state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const isMobile = useIsMobile();
  const location = useLocation();
  
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
    },
    enableDebugLogging: true
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
    uploadPhase,
    uploadComplete,
    uploadError,
    retryCount,
    saveRecording,
    handleRetry
  } = useUpload({ recordingTime });
  
  // Toggle form visibility function
  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };
  
  // Handle cancel recording
  const handleCancelRecording = () => {
    stopCamera(); // Make sure to release camera resources
    resetRecording(); // Reset recording state
    setCameraInitialized(false); // Reset initialization state
    navigate(-1); // Go back to previous page
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
  
  // Initialize camera and check browser compatibility (with retry limit)
  useEffect(() => {
    let initTimer: number | null = null;
    let maxRetries = 3;
    
    // Only initialize camera when we're on the recording page
    if (location.pathname === '/record' && !cameraInitialized && retryAttempts < maxRetries) {
      console.log(`Camera initialization attempt ${retryAttempts + 1} of ${maxRetries}`);
      
      checkBrowserCompatibility();
      
      // Use a longer timeout to allow the component to fully mount
      initTimer = window.setTimeout(() => {
        startCamera();
        checkPermissionStatus();
        setCameraInitialized(true);
      }, 1000);
      
      // Force fullscreen mode on mobile
      if (isMobile) {
        const rootElement = document.documentElement;
        rootElement.style.height = '100vh';
        rootElement.style.overflow = 'hidden';
      }
    }
    
    // Cleanup function to ensure resources are properly released
    return () => {
      if (initTimer) {
        window.clearTimeout(initTimer);
      }
      
      // Stop camera when component unmounts or route changes
      if (location.pathname !== '/record') {
        stopCamera();
        setCameraInitialized(false);
      }
      
      if (isMobile) {
        const rootElement = document.documentElement;
        rootElement.style.height = '';
        rootElement.style.overflow = '';
      }
    };
  }, [isMobile, startCamera, checkPermissionStatus, stopCamera, location.pathname, cameraInitialized, retryAttempts]);
  
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

  // Handle retry camera access with tracking to prevent infinite loops
  const handleRetryCamera = () => {
    // Ensure previous camera resources are released
    stopCamera();
    
    // Wait a moment before retrying
    setTimeout(() => {
      setCameraAccessError(null);
      setRetryAttempts(prev => prev + 1);
      setCameraInitialized(false);
      startCamera();
    }, 1000);
  };
  
  // Handle "go back" navigation
  const handleGoBack = () => {
    stopCamera(); // Make sure to release camera resources
    setCameraInitialized(false); // Reset initialization state
    navigate(-1);
  };
  
  // Emergency force reset - uses for severe cases 
  const handleEmergencyReset = () => {
    stopCamera();
    resetRecording();
    setCameraInitialized(false);
    setRetryAttempts(0);
    setCameraAccessError(null);
    toast({
      title: "Camera reset",
      description: "Camera has been reset. Please try again.",
    });
    // Force reload the page as last resort
    setTimeout(() => window.location.href = '/record', 500);
  };
  
  // When recording is complete, show the form in partial state instead of full
  useEffect(() => {
    if (recordedBlob) {
      setIsFormVisible(true);
    }
  }, [recordedBlob]);

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
            {currentPerformance.title}
          </Badge>
        </div>
      )}
      
      <div className="camera-preview-container">
        <MobileSwipeGesture
          onSwipeUp={() => !isRecording && recordedBlob && setIsFormVisible(true)}
          onSwipeDown={() => !isRecording && recordedBlob && setIsFormVisible(false)}
          className="camera-view"
        >
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
        </MobileSwipeGesture>
        
        {!isFormVisible && (
          <div className="control-bar">
            {!isRecording && !recordedBlob && streamRef.current && (
              <div className="camera-controls">
                <CameraControls 
                  onSwitchCamera={switchCamera}
                  onToggleFlash={toggleFlash}
                  flashEnabled={flashEnabled}
                  stream={streamRef.current}
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
                  stream={streamRef.current}
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
        <form id="recording-form" className="space-y-4">
          <RecordingForm 
            isVisible={isFormVisible}
            recordingTime={recordingTime} 
            onSaveRecording={handleSaveRecording}
            isUploading={isUploading}
            uploadComplete={uploadComplete}
            isMobile={isMobile}
            onToggleVisibility={() => setIsFormVisible(!isFormVisible)}
            onCancel={handleCancelRecording}
            rehearsalId={rehearsalIdParam || undefined}
            performanceId={performanceIdParam || currentPerformance?.id || undefined}
          />
        </form>
      )}
      
      {/* Emergency reset button only shown if multiple retry attempts failed */}
      {retryAttempts >= 2 && cameraAccessError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleEmergencyReset}
            className="text-xs"
          >
            Emergency Reset
          </Button>
        </div>
      )}
    </div>
  );
}
