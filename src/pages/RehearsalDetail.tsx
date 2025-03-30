
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal, Recording, Performance } from "@/types";
import { rehearsalService } from "@/services/rehearsalService";
import { performanceService } from "@/services/performanceService";
import { recordingService } from "@/services/recordingService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar, MapPin, Pencil, Trash, Video, Users, Clock, Tag, Plus, Play, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function RehearsalDetail() {
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  
  const { rehearsalId } = useParams<{ rehearsalId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRehearsalData = async () => {
      if (!rehearsalId) return;

      try {
        // Fetch rehearsal details
        const rehearsalData = await rehearsalService.getRehearsalById(rehearsalId);
        setRehearsal(rehearsalData);

        // Fetch associated performance
        if (rehearsalData.performanceId) {
          const performanceData = await performanceService.getPerformanceById(rehearsalData.performanceId);
          setPerformance(performanceData);
        }

        // Fetch recordings for this rehearsal
        const recordingsData = await recordingService.getRecordingsByRehearsalId(rehearsalId);
        setRecordings(recordingsData);
      } catch (error) {
        console.error("Error fetching rehearsal data:", error);
        toast({
          title: "Error",
          description: "Failed to load rehearsal details. Please try again.",
          variant: "destructive",
        });
        navigate("/rehearsals");
      } finally {
        setLoading(false);
      }
    };

    fetchRehearsalData();
  }, [rehearsalId, navigate, toast]);

  const handleDeleteRehearsal = async () => {
    if (!rehearsalId) return;

    try {
      await rehearsalService.deleteRehearsal(rehearsalId);
      toast({
        title: "Success",
        description: "Rehearsal deleted successfully.",
      });
      navigate(rehearsal?.performanceId ? `/performances/${rehearsal.performanceId}` : "/rehearsals");
    } catch (error) {
      console.error("Error deleting rehearsal:", error);
      toast({
        title: "Error",
        description: "Failed to delete rehearsal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      await recordingService.deleteRecording(recordingId);
      
      // Update the recordings list by filtering out the deleted one
      setRecordings(currentRecordings => 
        currentRecordings.filter(recording => recording.id !== recordingId)
      );
      
      toast({
        title: "Success",
        description: "Recording deleted successfully.",
      });
      
      setRecordingToDelete(null);
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast({
        title: "Error",
        description: "Failed to delete recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const openVideoDialog = (recording: Recording) => {
    setSelectedRecording(recording);
    setVideoDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!rehearsal) {
    return (
      <div className="container py-6">
        <p>Rehearsal not found</p>
        <Button onClick={() => navigate("/rehearsals")} className="mt-4">
          Back to Rehearsals
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => rehearsal.performanceId ? navigate(`/performances/${rehearsal.performanceId}`) : navigate("/rehearsals")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{rehearsal.title}</h1>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span>{rehearsal.date ? format(parseISO(rehearsal.date), "PPP") : "No date set"}</span>
        </div>
        {rehearsal.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span>{rehearsal.location}</span>
          </div>
        )}
        {performance && (
          <div className="flex items-center gap-2">
            <Link to={`/performances/${performance.id}`} className="hover:underline flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Part of:</span>
              <span>{performance.title}</span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button onClick={() => navigate(`/rehearsals/${rehearsalId}/edit`)} variant="outline" className="flex gap-2">
          <Pencil className="h-4 w-4" /> Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex gap-2">
              <Trash className="h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this rehearsal and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRehearsal}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={() => navigate(`/record?rehearsalId=${rehearsalId}`)} className="flex gap-2 ml-auto">
          <Video className="h-4 w-4" /> Record
        </Button>
      </div>

      {rehearsal.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{rehearsal.description}</p>
          </CardContent>
        </Card>
      )}

      {rehearsal.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{rehearsal.notes}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recordings</h2>
          <Button onClick={() => navigate(`/record?rehearsalId=${rehearsalId}`)} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Recording
          </Button>
        </div>
        
        {recordings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">No recordings yet</h3>
                <p className="text-muted-foreground">Record your first video for this rehearsal.</p>
                <Button onClick={() => navigate(`/record?rehearsalId=${rehearsalId}`)}>
                  <Video className="mr-2 h-4 w-4" /> Start Recording
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((recording) => (
              <Card key={recording.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{recording.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDuration(recording.duration)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {recording.thumbnailUrl ? (
                    <div 
                      className="aspect-video mb-3 overflow-hidden rounded-md bg-muted group relative cursor-pointer"
                      onClick={() => openVideoDialog(recording)}
                    >
                      <img 
                        src={recording.thumbnailUrl} 
                        alt={recording.title} 
                        className="h-full w-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="aspect-video mb-3 overflow-hidden rounded-md bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => recording.videoUrl ? openVideoDialog(recording) : null}
                    >
                      <Video className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {recording.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {recording.notes}
                    </p>
                  )}
                  
                  {recording.tags && recording.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recording.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => openVideoDialog(recording)}
                    disabled={!recording.videoUrl}
                  >
                    <Play className="mr-2 h-4 w-4" /> Play
                  </Button>
                  {recording.videoUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={recording.videoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => {
                      setRecordingToDelete(recording.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Recording Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this recording. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordingToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => recordingToDelete && handleDeleteRecording(recordingToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{selectedRecording?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDuration(selectedRecording?.duration)}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black">
            {selectedRecording?.videoUrl && (
              <iframe 
                src={selectedRecording.videoUrl.replace('/view', '/preview')} 
                className="w-full h-full" 
                allow="autoplay; fullscreen"
                title={selectedRecording.title}
              />
            )}
          </div>
          <div className="p-4">
            {selectedRecording?.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">Notes:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRecording.notes}</p>
              </div>
            )}
            
            {selectedRecording?.tags && selectedRecording.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tags:</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedRecording.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedRecording?.videoUrl && (
              <div className="mt-4 flex justify-end">
                <Button asChild>
                  <a href={selectedRecording.videoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in Google Drive
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
