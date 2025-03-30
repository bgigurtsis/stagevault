
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal } from "@/types";
import { rehearsalService } from "@/services/rehearsalService";
import RehearsalForm from "@/components/RehearsalForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RehearsalNew() {
  const [loading, setLoading] = useState(false);
  const { performanceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateRehearsal = async (rehearsal: Omit<Rehearsal, "id" | "createdAt" | "updatedAt">): Promise<void> => {
    setLoading(true);
    try {
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
      if (performanceId) {
        navigate(`/performances/${performanceId}`);
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
        <h1 className="text-3xl font-bold tracking-tight">New Rehearsal</h1>
      </div>

      <RehearsalForm onSubmit={handleCreateRehearsal} performanceId={performanceId} />
    </div>
  );
}
