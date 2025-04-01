
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal } from "@/types";
import { rehearsalService } from "@/services/rehearsalService";
import { performanceService } from "@/services/performanceService";
import RehearsalForm from "@/components/RehearsalForm";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuthContext";

export default function RehearsalNew() {
  const [loading, setLoading] = useState(false);
  const { performanceId: urlParamPerformanceId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queryPerformanceId = searchParams.get("performanceId");
  
  // Use performanceId from either URL params or query params
  const performanceId = urlParamPerformanceId || queryPerformanceId || undefined;
  const [contextTitle, setContextTitle] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDriveConnected } = useAuth();

  // Get context information from the current location
  useEffect(() => {
    const getContextInfo = async () => {
      if (performanceId) {
        try {
          const performance = await performanceService.getPerformanceById(performanceId);
          if (performance) {
            setContextTitle(performance.title);
          }
        } catch (error) {
          console.error("Error getting performance details:", error);
        }
      }
    };
    
    getContextInfo();
  }, [performanceId]);

  const handleCreateRehearsal = async (rehearsal: Omit<Rehearsal, "id" | "createdAt" | "updatedAt">): Promise<void> => {
    if (!isDriveConnected) {
      toast({
        title: "Google Drive required",
        description: "You need to connect your Google Drive account in Profile settings to create rehearsals.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use the CreateRehearsalData interface explicitly
      await rehearsalService.createRehearsal({
        title: rehearsal.title,
        description: rehearsal.description,
        date: rehearsal.date,
        location: rehearsal.location,
        notes: rehearsal.notes,
        performanceId: rehearsal.performanceId,
        taggedUsers: rehearsal.taggedUsers,
      });
      
      toast({
        title: "Success",
        description: "Rehearsal created successfully!",
      });
      
      // Navigate back to performance detail or rehearsals list
      if (rehearsal.performanceId) {
        navigate(`/performances/${rehearsal.performanceId}`);
      } else {
        navigate("/rehearsals");
      }
      
    } catch (error) {
      console.error("Error creating rehearsal:", error);
      toast({
        title: "Error",
        description: "Failed to create rehearsal. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => performanceId ? navigate(`/performances/${performanceId}`) : navigate("/rehearsals")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Rehearsal</h1>
          {contextTitle && (
            <p className="text-muted-foreground">For performance: {contextTitle}</p>
          )}
        </div>
      </div>

      {!isDriveConnected && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Google Drive not connected</AlertTitle>
          <AlertDescription>
            You need to connect your Google Drive account to create rehearsals with storage folders.
            <div className="mt-2">
              <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
                Go to Profile Settings
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <RehearsalForm onSubmit={handleCreateRehearsal} performanceId={performanceId} />
    </div>
  );
}
