
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Theater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceForm } from "@/components/PerformanceForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { performanceService } from "@/services/performanceService";

export default function PerformanceNew() {
  const [isLoading, setIsLoading] = useState(false);
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

      const performance = await performanceService.createPerformance(formattedValues);
      
      if (performance) {
        toast({
          title: "Performance created",
          description: "Your performance has been created successfully",
        });
        navigate(`/performances/${performance.id}`);
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

      <PerformanceForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
}
