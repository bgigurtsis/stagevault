import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { googleDriveService } from "@/services/googleDriveService";
import { recordingService } from "@/services/recordingService";
import { useNavigate } from "react-router-dom";
import { CreateRecordingData } from "@/services/recordingService";

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
  const [selectedRehearsal, setSelectedRehearsal] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleRetry = useCallback((saveRecordingFn: () => void) => {
    if (retryCount < 3) {
      console.log(`Retrying upload, attempt ${retryCount + 1}/3`);
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
  }, [retryCount, toast]);
  
  const resetUploadState = useCallback(() => {
    console.log("Resetting upload state");
    setIsLoading(false);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadPhase('preparing');
    setUploadError(null);
    setRetryCount(0);
    setUploadComplete(false);
  }, []);
  
  const saveRecording = useCallback(async (recordedBlob: Blob, formElement: HTMLFormElement) => {
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
    
    console.log("Form data:", { title, selectedRehearsal, notes, tags });
    
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
    
    setSelectedRehearsal(selectedRehearsal);
    
    setIsLoading(true);
    setIsUploading(true);
    setUploadPhase('preparing');
    setUploadError(null);
    
    try {
      console.log("Starting recording upload process");
      
      const fileExtension = "webm";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.${fileExtension}`;
      
      console.log("Upload file name:", fileName);
      setUploadPhase('uploading');
      
      console.log("Uploading video to Google Drive");
      
      const driveFile = await googleDriveService.uploadVideo(
        recordedBlob,
        fileName,
        "Performance",
        "Rehearsal",
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      if (!driveFile) {
        throw new Error("Failed to upload video to Google Drive");
      }
      
      console.log("Video uploaded to Google Drive:", driveFile);
      setUploadPhase('processing');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadPhase('saving');
      
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
      console.log("Processed tags:", tagsArray);
      
      const recordingData: CreateRecordingData = {
        rehearsalId: selectedRehearsal,
        title: title,
        notes: notes || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        duration: recordingTime,
        videoUrl: driveFile.webViewLink,
        thumbnailUrl: driveFile.thumbnailLink,
        googleFileId: driveFile.id
      };
      
      const savedRecording = await recordingService.createRecording(recordingData);
      
      console.log("Recording saved to database:", savedRecording);
      setUploadPhase('complete');
      setUploadComplete(true);
      
      toast({
        title: "Recording saved",
        description: "Your recording has been successfully uploaded to Google Drive and saved.",
      });
      
      setTimeout(() => {
        console.log(`Navigating to /rehearsals/${selectedRehearsal}`);
        navigate(`/rehearsals/${selectedRehearsal}`);
      }, 1500);
      
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
  }, [navigate, recordingTime, toast]);
  
  return {
    isLoading,
    isUploading,
    uploadProgress,
    uploadComplete,
    uploadPhase,
    uploadError,
    retryCount,
    selectedRehearsal,
    saveRecording,
    handleRetry,
    resetUploadState,
    setUploadProgress
  };
};
