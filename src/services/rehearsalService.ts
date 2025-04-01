
import { Rehearsal } from "@/types";
import { dataService } from "./dataService";

// Define data types for creating and updating rehearsals
export interface CreateRehearsalData {
  performanceId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  notes?: string;
  taggedUsers?: string[];
}

export interface UpdateRehearsalData {
  performanceId?: string;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  notes?: string;
  taggedUsers?: string[];
}

// Add a getRecentRehearsals method that Dashboard.tsx is trying to use
const getRecentRehearsals = async (limit: number = 3): Promise<Rehearsal[]> => {
  try {
    const response = await dataService.get(`/rehearsals?_sort=date:DESC&_limit=${limit}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching recent rehearsals:", error);
    return [];
  }
};

// Add the missing getRehearsalsByPerformance function
const getRehearsalsByPerformance = async (performanceId: string): Promise<Rehearsal[]> => {
  try {
    const response = await dataService.get(`/rehearsals?performanceId=${performanceId}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error(`Error fetching rehearsals for performance ${performanceId}:`, error);
    return [];
  }
};

// Assuming there's an existing getRehearsals method that needs to be kept
const getRehearsals = async (): Promise<Rehearsal[]> => {
  try {
    const response = await dataService.get("/rehearsals");
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching rehearsals:", error);
    return [];
  }
};

const getRehearsalById = async (id: string): Promise<Rehearsal | null> => {
  try {
    const response = await dataService.get(`/rehearsals/${id}`);
    return response as Rehearsal || null;
  } catch (error) {
    console.error(`Error fetching rehearsal with ID ${id}:`, error);
    return null;
  }
};

const createRehearsal = async (rehearsalData: CreateRehearsalData): Promise<Rehearsal | null> => {
  try {
    const response = await dataService.post('/rehearsals', rehearsalData);
    return response as Rehearsal || null;
  } catch (error) {
    console.error('Error creating rehearsal:', error);
    return null;
  }
};

const updateRehearsal = async (id: string, rehearsalData: Partial<Rehearsal>): Promise<Rehearsal | null> => {
  try {
    const response = await dataService.put(`/rehearsals/${id}`, rehearsalData);
    return response as Rehearsal || null;
  } catch (error) {
    console.error(`Error updating rehearsal with ID ${id}:`, error);
    return null;
  }
};

const deleteRehearsal = async (id: string): Promise<boolean> => {
  try {
    await dataService.delete(`/rehearsals/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting rehearsal with ID ${id}:`, error);
    return false;
  }
};

export const rehearsalService = {
  getRehearsals,
  getRecentRehearsals,
  getRehearsalsByPerformance,
  getRehearsalById,
  createRehearsal,
  updateRehearsal,
  deleteRehearsal,
};
