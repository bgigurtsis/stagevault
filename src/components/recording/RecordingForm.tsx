
import { useState, useEffect } from "react";
import { 
  Save, 
  Plus,
  ChevronDown,
  ChevronUp,
  X, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { Performance, Rehearsal } from "@/types";

interface RecordingFormProps {
  isVisible: boolean;
  recordingTime: number;
  onSaveRecording: () => void;
  isUploading: boolean;
  uploadComplete: boolean;
  className?: string;
  isMobile: boolean;
  onToggleVisibility?: () => void;
}

export function RecordingForm({
  isVisible,
  recordingTime,
  onSaveRecording,
  isUploading,
  uploadComplete,
  className = "",
  isMobile,
  onToggleVisibility
}: RecordingFormProps) {
  const [title, setTitle] = useState("");
  const [selectedPerformance, setSelectedPerformance] = useState("");
  const [selectedRehearsal, setSelectedRehearsal] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [availableRehearsals, setAvailableRehearsals] = useState<Rehearsal[]>([]);
  const [isCreatingPerformance, setIsCreatingPerformance] = useState(false);
  const [isCreatingRehearsal, setIsCreatingRehearsal] = useState(false);
  const [newPerformanceTitle, setNewPerformanceTitle] = useState("");
  const [newRehearsalTitle, setNewRehearsalTitle] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Generate a default title based on current date/time
  useEffect(() => {
    if (!title) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const formattedTime = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      setTitle(`Recording - ${formattedDate} ${formattedTime}`);
    }
  }, [title]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const performanceData = await performanceService.getPerformances();
        setPerformances(performanceData);
        
        if (performanceData.length > 0 && !selectedPerformance) {
          // Select the most recent performance by default
          const mostRecentPerformance = performanceData[0];
          setSelectedPerformance(mostRecentPerformance.id);
          
          // Fetch and set rehearsals for this performance
          const rehearsalData = await rehearsalService.getRehearsalsByPerformance(mostRecentPerformance.id);
          setAvailableRehearsals(rehearsalData);
          
          // Select the most recent rehearsal by default
          if (rehearsalData.length > 0) {
            setSelectedRehearsal(rehearsalData[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load performances and rehearsals.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);
  
  useEffect(() => {
    const updateRehearsals = async () => {
      if (selectedPerformance) {
        try {
          const rehearsals = await rehearsalService.getRehearsalsByPerformance(selectedPerformance);
          setAvailableRehearsals(rehearsals);
          
          if (rehearsals.length > 0 && !selectedRehearsal) {
            setSelectedRehearsal(rehearsals[0].id);
          }
        } catch (error) {
          console.error("Error fetching rehearsals for performance:", error);
        }
      }
    };

    updateRehearsals();
  }, [selectedPerformance, selectedRehearsal]);
  
  const handleCreatePerformance = async () => {
    if (!newPerformanceTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the new performance.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newPerformance = await performanceService.createPerformance({
        title: newPerformanceTitle,
        startDate: new Date().toISOString().split('T')[0],
      });
      
      toast({
        title: "Success",
        description: "New performance created successfully.",
      });
      
      setPerformances(prev => [newPerformance, ...prev]);
      setSelectedPerformance(newPerformance.id);
      setIsCreatingPerformance(false);
      setNewPerformanceTitle("");
      
    } catch (error) {
      console.error("Error creating performance:", error);
      toast({
        title: "Error",
        description: "Failed to create new performance.",
        variant: "destructive",
      });
    }
  };
  
  const handleCreateRehearsal = async () => {
    if (!selectedPerformance) {
      toast({
        title: "Performance required",
        description: "Please select a performance first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newRehearsalTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the new rehearsal.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const newRehearsal = await rehearsalService.createRehearsal({
        performanceId: selectedPerformance,
        title: newRehearsalTitle,
        date: today,
        notes: `Created during recording on ${today}`
      });
      
      toast({
        title: "Success",
        description: "New rehearsal created successfully.",
      });
      
      setAvailableRehearsals(prev => [newRehearsal, ...prev]);
      setSelectedRehearsal(newRehearsal.id);
      setIsCreatingRehearsal(false);
      setNewRehearsalTitle("");
      
    } catch (error) {
      console.error("Error creating rehearsal:", error);
      toast({
        title: "Error",
        description: "Failed to create new rehearsal.",
        variant: "destructive",
      });
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (!isVisible && isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-3 shadow-lg rounded-t-2xl z-40">
        <Button 
          variant="outline" 
          className="w-full flex justify-between items-center" 
          onClick={onToggleVisibility}
        >
          <span>Add recording details</span>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {isMobile && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Recording Details</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleVisibility}
            className="h-8 w-8"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="title">Recording Title *</Label>
        <Input
          id="title"
          placeholder="Enter a title for this recording"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="performance">Performance *</Label>
        {!isCreatingPerformance ? (
          <Select
            value={selectedPerformance}
            onValueChange={(value) => {
              if (value === "create-new") {
                setIsCreatingPerformance(true);
              } else {
                setSelectedPerformance(value);
              }
            }}
          >
            <SelectTrigger id="performance">
              <SelectValue placeholder="Select a performance" />
            </SelectTrigger>
            <SelectContent>
              {performances.map((performance) => (
                <SelectItem key={performance.id} value={performance.id}>
                  {performance.title}
                </SelectItem>
              ))}
              <SelectItem value="create-new" className="text-primary">
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Performance
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="bg-accent/30 p-3 rounded-md space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Create New Performance</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsCreatingPerformance(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={newPerformanceTitle}
              onChange={(e) => setNewPerformanceTitle(e.target.value)}
              placeholder="Enter performance title"
              className="border-primary"
            />
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleCreatePerformance}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Performance
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="rehearsal">Rehearsal *</Label>
        {!isCreatingRehearsal ? (
          <Select
            value={selectedRehearsal}
            onValueChange={(value) => {
              if (value === "create-new") {
                setIsCreatingRehearsal(true);
              } else {
                setSelectedRehearsal(value);
              }
            }}
            disabled={!selectedPerformance}
          >
            <SelectTrigger id="rehearsal">
              <SelectValue placeholder={selectedPerformance ? "Select a rehearsal" : "Select a performance first"} />
            </SelectTrigger>
            <SelectContent>
              {availableRehearsals.map((rehearsal) => (
                <SelectItem key={rehearsal.id} value={rehearsal.id}>
                  {rehearsal.title}
                </SelectItem>
              ))}
              <SelectItem value="create-new" className="text-primary">
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Create New Rehearsal
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="bg-accent/30 p-3 rounded-md space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Create New Rehearsal</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsCreatingRehearsal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={newRehearsalTitle}
              onChange={(e) => setNewRehearsalTitle(e.target.value)}
              placeholder="Enter rehearsal title"
              className="border-primary"
            />
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleCreateRehearsal}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Rehearsal
            </Button>
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        type="button"
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="w-full justify-between"
      >
        <span>Advanced Options</span>
        {advancedOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      
      {advancedOpen && (
        <>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this recording"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Add tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              E.g., solo, group, needs work
            </p>
          </div>
        </>
      )}
      
      <div className="flex items-center text-sm text-muted-foreground mb-2">
        <span>Recording length: {formatTime(recordingTime)}</span>
      </div>
      
      <Button 
        onClick={onSaveRecording} 
        className="w-full" 
        disabled={isUploading || !title || !selectedRehearsal}
      >
        <Save className="mr-2 h-4 w-4" />
        {uploadComplete ? "Saved" : isUploading ? "Uploading..." : "Save Recording"}
      </Button>
    </div>
  );
}
