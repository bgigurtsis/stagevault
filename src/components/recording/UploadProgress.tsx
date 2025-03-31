
import React from "react";
import { AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/utils/cameraUtils";
import { UploadPhase } from "@/hooks/useUpload";

interface UploadProgressProps {
  isUploading: boolean;
  uploadPhase: UploadPhase;
  uploadProgress: number;
  uploadError: string | null;
  retryCount: number;
  recordingTime: number;
  recordedBlob: Blob | null;
  onRetry: () => void;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  isUploading,
  uploadPhase,
  uploadProgress,
  uploadError,
  retryCount,
  recordingTime,
  recordedBlob,
  onRetry
}) => {
  const getPhaseLabel = () => {
    switch (uploadPhase) {
      case 'preparing': return 'Preparing upload...';
      case 'uploading': return 'Uploading to Google Drive...';
      case 'processing': return 'Processing video...';
      case 'saving': return 'Saving recording details...';
      case 'complete': return 'Upload complete!';
      case 'error': return 'Upload failed';
    }
  };
  
  const getProgressValue = () => {
    switch (uploadPhase) {
      case 'uploading': return uploadProgress;
      case 'preparing': return 10;
      case 'processing': return 80;
      case 'saving': return 95;
      case 'complete': return 100;
      default: return 0;
    }
  };
  
  if (!isUploading && recordedBlob) {
    return (
      <div className="bg-muted/40 border rounded p-3 text-sm flex items-center gap-2 mx-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>Recording length: {formatTime(recordingTime)}</span>
        <Badge variant="outline" className="ml-auto">
          {Math.round(recordedBlob.size / 1024 / 1024 * 10) / 10} MB
        </Badge>
      </div>
    );
  }
  
  if (isUploading) {
    return (
      <div className="bg-background border rounded-md p-4 space-y-3 mx-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {getPhaseLabel()}
          </span>
          <span className="text-sm text-muted-foreground">
            {uploadPhase === 'uploading' ? `${Math.round(uploadProgress)}%` : ''}
          </span>
        </div>
        
        <Progress 
          value={getProgressValue()} 
          className="h-2" 
        />
        
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Upload failed</p>
              <p className="text-red-700">{uploadError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={onRetry}
                disabled={retryCount >= 3}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Upload ({retryCount}/3)
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default UploadProgress;
