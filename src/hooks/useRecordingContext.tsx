
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { performanceService } from '@/services/performanceService';
import { rehearsalService } from '@/services/rehearsalService';
import { Performance, Rehearsal } from '@/types';

// Define the context types
interface RecordingContextType {
  selectedPerformanceId: string | null;
  selectedRehearsalId: string | null;
  selectedPerformance: Performance | null;
  selectedRehearsal: Rehearsal | null;
  performances: Performance[];
  rehearsals: Rehearsal[];
  isLoading: boolean;
  error: string | null;
  setSelectedPerformanceId: (id: string | null) => void;
  setSelectedRehearsalId: (id: string | null) => void;
  refreshContext: () => Promise<void>;
}

// Create the context
const RecordingContext = createContext<RecordingContextType | null>(null);

// Provider component
export const RecordingContextProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const [selectedRehearsalId, setSelectedRehearsalId] = useState<string | null>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Extract any IDs from URL
  useEffect(() => {
    const performanceIdFromUrl = params.performanceId || queryParams.get('performanceId');
    const rehearsalIdFromUrl = params.rehearsalId || queryParams.get('rehearsalId');
    
    if (performanceIdFromUrl) {
      setSelectedPerformanceId(performanceIdFromUrl);
    }
    
    if (rehearsalIdFromUrl) {
      setSelectedRehearsalId(rehearsalIdFromUrl);
    }
  }, [params, queryParams]);
  
  // Load data based on selected IDs
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Always load performances
        const performancesData = await performanceService.getPerformances();
        setPerformances(performancesData);
        
        // Load specific performance if ID is set
        if (selectedPerformanceId) {
          const performance = await performanceService.getPerformanceById(selectedPerformanceId);
          setSelectedPerformance(performance);
          
          // Load rehearsals for this performance
          const rehearsalsData = await rehearsalService.getRehearsalsByPerformance(selectedPerformanceId);
          setRehearsals(rehearsalsData);
          
          // Load specific rehearsal if ID is set
          if (selectedRehearsalId) {
            const rehearsal = await rehearsalService.getRehearsalById(selectedRehearsalId);
            setSelectedRehearsal(rehearsal);
          } else {
            setSelectedRehearsal(null);
          }
        } else {
          setSelectedPerformance(null);
          setRehearsals([]);
          setSelectedRehearsal(null);
        }
      } catch (err) {
        setError('Failed to load recording context data');
        console.error('Error loading recording context:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedPerformanceId, selectedRehearsalId]);
  
  // When performance changes, clear rehearsal selection
  useEffect(() => {
    if (selectedPerformanceId && rehearsals.length > 0 && !selectedRehearsalId) {
      // Auto-select first rehearsal if none is selected
      setSelectedRehearsalId(rehearsals[0].id);
    }
  }, [selectedPerformanceId, rehearsals, selectedRehearsalId]);
  
  // Function to manually refresh context
  const refreshContext = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Reload performances
      const performancesData = await performanceService.getPerformances();
      setPerformances(performancesData);
      
      // Reload current performance if any
      if (selectedPerformanceId) {
        const performance = await performanceService.getPerformanceById(selectedPerformanceId);
        setSelectedPerformance(performance);
        
        // Reload rehearsals
        const rehearsalsData = await rehearsalService.getRehearsalsByPerformance(selectedPerformanceId);
        setRehearsals(rehearsalsData);
        
        // Reload current rehearsal if any
        if (selectedRehearsalId) {
          const rehearsal = await rehearsalService.getRehearsalById(selectedRehearsalId);
          setSelectedRehearsal(rehearsal);
        }
      }
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Error refreshing recording context:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const value: RecordingContextType = {
    selectedPerformanceId,
    selectedRehearsalId,
    selectedPerformance,
    selectedRehearsal,
    performances,
    rehearsals,
    isLoading,
    error,
    setSelectedPerformanceId,
    setSelectedRehearsalId,
    refreshContext
  };
  
  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

// Custom hook to use the context
export const useRecordingContext = () => {
  const context = useContext(RecordingContext);
  
  if (context === null) {
    throw new Error('useRecordingContext must be used within a RecordingContextProvider');
  }
  
  return context;
};
