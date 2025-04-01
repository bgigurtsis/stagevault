import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal } from "@/types";
import { rehearsalService } from "@/services/rehearsalService";
import RehearsalForm from "@/components/RehearsalForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function RehearsalEdit() {
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [loading, setLoading] = useState(true);
  const { rehearsalId } = useParams<{ rehearsalId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRehearsal = async () => {
      if (!rehearsalId) return;

      try {
        const data = await rehearsalService.getRehearsalById(rehearsalId);
        setRehearsal(data);
      } catch (error) {
        console.error("Error fetching rehearsal:", error);
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

    fetchRehearsal();
  }, [rehearsalId, navigate, toast]);

  const handleUpdateRehearsal = async (updatedData: Omit<Rehearsal, "id" | "createdAt" | "updatedAt">) => {
    if (!rehearsalId) return;
    
    try {
      await rehearsalService.updateRehearsal(rehearsalId, updatedData);
      
      toast({
        title: "Success",
        description: "Rehearsal updated successfully!",
      });
      
      navigate(`/rehearsals/${rehearsalId}`);
    } catch (error) {
      console.error("Error updating rehearsal:", error);
      toast({
        title: "Error",
        description: "Failed to update rehearsal. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[600px] w-full" />
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
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/rehearsals/${rehearsalId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Rehearsal</h1>
      </div>

      <RehearsalForm 
        rehearsal={rehearsal} 
        onSubmit={handleUpdateRehearsal} 
      />
    </div>
  );
}
