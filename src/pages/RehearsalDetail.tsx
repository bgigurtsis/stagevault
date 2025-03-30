
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal, Recording, Performance } from "@/types";
import { rehearsalService } from "@/services/rehearsalService";
import { performanceService } from "@/services/performanceService";
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
import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar, MapPin, Pencil, Trash, Video, Users } from "lucide-react";

export default function RehearsalDetail() {
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
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
        const performanceData = await performanceService.getPerformanceById(rehearsalData.performanceId);
        setPerformance(performanceData);

        // For now, we'll use mock recordings data
        // In Phase 5, we'll implement the actual recordings fetching
        setRecordings([]);
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
        <h2 className="text-2xl font-bold mb-4">Recordings</h2>
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
              <Card key={recording.id}>
                <CardHeader>
                  <CardTitle>{recording.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {recording.thumbnailUrl && (
                    <img 
                      src={recording.thumbnailUrl} 
                      alt={recording.title} 
                      className="w-full h-40 object-cover rounded-md mb-4" 
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Recording
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
