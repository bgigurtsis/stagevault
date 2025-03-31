
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Theater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceForm } from "@/components/PerformanceForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { dataService } from "@/services/dataService";
import { googleDriveService } from "@/services/googleDriveService";

export default function PerformanceNew() {
  const [isLoading, setIsLoading] = useState(false);
  const [driveTestLoading, setDriveTestLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (values: any) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a performance",
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

  const testDriveAccess = async () => {
    setDriveTestLoading(true);
    try {
      const result = await googleDriveService.testDriveAccess();
      
      toast({
        title: result.success ? "Drive Access Test Successful" : "Drive Access Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      
      if (result.success && result.folderId) {
        console.log(`Root folder ID: ${result.folderId}`);
      }
    } catch (error) {
      console.error("Error testing drive access:", error);
      toast({
        title: "Error Testing Drive Access",
        description: error.message || "An unexpected error occurred while testing Google Drive access",
        variant: "destructive",
      });
    } finally {
      setDriveTestLoading(false);
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

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testDriveAccess}
          disabled={driveTestLoading}
          className="mb-4"
        >
          {driveTestLoading ? "Testing..." : "Test Drive Folder"}
        </Button>
      </div>

      <PerformanceForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
}
