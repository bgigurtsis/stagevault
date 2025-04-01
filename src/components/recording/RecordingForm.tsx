import { useState, useEffect, useRef } from "react";
import { 
  Save, 
  Plus,
  ChevronDown,
  ChevronUp,
  X, 
  GripHorizontal
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
import { useAuth } from "@/hooks/useAuthContext";
import MobileSwipeGesture from "@/components/MobileSwipeGesture";

// Define form states
enum FormVisibilityState {
  HIDDEN = 'hidden',
  PARTIAL = 'partial',
  FULL = 'full'
}

interface RecordingFormProps {
  isVisible: boolean;
  recordingTime: number;
  onSaveRecording: () => void;
  isUploading: boolean;
  uploadComplete: boolean;
  className?: string;
  isMobile: boolean;
  onToggleVisibility?: () => void;
  performanceId?: string;
  rehearsalId?: string;
  onCancel?: () => void;
}

export function RecordingForm({
  isVisible,
  recordingTime,
  onSaveRecording,
  isUploading,
  uploadComplete,
  className = "",
  isMobile,
  onToggleVisibility,
  performanceId,
  rehearsalId,
  onCancel
}: RecordingFormProps) {
  const [title, setTitle] = useState("");
  const [selectedPerformance, setSelectedPerformance] = useState(performanceId || "");
  const [selectedRehearsal, setSelectedRehearsal] = useState(rehearsalId || "");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [availableRehearsals, setAvailableRehearsals] = useState<Rehearsal[]>([]);
  const [isCreatingPerformance, setIsCreatingPerformance] = useState(false);
  const [isCreatingRehearsal, setIsCreatingRehearsal] = useState(false);
  const [newPerformanceTitle, setNewPerformanceTitle] = useState("");
  const [newRehearsalTitle, setNewRehearsalTitle] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormVisibilityState>(
    isVisible ? FormVisibilityState.FULL : FormVisibilityState.HIDDEN
  );
  
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Handle swipe gestures
  const handleSwipeUp = () => {
    if (formState === FormVisibilityState.HIDDEN) {
      setFormState(FormVisibilityState.PARTIAL);
    } else if (formState === FormVisibilityState.PARTIAL) {
      setFormState(FormVisibilityState.FULL);
    }
  };
  
  const handleSwipeDown = () => {
    if (formState === FormVisibilityState.FULL) {
      setFormState(FormVisibilityState.PARTIAL);
    } else if (formState === FormVisibilityState.PARTIAL) {
      setFormState(FormVisibilityState.HIDDEN);
    }
  };
  
  const toggleFormState = () => {
    if (formState === FormVisibilityState.HIDDEN) {
      setFormState(FormVisibilityState.PARTIAL);
    } else if (formState === FormVisibilityState.PARTIAL) {
      setFormState(FormVisibilityState.FULL);
    } else {
      setFormState(FormVisibilityState.PARTIAL);
    }
  };
  
  // Generate smart default title
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
  
  // Update form state based on isVisible prop
  useEffect(() => {
    if (isVisible) {
      setFormState(FormVisibilityState.FULL);
    } else if (formState !== FormVisibilityState.HIDDEN) {
      setFormState(FormVisibilityState.HIDDEN);
    }
  }, [isVisible]);
  
  // Load performances and rehearsals with error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("RecordingForm: Fetching performances and rehearsals");
        console.log("Initial performanceId:", performanceId);
        console.log("Initial rehearsalId:", rehearsalId);
        
        setFormError(null);
        const performanceData = await performanceService.getPerformances();
        console.log("Fetched performances:", performanceData);
        setPerformances(performanceData);
        
        // If we have a performance ID from props, prioritize it
        const initialPerformanceId = performanceId || 
          (performanceData.length > 0 && !selectedPerformance ? performanceData[0].id : null);
        
        if (initialPerformanceId) {
          console.log("Setting selected performance:", initialPerformanceId);
          setSelectedPerformance(initialPerformanceId);
          
          const rehearsalData = await rehearsalService.getRehearsalsByPerformance(initialPerformanceId);
          console.log("Fetched rehearsals for performance:", rehearsalData);
          setAvailableRehearsals(rehearsalData);
          
          // If we have a rehearsal ID from props, prioritize it
          const initialRehearsalId = rehearsalId || 
            (rehearsalData.length > 0 && !selectedRehearsal ? rehearsalData[0].id : null);
            
          if (initialRehearsalId) {
            console.log("Setting selected rehearsal:", initialRehearsalId);
            setSelectedRehearsal(initialRehearsalId);
          }
        }
      } catch (error) {
        console.error("Error fetching performances and rehearsals:", error);
        setFormError("Failed to load performances and rehearsals");
        toast({
          title: "Error",
          description: "Failed to load performances and rehearsals.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast, performanceId, rehearsalId, selectedPerformance]);
  
  // Handle performance change and load associated rehearsals
  useEffect(() => {
    const updateRehearsals = async () => {
      if (selectedPerformance) {
        try {
          console.log("Updating rehearsals for performance:", selectedPerformance);
          setFormError(null);
          const rehearsals = await rehearsalService.getRehearsalsByPerformance(selectedPerformance);
          console.log("Rehearsals updated:", rehearsals);
          setAvailableRehearsals(rehearsals);
          
          // Only auto-select the first rehearsal if none is selected and we're not using a fixed rehearsal ID
          if (rehearsals.length > 0 && !selectedRehearsal) {
            console.log("Auto-selecting first rehearsal:", rehearsals[0].id);
            setSelectedRehearsal(rehearsals[0].id);
          }
        } catch (error) {
          console.error("Error fetching rehearsals for performance:", error);
          setFormError("Failed to load rehearsals for this performance");
        }
      }
    };

    updateRehearsals();
  }, [selectedPerformance, selectedRehearsal]);

  // Enhanced create performance function with better error handling
  const createPerformanceHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPerformanceTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the new performance.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to create a performance.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Creating new performance:", newPerformanceTitle);
      setIsSubmitting(true);
      
      const newPerformance = await performanceService.createPerformance({
        title: newPerformanceTitle,
        startDate: new Date().toISOString().split('T')[0],
        createdBy: user?.id || "",
        userId: user?.id || ""
      });
      
      console.log("New performance created:", newPerformance);
      
      if (!newPerformance) {
        throw new Error("Failed to create performance");
      }
      
      // Update the local state with the new performance
      setPerformances(prev => [newPerformance, ...prev]);
      setSelectedPerformance(newPerformance.id);
      setIsCreatingPerformance(false);
      setNewPerformanceTitle("");
      
      toast({
        title: "Success",
        description: "New performance created successfully.",
      });
    } catch (error) {
      console.error("Error creating performance:", error);
      setFormError("Failed to create new performance");
      toast({
        title: "Error",
        description: "Failed to create new performance.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Enhanced create rehearsal function with better error handling
  const handleCreateRehearsal = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      console.log("Creating new rehearsal:", newRehearsalTitle, "for performance:", selectedPerformance);
      setIsSubmitting(true);
      
      const today = new Date().toISOString().split('T')[0];
      const newRehearsal = await rehearsalService.createRehearsal({
        performanceId: selectedPerformance,
        title: newRehearsalTitle,
        date: today,
        notes: "Created from recording form."
      });
      
      console.log("New rehearsal created:", newRehearsal);
      
      // Update the local state with the new rehearsal
      setAvailableRehearsals(prev => [newRehearsal, ...prev]);
      setSelectedRehearsal(newRehearsal.id);
      setIsCreatingRehearsal(false);
      setNewRehearsalTitle("");
      
      toast({
        title: "Success",
        description: "New rehearsal created successfully.",
      });
    } catch (error) {
      console.error("Error creating rehearsal:", error);
      setFormError("Failed to create new rehearsal");
      toast({
        title: "Error",
        description: "Failed to create new rehearsal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submit called");
    
    // Validate form fields
    if (!title.trim()) {
      setFormError("Title is required");
      toast({
        title: "Title required",
        description: "Please enter a title for your recording.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedRehearsal) {
      setFormError("Rehearsal is required");
      toast({
        title: "Rehearsal required",
        description: "Please select a rehearsal for this recording.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Form validation passed, proceeding with save");
    setFormError(null);
    onSaveRecording();
  };
  
  // Reset state when the form completes upload
  useEffect(() => {
    if (uploadComplete) {
      console.log("Upload complete, resetting form state");
      setTitle("");
      setNotes("");
      setTags("");
      setFormError(null);
    }
  }, [uploadComplete]);
  
  const getFormStateClass = () => {
    switch (formState) {
      case FormVisibilityState.HIDDEN:
        return "form-state-hidden";
      case FormVisibilityState.PARTIAL:
        return "form-state-partial";
      case FormVisibilityState.FULL:
        return "form-state-full";
      default:
        return "";
    }
  };
  
  return (
    <MobileSwipeGesture 
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      className={`recording-metadata ${className}`}
    >
      <div 
        ref={formRef}
        className={`recording-form-container ${getFormStateClass()}`}
      >
        <div className="recording-form-handle-container" onClick={toggleFormState}>
          <div className="recording-form-handle"></div>
          <GripHorizontal className="h-4 w-4 text-gray-400 mx-auto mt-1" />
        </div>
        
        <div className="form-content">
          <div className="form-header flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recording Details</h2>
            {onToggleVisibility && (
              <button onClick={onToggleVisibility} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              <p className="text-sm">{formError}</p>
            </div>
          )}
          
          <div className="space-y-4" onChange={(e) => setFormError(null)}>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter recording title"
                disabled={isUploading || isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="performance">Performance</Label>
              {isCreatingPerformance ? (
                <div className="flex flex-col gap-2">
                  <Input 
                    id="new-performance" 
                    value={newPerformanceTitle} 
                    onChange={(e) => setNewPerformanceTitle(e.target.value)} 
                    placeholder="New performance title"
                    disabled={isUploading || isSubmitting}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="default"
                      onClick={createPerformanceHandler}
                      disabled={isUploading || isSubmitting}
                    >
                      Create
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsCreatingPerformance(false)}
                      disabled={isUploading || isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select 
                    name="performance"
                    value={selectedPerformance} 
                    onValueChange={setSelectedPerformance}
                    disabled={isUploading || isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a performance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-performance" className="font-medium text-primary">
                        + New Performance
                      </SelectItem>
                      <SelectItem value="" disabled className="font-semibold text-muted-foreground">
                        Your Performances
                      </SelectItem>
                      {performances.map(performance => (
                        <SelectItem key={performance.id} value={performance.id}>
                          {performance.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="rehearsal">Rehearsal</Label>
              {isCreatingRehearsal ? (
                <div className="flex flex-col gap-2">
                  <Input 
                    id="new-rehearsal" 
                    value={newRehearsalTitle} 
                    onChange={(e) => setNewRehearsalTitle(e.target.value)} 
                    placeholder="New rehearsal title"
                    disabled={isUploading || isSubmitting}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="default"
                      onClick={handleCreateRehearsal}
                      disabled={isUploading || isSubmitting || !selectedPerformance}
                    >
                      Create
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsCreatingRehearsal(false)}
                      disabled={isUploading || isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select 
                    name="rehearsal"
                    value={selectedRehearsal} 
                    onValueChange={setSelectedRehearsal}
                    disabled={isUploading || isSubmitting || !selectedPerformance}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a rehearsal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-rehearsal" className="font-medium text-primary">
                        + New Rehearsal
                      </SelectItem>
                      <SelectItem value="" disabled className="font-semibold text-muted-foreground">
                        Rehearsals
                      </SelectItem>
                      {availableRehearsals.map(rehearsal => (
                        <SelectItem key={rehearsal.id} value={rehearsal.id}>
                          {rehearsal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div>
              <button
                type="button"
                className="flex items-center text-sm font-medium text-primary mb-2"
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                {advancedOpen ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                {advancedOpen ? "Hide advanced options" : "Show advanced options"}
              </button>
              
              {advancedOpen && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      name="notes"
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Add notes about this recording"
                      rows={3}
                      disabled={isUploading || isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input 
                      id="tags" 
                      name="tags"
                      value={tags} 
                      onChange={(e) => setTags(e.target.value)} 
                      placeholder="e.g. solo, act1, blocking"
                      disabled={isUploading || isSubmitting}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading || isSubmitting}
              onClick={handleSubmit}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Recording
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={isUploading || isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            {(isUploading || isSubmitting) && (
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Please don't navigate away while saving...
              </p>
            )}
          </div>
        </div>
      </div>
    </MobileSwipeGesture>
  );
}
