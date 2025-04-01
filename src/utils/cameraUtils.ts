
export const getSupportedMimeType = (): string => {
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
      console.log(`Mime type supported: ${type}`);
      return type;
    }
  }
  
  console.log(`No specific mime type supported, using fallback`);
  return 'video/webm'; // fallback
};

export const checkBrowserCompatibility = () => {
  const compatibility = {
    userMediaSupported: !!navigator.mediaDevices?.getUserMedia,
    mediaRecorderSupported: typeof MediaRecorder !== 'undefined',
    enumerateDevicesSupported: !!navigator.mediaDevices?.enumerateDevices,
    screenshareSupported: !!navigator.mediaDevices?.getDisplayMedia,
    permissionsApiSupported: 'permissions' in navigator,
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion(),
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    secureContext: window.isSecureContext
  };
  
  console.log("Browser compatibility check:", compatibility);
  
  if (!compatibility.userMediaSupported) {
    console.warn("getUserMedia is not supported on this browser");
  }
  
  if (!compatibility.mediaRecorderSupported) {
    console.warn("MediaRecorder is not supported on this browser");
  }
  
  if (!compatibility.secureContext) {
    console.warn("Not in secure context, camera access may be unavailable");
  }
  
  if (compatibility.isIOS && compatibility.browserName !== "Safari") {
    console.warn("On iOS, only Safari fully supports camera recording");
  }
  
  return compatibility;
};

export const getBrowserName = (): string => {
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

export const getBrowserVersion = (): string => {
  const userAgent = navigator.userAgent;
  let browserVersion = "unknown";
  
  const match = userAgent.match(/(chrome|firefox|safari|opr|edge|msie|rv:)\/?\s*(\d+(\.\d+)*)/i);
  if (match && match[2]) {
    browserVersion = match[2];
  }
  
  return browserVersion;
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const isCameraPermissionPersistentlyDenied = async (): Promise<boolean> => {
  if (!navigator.permissions) {
    // Permissions API not supported, can't determine persistent denial
    return false;
  }

  try {
    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permissionStatus.state === 'denied';
  } catch (error) {
    console.error("Error checking camera permission status:", error);
    return false;
  }
};

export const getDeviceInfo = (): Record<string, string | boolean> => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    isOnline: navigator.onLine,
    screen: `${window.screen.width}x${window.screen.height}`,
    colorDepth: String(window.screen.colorDepth),
    devicePixelRatio: String(window.devicePixelRatio),
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion()
  };
};

