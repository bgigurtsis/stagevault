import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Performance, Rehearsal } from "@/types";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Edit, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { confirm } from "@/components/ui/confirm";
import { Skeleton } from "@/components/ui/skeleton";

export default function Performances() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [rehearsalsByPerformance, setRehearsalsByPerformance] = useState<{
    [performanceId: string]: Rehearsal[];
  }>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPerformances = async () => {
      try {
        setLoading(true);
        const performancesData = await performanceService.getPerformances();
        setPerformances(performancesData);

        // Fetch rehearsals for each performance
        const rehearsalsData: { [performanceId: string]: Rehearsal[] } = {};
        for (const performance of performancesData) {
          const rehearsals = await fetchRehearsalsForPerformance(performance.id);
          rehearsalsData[performance.id] = rehearsals;
        }
        setRehearsalsByPerformance(rehearsalsData);
      } catch (error) {
        console.error("Error fetching performances:", error);
        toast({
          title: "Error",
          description: "Failed to load performances. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPerformances();
  }, [toast]);

  const fetchRehearsalsForPerformance = async (performanceId: string) => {
    try {
      const rehearsalsData = await rehearsalService.getRehearsalsByPerformance(performanceId);
      return rehearsalsData;
    } catch (error) {
      console.error(`Error fetching rehearsals for performance ${performanceId}:`, error);
      return [];
    }
  };

  const handleDeletePerformance = async (performanceId: string) => {
    const confirmed = await confirm({
      title: "Delete Performance?",
      description: "Are you sure you want to delete this performance? This action cannot be undone.",
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await performanceService.deletePerformance(performanceId);
      setPerformances((prev) => prev.filter((p) => p.id !== performanceId));
      toast({
        title: "Success",
        description: "Performance deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting performance:", error);
      toast({
        title: "Error",
        description: "Failed to delete performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Performances</h1>
        <Button onClick={() => navigate("/performances/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Performance
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      ) : performances.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">No performances yet</h2>
          <p className="text-muted-foreground">Click the button above to add a new performance.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {performances.map((performance) => (
            <div key={performance.id} className="rounded-md border shadow-sm">
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">{performance.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {performance.startDate && format(new Date(performance.startDate), "PPP")}
                  {performance.endDate && ` - ${format(new Date(performance.endDate), "PPP")}`}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {rehearsalsByPerformance[performance.id]?.length || 0} Rehearsals
                </div>
              </div>
              <div className="flex justify-end space-x-2 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/performances/${performance.id}`)}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/performances/${performance.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePerformance(performance.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
