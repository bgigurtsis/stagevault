
import React from "react";
import { formatTime } from "@/utils/cameraUtils";

interface RecordingTimerProps {
  recordingTime: number;
  isPaused: boolean;
}

const RecordingTimer: React.FC<RecordingTimerProps> = ({ recordingTime, isPaused }) => {
  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center items-center">
      <div className="bg-black/50 text-white px-4 py-2 rounded-full flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
        <span className="font-mono">{formatTime(recordingTime)}</span>
      </div>
    </div>
  );
};

export default RecordingTimer;
