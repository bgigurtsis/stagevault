import { v4 as uuidv4 } from 'uuid';

/**
 * Camera utilities for handling video recording and camera access
 */

// Format time (mm:ss) for display in recording UI
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Get supported video mime type for recording
export const getSupportedMimeType = (): string => {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
    'video/webm',
    'video/mp4'
  ];

  for (const mimeType of possibleTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log(`Using mime type: ${mimeType}`);
      return mimeType;
    }
  }

  console.log('No supported mime type found, using default video/webm');
  return 'video/webm';
};

// Check which camera controls are supported
export const getCameraControlsSupport = async (stream: MediaStream): Promise<{
  flashSupported: boolean;
  zoomSupported: boolean;
}> => {
  if (!stream) {
    return { flashSupported: false, zoomSupported: false };
  }

  try {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      return { flashSupported: false, zoomSupported: false };
    }

    const capabilities = videoTrack.getCapabilities();
    const flashSupported = capabilities && 'torch' in capabilities;
    const zoomSupported = capabilities && 'zoom' in capabilities;

    return { flashSupported, zoomSupported };
  } catch (error) {
    console.error('Error checking camera capabilities:', error);
    return { flashSupported: false, zoomSupported: false };
  }
};

/**
 * Check if the browser supports the necessary APIs for camera access
 */
export const checkBrowserCompatibility = (): boolean => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia is not supported in this browser');
    alert('Your browser does not support the necessary features for camera access. Please try a modern browser like Chrome, Firefox, or Safari.');
    return false;
  }
  return true;
};

/**
 * Check if camera permission is persistently denied
 */
export const isCameraPermissionPersistentlyDenied = async (): Promise<boolean> => {
  if (navigator.permissions) {
    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permissionStatus.state === 'denied';
  }
  return false;
};

/**
 * Open browser permission settings (if possible)
 */
export const openBrowserPermissionSettings = (): void => {
  if (navigator.permissions && (navigator.userAgent.indexOf("Firefox") > -1)) {
    // Firefox specific implementation
    console.log("Attempting to open Firefox permissions settings");
    
    // This is a placeholder - Firefox does not expose a direct way to open permission settings
    alert("Unfortunately, Firefox does not allow direct navigation to permission settings. Please manually check your browser settings.");
  } else if (navigator.userAgent.indexOf("Chrome") > -1) {
    // Chrome specific implementation
    console.log("Attempting to open Chrome settings");
    window.open("chrome://settings/content/camera", "_blank");
  } else {
    // Generic instructions for other browsers
    console.log("Providing generic instructions for other browsers");
    alert("Please manually check your browser settings to enable camera permissions.");
  }
};

/**
 * Check if camera is probably permanently blocked (more aggressive check)
 */
export const isProbablyPermanentlyBlocked = async (): Promise<boolean> => {
  if (navigator.permissions) {
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state === 'denied';
  }
  return false;
};

/**
 * Handle camera initialization timeout
 */
export const handleCameraTimeout = (reject: (reason?: any) => void): number => {
  return window.setTimeout(() => {
    reject(new Error('Timeout starting video source. Please try again.'));
  }, 15000);
};

/**
 * Get user media with a timeout
 */
