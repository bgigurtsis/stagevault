
import React from "react";
import { Play, Pause, StopCircle, RotateCcw } from "lucide-react";
import { formatTime } from "@/utils/cameraUtils";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  recordedBlob: Blob | null;
  recordingTime: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onStopRecording: () => void;
  onResetRecording: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  recordedBlob,
  recordingTime,
  onStartRecording,
  onPauseRecording,
  onStopRecording,
  onResetRecording
}) => {
  return (
    <>
      {!isRecording && !recordedBlob ? (
        <button 
          onClick={onStartRecording} 
          className="record-btn"
          aria-label="Start recording"
        >
          <div className="record-btn-inner" />
        </button>
      ) : isRecording ? (
        <div className="flex items-center gap-6">
          <button
            className="camera-control-btn"
            onClick={onPauseRecording}
            aria-label={isPaused ? "Resume recording" : "Pause recording"}
          >
            {isPaused ? (
              <Play className="h-5 w-5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </button>
          
          <button
            className="record-btn"
            onClick={onStopRecording}
            aria-label="Stop recording"
          >
            <div className="record-btn-inner flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm" />
            </div>
          </button>
        </div>
      ) : recordedBlob ? (
        <button
          className="bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2"
          onClick={onResetRecording}
        >
          <RotateCcw className="h-4 w-4" />
          Record Again
        </button>
      ) : null}
    </>
  );
};

export default RecordingControls;
