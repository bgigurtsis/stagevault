
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
    browserName: getBrowserName(),
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    secureContext: window.isSecureContext
  };
  
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

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
