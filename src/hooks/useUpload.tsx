
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { googleDriveService } from "@/services/googleDriveService";
import { recordingService } from "@/services/recordingService";
import { useNavigate } from "react-router-dom";

export type UploadPhase = 'preparing' | 'uploading' | 'processing' | 'saving' | 'complete' | 'error';

interface UseUploadProps {
  recordingTime: number;
}

export const useUpload = ({ recordingTime }: UseUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('preparing');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleRetry = (saveRecordingFn: () => void) => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setUploadProgress(0);
      setUploadPhase('preparing');
      setUploadError(null);
      saveRecordingFn();
    } else {
      toast({
        title: "Upload failed",
        description: "Maximum retry attempts reached. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const saveRecording = async (recordedBlob: Blob, formElement: HTMLFormElement) => {
    if (!formElement) {
      toast({
        title: "Form error",
        description: "Could not access the form data. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(formElement);
    const title = formData.get("title") as string;
    const selectedRehearsal = formData.get("rehearsal") as string;
    const notes = formData.get("notes") as string;
    const tags = formData.get("tags") as string;
    
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a title for your recording.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedRehearsal) {
      toast({
        title: "Rehearsal required",
        description: "Please select a rehearsal for this recording.",
        variant: "destructive",
      });
      return;
    }
    
    if (!recordedBlob) {
      toast({
        title: "No recording",
        description: "Please record a video before saving.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setIsUploading(true);
    setUploadPhase('preparing');
    setUploadError(null);
    
    try {
      const fileExtension = "webm";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.${fileExtension}`;
      
      setUploadPhase('uploading');
      
      console.log("Uploading video to Google Drive");
      
      const driveFile = await googleDriveService.uploadVideo(
        recordedBlob,
        fileName,
        "Performance", // Will be updated with the actual performance title when saving to the database
        "Rehearsal",   // Will be updated with the actual rehearsal title when saving to the database
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (!driveFile) {
        throw new Error("Failed to upload video to Google Drive");
      }
      
      setUploadPhase('processing');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadPhase('saving');
      
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
      
      await recordingService.createRecording({
        rehearsalId: selectedRehearsal,
        title: title,
        notes: notes || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        duration: recordingTime,
        videoUrl: driveFile.webViewLink,
        thumbnailUrl: driveFile.thumbnailLink,
        googleFileId: driveFile.id
      });
      
      setUploadPhase('complete');
      setUploadComplete(true);
      
      toast({
        title: "Recording saved",
        description: "Your recording has been successfully uploaded to Google Drive and saved.",
      });
      
      navigate(`/rehearsals/${selectedRehearsal}`);
      
    } catch (error) {
      console.error("Error saving recording:", error);
      setUploadPhase('error');
      setIsUploading(false);
      setUploadError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Upload error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    isUploading,
    uploadProgress,
    uploadComplete,
    uploadPhase,
    uploadError,
    retryCount,
    saveRecording,
    handleRetry,
    setUploadProgress
  };
};