export const getUserMediaWithTimeout = (constraints: MediaStreamConstraints, timeout: number): Promise<MediaStream> => {
  return new Promise((resolve, reject) => {
    let timer: number | null = handleCameraTimeout(reject);
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (timer) clearTimeout(timer);
        resolve(stream);
      })
      .catch(error => {
        if (timer) clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Get mobile stream with optimized constraints and timeout
 */
export const getMobileStreamWithTimeout = (): Promise<MediaStream> => {
  const mobileConstraints: MediaStreamConstraints = {
    audio: true,
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };
  
  return getUserMediaWithTimeout(mobileConstraints, 10000);
};

/**
 * Directly attempt to get a video-only stream as our primary strategy
 */
export const getVideoOnlyStream = async (): Promise<MediaStream> => {
  console.log('[CAMERA-DEBUG] Using video-only strategy as primary method');
  try {
    const videoOnlyConstraints = {
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    };
    
    return await navigator.mediaDevices.getUserMedia(videoOnlyConstraints);
  } catch (error) {
    console.error('[CAMERA-DEBUG] Video-only strategy failed:', error);
    throw error;
  }
};

/**
 * Try media with enhanced fallback strategies
 */
export const tryMediaWithFallback = async (): Promise<{ stream: MediaStream, isFallback: boolean }> => {
  try {
    // Strategy 1: Attempt to get media with audio and video
    console.log('[CAMERA-DEBUG] Attempting strategy 1: Audio and video');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });
    console.log('[CAMERA-DEBUG] Strategy 1 successful');
    return { stream, isFallback: false };
  } catch (error) {
    console.error('[CAMERA-DEBUG] Strategy 1 failed:', error);
    
    try {
      // Strategy 2: Attempt to get video-only stream
      console.log('[CAMERA-DEBUG] Attempting strategy 2: Video only');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      console.log('[CAMERA-DEBUG] Strategy 2 successful');
      return { stream, isFallback: true };
    } catch (videoError) {
      console.error('[CAMERA-DEBUG] Strategy 2 failed:', videoError);
      
      try {
        // Strategy 3: Attempt to get audio-only stream (less likely but worth trying)
        console.log('[CAMERA-DEBUG] Attempting strategy 3: Audio only');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        console.log('[CAMERA-DEBUG] Strategy 3 successful');
        
        // Create a silent video track to go along with the audio
        const silentVideoTrack = createSilentVideoStream(640, 480);
        stream.addTrack(silentVideoTrack);
        
        return { stream, isFallback: true };
      } catch (audioError) {
        console.error('[CAMERA-DEBUG] Strategy 3 failed:', audioError);
        throw new Error('All media strategies failed.');
      }
    }
  }
};

/**
 * Create a silent video stream (used as a fallback)
 */
const createSilentVideoStream = (width: number, height: number): MediaStreamTrack => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
  }
  
  const stream = canvas.captureStream();
  const track = stream.getVideoTracks()[0];
  return track;
};

/**
 * Get screen share with audio (if possible)
 */
export const getScreenShareWithAudio = async (): Promise<MediaStream> => {
  try {
    // Attempt to get display media with system audio
    console.log('[CAMERA-DEBUG] Attempting screen share with system audio');
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    console.log('[CAMERA-DEBUG] Screen share with system audio successful');
    return stream;
  } catch (error) {
    console.error('[CAMERA-DEBUG] Screen share with system audio failed:', error);
    
    try {
      // If system audio fails, attempt to get just the screen share
      console.log('[CAMERA-DEBUG] Attempting screen share without system audio');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      console.log('[CAMERA-DEBUG] Screen share without system audio successful');
      return stream;
    } catch (screenError) {
      console.error('[CAMERA-DEBUG] Screen share without audio failed:', screenError);
      throw new Error('Screen share is not supported or permission denied.');
    }
  }
};

/**
 * Emergency media fallback (last resort)
 */
export const emergencyMediaFallback = async (): Promise<MediaStream | null> => {
  console.log('[CAMERA-DEBUG] Attempting emergency media fallback');
  
  try {
    // Strategy 1: Video only (now our primary strategy)
    console.log('[CAMERA-DEBUG] Emergency strategy 1: Video only');
    const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    
    if (videoOnlyStream) {
      console.log('[CAMERA-DEBUG] Video-only stream obtained successfully');
      return videoOnlyStream;
    }
  } catch (error) {
    console.log('[CAMERA-DEBUG] Video-only strategy failed:', error);
  }
  
  try {
    // Strategy 2: Low-quality video with audio
    console.log('[CAMERA-DEBUG] Emergency strategy 2: Low-quality video with audio');
    const lowQualityStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true
    });
    
    if (lowQualityStream) {
      console.log('[CAMERA-DEBUG] Low-quality stream obtained successfully');
      return lowQualityStream;
    }
  } catch (error) {
    console.log('[CAMERA-DEBUG] Low-quality strategy failed:', error);
  }
  
  try {
    // Strategy 3: Audio only
    console.log('[CAMERA-DEBUG] Emergency strategy 3: Audio only');
    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    
    if (audioOnlyStream) {
      console.log('[CAMERA-DEBUG] Audio-only stream obtained successfully');
      return audioOnlyStream;
    }
  } catch (error) {
    console.log('[CAMERA-DEBUG] Audio-only strategy failed:', error);
  }
  
  console.warn('[CAMERA-DEBUG] All emergency strategies failed');
  return null;
};