export const getUserMediaWithTimeout = async (constraints: MediaStreamConstraints, timeoutMs = 10000): Promise<MediaStream> => {
  console.log(`[CAMERA-DEBUG] getUserMediaWithTimeout called with timeout ${timeoutMs}ms and constraints:`, constraints);
  
  return new Promise<MediaStream>(async (resolve, reject) => {
    // Set a timeout to abort if taking too long
    const timeoutId = setTimeout(() => {
      console.log(`[CAMERA-DEBUG] getUserMedia timed out after ${timeoutMs}ms`);
      reject(new Error('Timeout starting video source'));
    }, timeoutMs);
    
    try {
      console.log(`[CAMERA-DEBUG] Attempting navigator.mediaDevices.getUserMedia...`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`[CAMERA-DEBUG] getUserMedia successful, got stream with tracks:`, 
        stream.getTracks().map(t => `${t.kind}:${t.label} (${t.readyState})`));
      
      clearTimeout(timeoutId);
      resolve(stream);
    } catch (error) {
      console.log(`[CAMERA-DEBUG] getUserMedia failed:`, error);
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

export const handleCameraTimeout = (attempts = 1): Promise<MediaStream> => {
  console.log(`[CAMERA-DEBUG] handleCameraTimeout attempt #${attempts}`);
  
  // Progressively more lenient constraints
  const videoConstraints = [
    { width: { ideal: 1280 }, height: { ideal: 720 } }, // First try high quality
    { width: { ideal: 640 }, height: { ideal: 480 } },  // Then try standard quality
    true // Finally try with minimal constraints
  ];
  
  // Get the appropriate constraints based on retry attempt
  const constraintLevel = Math.min(attempts - 1, videoConstraints.length - 1);
  const constraints = {
    video: videoConstraints[constraintLevel],
    audio: true
  };
  
  // Increase timeout for each attempt
  const timeoutMs = 8000 + (attempts * 2000);
  
  console.log(`[CAMERA-DEBUG] Trying camera with timeout ${timeoutMs}ms and constraint level ${constraintLevel}:`, constraints);
  
  return getUserMediaWithTimeout(constraints, timeoutMs);
};

export const openBrowserPermissionSettings = (): void => {
  console.log(`[CAMERA-DEBUG] Attempting to open browser permission settings`);
  const browserName = getBrowserName();
  let helpUrl = '';
  
  switch(browserName) {
    case 'Chrome':
    case 'Edge':
      helpUrl = 'chrome://settings/content/camera';
      break;
    case 'Firefox':
      helpUrl = 'about:preferences#privacy';
      break;
    case 'Safari':
      helpUrl = 'https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac';
      break;
    default:
      helpUrl = 'https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform%3DDesktop';
  }
  
  console.log(`[CAMERA-DEBUG] Browser detected: ${browserName}, help URL: ${helpUrl}`);
  
  // For browsers that support it, open a popup with instructions
  try {
    const newWindow = window.open(helpUrl, '_blank');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.warn('[CAMERA-DEBUG] Browser blocked opening settings URL. Likely needs user interaction first.');
      alert(`Please visit ${helpUrl} to manage camera permissions`);
    }
  } catch (error) {
    console.warn('[CAMERA-DEBUG] Could not open browser settings URL:', error);
    // Fallback to showing a modal or alert with instructions
    alert(`To update camera permissions, go to your browser settings and search for "camera" or "permissions"`);
  }
};

export const isProbablyPermanentlyBlocked = (errorMessage: string): boolean => {
  // The specific error message varies by browser
  const isPermanentlyBlocked = (
    errorMessage.includes('denied') || 
    errorMessage.includes('NotAllowedError') ||
    errorMessage.includes('Permission denied')
  );
  
  console.log(`[CAMERA-DEBUG] Permission check: isProbablyPermanentlyBlocked=${isPermanentlyBlocked} for error: ${errorMessage}`);
  return isPermanentlyBlocked;
};

export const clearSiteData = (): boolean => {
  try {
    console.log(`[CAMERA-DEBUG] Attempting to clear site data related to camera permissions`);
    // Try to clear localStorage
    localStorage.removeItem('camera_permissions');
    
    // Try to clear IndexedDB
    window.indexedDB?.deleteDatabase('media_permissions');
    
    // Try to clear sessionStorage
    sessionStorage.removeItem('camera_state');
    
    return true;
  } catch (error) {
    console.error('[CAMERA-DEBUG] Failed to clear site data:', error);
    return false;
  }
};

export const hasExceededRetryLimit = (key: string, limit: number): boolean => {
  try {
    const attemptsString = sessionStorage.getItem(key) || '0';
    const attempts = parseInt(attemptsString, 10);
    
    console.log(`[CAMERA-DEBUG] Retry check: ${attempts}/${limit} attempts for key "${key}"`);
    
    if (attempts >= limit) {
      return true;
    }
    
    // Increment the counter
    sessionStorage.setItem(key, String(attempts + 1));
    return false;
  } catch (error) {
    console.error('[CAMERA-DEBUG] Error tracking retry limits:', error);
    return false;
  }
};

export const resetRetryCounter = (key: string): void => {
  try {
    console.log(`[CAMERA-DEBUG] Resetting retry counter for key "${key}"`);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('[CAMERA-DEBUG] Error resetting retry counter:', error);
  }
};

// New helper for screen sharing fallback with specific constraints
export const getScreenShareWithAudio = async (): Promise<MediaStream> => {
  console.log('[CAMERA-DEBUG] Attempting to get screen share with audio');
  
  try {
    // First try to get display media with audio
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
      },
      audio: true
    });
    
    console.log('[CAMERA-DEBUG] Screen share successful with audio tracks:', 
      displayStream.getAudioTracks().length);
    
    // If we didn't get audio track, try to add it separately
    if (displayStream.getAudioTracks().length === 0) {
      try {
        console.log('[CAMERA-DEBUG] No audio in screen share, attempting to add audio separately');
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        audioStream.getAudioTracks().forEach(track => {
          console.log('[CAMERA-DEBUG] Adding audio track to screen share:', track.label);
          displayStream.addTrack(track);
        });
      } catch (audioErr) {
        console.warn('[CAMERA-DEBUG] Could not add audio to screen share:', audioErr);
        // Continue without audio if we can't get it
      }
    }
    
    return displayStream;
  } catch (error) {
    console.error('[CAMERA-DEBUG] Screen share with audio failed:', error);
    
    // Try again without audio requirement if that was the issue
    if (error instanceof Error && error.message.includes('audio')) {
      console.log('[CAMERA-DEBUG] Retrying screen share without audio requirement');
      return navigator.mediaDevices.getDisplayMedia({ video: true });
    }
    
    throw error;
  }
};

// Enhanced timeout handler with specific mobile device detection
export const getMobileStreamWithTimeout = async (): Promise<MediaStream> => {
  console.log('[CAMERA-DEBUG] Attempting to get mobile-optimized stream');
  
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (!isIOS && !isAndroid) {
    console.log('[CAMERA-DEBUG] Not a mobile device, using standard constraints');
    return handleCameraTimeout(1);
  }
  
  // Mobile-specific constraints
  let constraints: MediaStreamConstraints;
  
  if (isIOS) {
    console.log('[CAMERA-DEBUG] iOS device detected, using iOS-optimized constraints');
    constraints = {
      audio: true,
      video: {
        facingMode: 'user', // Front camera
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 }
      }
    };
  } else {
    console.log('[CAMERA-DEBUG] Android device detected, using Android-optimized constraints');
    constraints = {
      audio: true,
      video: {
        facingMode: 'user',
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 }
      }
    };
  }
  
  return getUserMediaWithTimeout(constraints, 12000);
};

// New utility to check if device is in low-power mode (basic detection)
export const isLowPowerMode = (): boolean => {
  // Basic heuristic for potential low power mode
  const isLowPower = navigator.hardwareConcurrency <= 2 || 
                    /low-power|battery|energy/i.test(navigator.userAgent);
  
  console.log(`[CAMERA-DEBUG] Low power mode check: ${isLowPower} (hardwareConcurrency: ${navigator.hardwareConcurrency})`);
  return isLowPower;
};
