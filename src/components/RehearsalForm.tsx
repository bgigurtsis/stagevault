
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal, Performance } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { performanceService } from "@/services/performanceService";

interface RehearsalFormProps {
  rehearsal?: Rehearsal;
  onSubmit: (rehearsal: Omit<Rehearsal, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  performanceId?: string; // Optional: pre-selected performance ID
}

export default function RehearsalForm({ rehearsal, onSubmit, performanceId }: RehearsalFormProps) {
  const [title, setTitle] = useState(rehearsal?.title || "");
  const [description, setDescription] = useState(rehearsal?.description || "");
  const [date, setDate] = useState<Date | undefined>(
    rehearsal?.date ? new Date(rehearsal.date) : new Date()
  );
  const [location, setLocation] = useState(rehearsal?.location || "");
  const [notes, setNotes] = useState(rehearsal?.notes || "");
  const [selectedPerformanceId, setSelectedPerformanceId] = useState(performanceId || rehearsal?.performanceId || "");
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch available performances
  useEffect(() => {
    const fetchPerformances = async () => {
      try {
        const data = await performanceService.getAllPerformances();
        setPerformances(data);
        // If no performance is selected and we have performances, select the first one
        if (!selectedPerformanceId && data.length > 0 && !performanceId) {
          setSelectedPerformanceId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching performances:", error);
        toast({
          title: "Error",
          description: "Failed to load performances. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchPerformances();
  }, [performanceId, selectedPerformanceId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !selectedPerformanceId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        title,
        description,
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        location,
        notes,
        performanceId: selectedPerformanceId,
        taggedUsers: [],
      });

      toast({
        title: "Success",
        description: `Rehearsal ${rehearsal ? "updated" : "created"} successfully.`,
      });

      // Navigate back to the rehearsals list or the performance details
      if (performanceId) {
        navigate(`/performances/${performanceId}`);
      } else {
        navigate("/rehearsals");
      }
    } catch (error) {
      console.error("Error submitting rehearsal:", error);
      toast({
        title: "Error",
        description: `Failed to ${rehearsal ? "update" : "create"} rehearsal. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {!performanceId && (
          <div className="space-y-2">
            <Label htmlFor="performanceId">Performance</Label>
            <Select
              value={selectedPerformanceId}
              onValueChange={setSelectedPerformanceId}
              disabled={!!performanceId}
            >
              <SelectTrigger id="performanceId">
                <SelectValue placeholder="Select a performance" />
              </SelectTrigger>
              <SelectContent>
                {performances.map((performance) => (
                  <SelectItem key={performance.id} value={performance.id}>
                    {performance.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Rehearsal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the purpose of this rehearsal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Where will this rehearsal take place?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any special instructions or notes for this rehearsal"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => performanceId ? navigate(`/performances/${performanceId}`) : navigate("/rehearsals")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : rehearsal ? "Update Rehearsal" : "Create Rehearsal"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
