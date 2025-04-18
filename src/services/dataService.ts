
import { Performance, Rehearsal, Recording } from "@/types";
import { performanceService, CreatePerformanceData, UpdatePerformanceData } from "./performanceService";
import { rehearsalService, CreateRehearsalData, UpdateRehearsalData } from "./rehearsalService";
import { recordingService, CreateRecordingData, UpdateRecordingData } from "./recordingService";

// Re-export all the types with 'export type' syntax
export type { 
  CreatePerformanceData,
  UpdatePerformanceData,
  CreateRehearsalData,
  UpdateRehearsalData,
  CreateRecordingData,
  UpdateRecordingData
};

// Create a facade class that delegates to the specialized services
class DataService {
  // Performance methods
  getPerformances(): Promise<Performance[]> {
    return performanceService.getPerformances();
  }
  
  getPerformanceById(id: string): Promise<Performance | null> {
    return performanceService.getPerformanceById(id);
  }
  
  createPerformance(performanceData: CreatePerformanceData): Promise<Performance | null> {
    return performanceService.createPerformance(performanceData);
  }
  
  updatePerformance(performanceData: UpdatePerformanceData): Promise<Performance | null> {
    return performanceService.updatePerformance(performanceData);
  }
  
  deletePerformance(id: string): Promise<boolean> {
    return performanceService.deletePerformance(id);
  }
  
  // Rehearsal methods
  getRehearsalsByPerformance(performanceId: string): Promise<Rehearsal[]> {
    return rehearsalService.getRehearsalsByPerformance(performanceId);
  }
  
  getRehearsalById(id: string): Promise<Rehearsal | null> {
    return rehearsalService.getRehearsalById(id);
  }
  
  createRehearsal(rehearsalData: CreateRehearsalData): Promise<Rehearsal | null> {
    return rehearsalService.createRehearsal(rehearsalData);
  }
  
  // Update to match the signature in rehearsalService
  updateRehearsal(rehearsalData: UpdateRehearsalData): Promise<Rehearsal | null> {
    return rehearsalService.updateRehearsal(rehearsalData);
  }
  
  deleteRehearsal(id: string): Promise<boolean> {
    return rehearsalService.deleteRehearsal(id);
  }
  
  // Add an alias for getRehearsals to fix references to getAllRehearsals
  getRehearsals(): Promise<Rehearsal[]> {
    return rehearsalService.getRehearsals();
  }
  
  getAllRehearsals(): Promise<Rehearsal[]> {
    return rehearsalService.getRehearsals();
  }
  
  // Recording methods
  getRecentRecordings(limit?: number): Promise<Recording[]> {
    return recordingService.getRecentRecordings(limit);
  }
  
  getRecordingsByRehearsalId(rehearsalId: string): Promise<Recording[]> {
    return recordingService.getRecordingsByRehearsalId(rehearsalId);
  }
  
  getRecordingById(id: string): Promise<Recording | null> {
    return recordingService.getRecordingById(id);
  }
  
  createRecording(recordingData: CreateRecordingData): Promise<Recording | null> {
    return recordingService.createRecording(recordingData);
  }
  
  updateRecording(recordingData: UpdateRecordingData): Promise<Recording | null> {
    return recordingService.updateRecording(recordingData);
  }
  
  deleteRecording(id: string): Promise<boolean> {
    return recordingService.deleteRecording(id);
  }
}

export const dataService = new DataService();
