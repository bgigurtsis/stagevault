import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Video, 
  X, 
  Pause, 
  Play, 
  StopCircle, 
  Save,
  ArrowLeft,
  Upload,
  Check,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { recordingService } from "@/services/recordingService";
import { googleDriveService } from "@/services/googleDriveService";
import { Performance, Rehearsal } from "@/types";
import "./Record.css";

export default function Record() {
  const [title, setTitle] = useState("");
  const [selectedPerformance, setSelectedPerformance] = useState("");
  const [selectedRehearsal, setSelectedRehearsal] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [availableRehearsals, setAvailableRehearsals] = useState<Rehearsal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rehearsalIdParam = searchParams.get('rehearsalId');
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const performanceData = await performanceService.getPerformances();
        setPerformances(performanceData);
        
        if (!rehearsalIdParam) {
          const rehearsalData = await rehearsalService.getAllRehearsals();
          setAvailableRehearsals(rehearsalData);
        } else {
          const rehearsal = await rehearsalService.getRehearsalById(rehearsalIdParam);
          if (rehearsal) {
            setSelectedRehearsal(rehearsal.id);
            setSelectedPerformance(rehearsal.performanceId);
            const filteredRehearsals = await rehearsalService.getRehearsalsByPerformance(rehearsal.performanceId);
            setAvailableRehearsals(filteredRehearsals);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load performances and rehearsals. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [rehearsalIdParam, toast]);
  
  useEffect(() => {
    const updateRehearsals = async () => {
      if (selectedPerformance) {
        try {
          const rehearsals = await rehearsalService.getRehearsalsByPerformance(selectedPerformance);
          setAvailableRehearsals(rehearsals);
          
          if (rehearsals.length > 0 && !selectedRehearsal) {
            setSelectedRehearsal(rehearsals[0].id);
          }
        } catch (error) {
          console.error("Error fetching rehearsals for performance:", error);
          toast({
            title: "Error",
            description: "Failed to load rehearsals for this performance.",
            variant: "destructive",
          });
        }
      }
    };

    updateRehearsals();
  }, [selectedPerformance, selectedRehearsal, toast]);
  
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setVideoUrl(url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow access to your camera and microphone to record.",
        variant: "destructive",
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  const resetRecording = () => {
    stopRecording();
    setRecordingTime(0);
    setRecordedBlob(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadComplete(false);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
      videoRef.current.controls = false;
    }
  };
  
  const saveRecording = async () => {
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
    
    try {
      const rehearsal = availableRehearsals.find(r => r.id === selectedRehearsal);
      if (!rehearsal) throw new Error("Rehearsal not found");
      
      const performance = performances.find(p => p.id === rehearsal.performanceId);
      if (!performance) throw new Error("Performance not found");
      
      const fileExtension = "webm";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.${fileExtension}`;
      
      const driveFile = await googleDriveService.uploadVideo(
        recordedBlob,
        fileName,
        performance.title,
        rehearsal.title,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (!driveFile) {
        throw new Error("Failed to upload video to Google Drive");
      }
      
      setUploadComplete(true);
      
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
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
      
      toast({
        title: "Recording saved",
        description: "Your recording has been successfully uploaded to Google Drive and saved.",
      });
      
      navigate(`/rehearsals/${selectedRehearsal}`);
    } catch (error) {
      console.error("Error saving recording:", error);
      setIsUploading(false);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-destructive" />
            <span>Record Video</span>
          </h1>
        </div>
        {recordedBlob && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetRecording} disabled={isUploading}>
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button 
              onClick={saveRecording} 
              disabled={isLoading || isUploading}
              className={uploadComplete ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {uploadComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved
                </>
              ) : isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Recording
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="bg-background border rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploading to Google Drive</span>
            <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {uploadComplete ? 
              "Upload complete! Saving recording details..." : 
              "Please do not close this page while the video is uploading."}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-muted rounded-lg overflow-hidden relative aspect-video">
            {!isRecording && !recordedBlob && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground font-medium">
                  Ready to record your performance
                </p>
                <p className="text-sm text-muted-foreground">
                  Press the record button below to start
                </p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted={isRecording} // Mute only during recording to prevent feedback
              playsInline
              className="w-full h-full object-cover"
            />
            
            {isRecording && (
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                <span>{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            {!isRecording && !recordedBlob ? (
              <button 
                onClick={startRecording} 
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
                  onClick={pauseRecording}
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
                  onClick={stopRecording}
                  aria-label="Stop recording"
                >
                  <StopCircle className="h-8 w-8" />
                </Button>
              </div>
            ) : null}
          </div>
          
          {recordedBlob && !isUploading && (
            <div className="bg-muted/40 border rounded p-3 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Recording length: {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Recording Title *</Label>
            <Input
              id="title"
              placeholder="Enter a title for this recording"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="performance">Performance</Label>
            <Select
              value={selectedPerformance}
              onValueChange={setSelectedPerformance}
              disabled={!!rehearsalIdParam || isUploading}
            >
              <SelectTrigger id="performance">
                <SelectValue placeholder="Select a performance" />
              </SelectTrigger>
              <SelectContent>
                {performances.map((performance) => (
                  <SelectItem key={performance.id} value={performance.id}>
                    {performance.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rehearsal">Rehearsal *</Label>
            <Select
              value={selectedRehearsal}
              onValueChange={setSelectedRehearsal}
              disabled={!!rehearsalIdParam || isUploading}
            >
              <SelectTrigger id="rehearsal">
                <SelectValue placeholder="Select a rehearsal" />
              </SelectTrigger>
              <SelectContent>
                {availableRehearsals.map((rehearsal) => (
                  <SelectItem key={rehearsal.id} value={rehearsal.id}>
                    {rehearsal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this recording"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Add tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              E.g., solo, group, needs work
            </p>
          </div>
          
          {recordedBlob && !isUploading && (
            <div className="mt-4">
              <Button 
                onClick={saveRecording} 
                className="w-full" 
                disabled={isLoading || !title || !selectedRehearsal}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload to Google Drive
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Your video will be securely stored in your Google Drive account
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
