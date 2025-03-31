
import React from "react";
import { Play, Pause, StopCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="record-controls flex justify-center my-6">
      {!isRecording && !recordedBlob ? (
        <button 
          onClick={onStartRecording} 
          className="record-btn"
          aria-label="Start recording"
        >
          <div className="record-btn-inner" />
        </button>
      ) : isRecording ? (
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={onPauseRecording}
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
            onClick={onStopRecording}
            aria-label="Stop recording"
          >
            <StopCircle className="h-8 w-8" />
          </Button>
        </div>
      ) : recordedBlob ? (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onResetRecording}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Record Again
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default RecordingControls;
