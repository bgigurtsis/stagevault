
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Theater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceForm } from "@/components/PerformanceForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { performanceService } from "@/services/performanceService";
import { Performance } from "@/types";

export default function PerformanceEdit() {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { performanceId } = useParams<{ performanceId: string }>();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!performanceId) {
        toast({
          title: "Error",
          description: "Performance ID is missing",
          variant: "destructive",
        });
        navigate("/performances");
        return;
      }

      try {
        const data = await performanceService.getPerformanceById(performanceId);
        if (data) {
          setPerformance(data);
        } else {
          toast({
            title: "Error",
            description: "Performance not found",
            variant: "destructive",
          });
          navigate("/performances");
        }
      } catch (error) {
        console.error("Error fetching performance:", error);
        toast({
          title: "Error",
          description: "Failed to load performance details",
          variant: "destructive",
        });
        navigate("/performances");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchPerformance();
  }, [performanceId, navigate, toast]);

  const handleSubmit = async (values: any) => {
    if (!currentUser || !performanceId || !performance) {
      toast({
        title: "Error",
        description: "Missing required data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format dates properly for Supabase
      const formattedValues = {
        ...values,
        id: performanceId,
        startDate: values.startDate ? values.startDate.toISOString().split('T')[0] : undefined,
        endDate: values.endDate ? values.endDate.toISOString().split('T')[0] : undefined,
      };

      const updatedPerformance = await performanceService.updatePerformance(formattedValues);
      
      if (updatedPerformance) {
        toast({
          title: "Performance updated",
          description: "Your performance has been updated successfully",
        });
        navigate(`/performances/${performanceId}`);
      } else {
        throw new Error("Failed to update performance");
      }
    } catch (error) {
      console.error("Error updating performance:", error);
      toast({
        title: "Error",
        description: "Failed to update performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="container max-w-3xl py-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading performance details...</p>
        </div>
      </div>
    );
  }

  if (!performance) return null;

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Theater className="h-7 w-7" />
          <span>Edit Performance</span>
        </h1>
      </div>

      <PerformanceForm 
        performance={performance}
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
}
