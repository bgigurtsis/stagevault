
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

// New utility function to manually open browser settings
export const openBrowserPermissionSettings = (): void => {
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
  
  // For browsers that support it, open a popup with instructions
  try {
    window.open(helpUrl, '_blank');
  } catch (error) {
    console.warn('Could not open browser settings URL:', error);
  }
};

// Determine if there's likely a permanent camera block
export const isProbablyPermanentlyBlocked = (errorMessage: string): boolean => {
  // The specific error message varies by browser
  return (
    errorMessage.includes('denied') || 
    errorMessage.includes('NotAllowedError') ||
    errorMessage.includes('Permission denied')
  );
};
