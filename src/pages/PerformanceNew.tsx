
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Theater, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceForm } from "@/components/PerformanceForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { dataService } from "@/services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PerformanceNew() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, isDriveConnected } = useAuth();

  const handleSubmit = async (values: any) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a performance",
        variant: "destructive",
      });
      return;
    }

    if (!isDriveConnected) {
      toast({
        title: "Google Drive required",
        description: "You need to connect your Google Drive account in Profile settings to create performances.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format dates properly for Supabase
      const formattedValues = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : undefined,
        endDate: values.endDate ? values.endDate.toISOString().split('T')[0] : undefined,
        createdBy: currentUser.id,
      };

      console.log("Creating performance with formatted values:", formattedValues);
      const performance = await dataService.createPerformance(formattedValues);
      
      if (performance) {
        console.log("Performance created successfully, navigating to:", `/performances/${performance.id}`);
        toast({
          title: "Performance created",
          description: "Your performance has been created successfully",
        });
        
        // Use timeout to ensure state updates have completed
        setTimeout(() => {
          navigate(`/performances/${performance.id}`);
        }, 100);
      } else {
        throw new Error("Failed to create performance");
      }
    } catch (error) {
      console.error("Error creating performance:", error);
      toast({
        title: "Error",
        description: "Failed to create performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Theater className="h-7 w-7" />
          <span>New Performance</span>
        </h1>
      </div>

      {!isDriveConnected && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Google Drive not connected</AlertTitle>
          <AlertDescription>
            You need to connect your Google Drive account to create performances with storage folders.
            <div className="mt-2">
              <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
                Go to Profile Settings
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <PerformanceForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
}
